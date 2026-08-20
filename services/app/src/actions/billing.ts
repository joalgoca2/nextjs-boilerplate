"use server";

import { toUtcDate } from "@/lib/date";
import { getPaymentProvider } from "@/lib/payment";
import { prisma } from "@/lib/prisma";
import { triggerOutboundWebhook } from "@/lib/webhook";
import {
  exchangeRateSchema,
  paymentSchema,
  planConfigSchema,
  subscriptionSchema,
  type ExchangeRateInput,
  type PaymentInput,
  type SubscriptionInput,
} from "@/lib/validations/billing";
import type {
  ApiResponse,
  ExchangeRate,
  Payment,
  PlanConfig,
  Subscription,
} from "@/types";

const CORE_PLANS = ["Free", "Pro", "Enterprise"];

export async function getPlanConfigs(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<
  ApiResponse<{ plans: PlanConfig[]; total: number; totalPages: number }>
> {
  try {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(50, Math.max(1, params?.limit ?? 10));
    const skip = (page - 1) * limit;
    const search = params?.search?.trim();

    const where = search
      ? { planName: { contains: search, mode: "insensitive" as const } }
      : {};

    const [total, rawPlans] = await Promise.all([
      prisma.planConfig.count({ where }),
      prisma.planConfig.findMany({
        where,
        orderBy: { priceMonthly: "asc" },
        skip,
        take: limit,
      }),
    ]);

    const plans: PlanConfig[] = rawPlans.map((p) => ({
      id: p.id,
      planName: p.planName,
      priceMonthly: p.priceMonthly,
      priceYearly: p.priceYearly,
      currency: p.currency ?? "USD",
      maxProjects: p.maxProjects,
      allowCSVImportExport: p.allowCSVImportExport,
      hasLiveSupport: p.hasLiveSupport,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return {
      success: true,
      data: {
        plans,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch plan configs.";
    return { success: false, error: message };
  }
}

export async function createPlanConfig(data: {
  planName: string;
  priceMonthly: number;
  priceYearly: number;
  currency?: string;
  maxProjects: number;
  allowCSVImportExport: boolean;
  hasLiveSupport: boolean;
}): Promise<ApiResponse<PlanConfig>> {
  try {
    const parsed = planConfigSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Entrada inválida.";
      return { success: false, error: firstError };
    }

    const { planName } = parsed.data;
    const existing = await prisma.planConfig.findUnique({
      where: { planName },
    });

    if (existing) {
      return { success: false, error: `El plan ${planName} ya existe.` };
    }

    const created = await prisma.planConfig.create({
      data: parsed.data,
    });

    return {
      success: true,
      data: created,
      message: "Plan creado exitosamente.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create plan config.";
    return { success: false, error: message };
  }
}

export async function updatePlanConfig(
  id: string,
  data: {
    planName: string;
    priceMonthly: number;
    priceYearly: number;
    currency?: string;
    maxProjects: number;
    allowCSVImportExport: boolean;
    hasLiveSupport: boolean;
  }
): Promise<ApiResponse<PlanConfig>> {
  try {
    const parsed = planConfigSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Entrada inválida.";
      return { success: false, error: firstError };
    }

    const updated = await prisma.planConfig.update({
      where: { id },
      data: parsed.data,
    });

    return {
      success: true,
      data: updated,
      message: "Plan actualizado exitosamente.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update plan config.";
    return { success: false, error: message };
  }
}

export async function deletePlanConfig(id: string): Promise<ApiResponse<null>> {
  try {
    const existing = await prisma.planConfig.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Plan no encontrado." };
    }

    if (CORE_PLANS.includes(existing.planName)) {
      return {
        success: false,
        error:
          "Los planes base del sistema (Free, Pro, Enterprise) no se pueden eliminar.",
      };
    }

    await prisma.planConfig.delete({ where: { id } });
    return {
      success: true,
      data: null,
      message: "Plan eliminado exitosamente.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete plan config.";
    return { success: false, error: message };
  }
}

export async function getBrandActiveSubscriptionAction(
  brandId: string
): Promise<
  ApiResponse<{
    planName: string;
    status: string;
    endDate?: string | null;
  } | null>
> {
  try {
    const sub = await prisma.subscription.findFirst({
      where: { user: { brandId }, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    if (!sub) {
      return {
        success: true,
        data: { planName: "Plan Gratuito / Base", status: "ACTIVE" },
      };
    }

    return {
      success: true,
      data: {
        planName: sub.planName,
        status: sub.status,
        endDate: sub.endDate ? sub.endDate.toISOString() : null,
      },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch brand subscription.";
    return { success: false, error: message };
  }
}

export async function switchBrandSubscriptionPlanAction(params: {
  userId: string;
  brandId: string;
  newPlanName: string;
}): Promise<ApiResponse<boolean>> {
  try {
    const plan = await prisma.planConfig.findFirst({
      where: { planName: params.newPlanName, isActive: true },
    });

    if (!plan) {
      return { success: false, error: "El plan seleccionado no existe." };
    }

    // Cancel prior active subscriptions for this brand
    await prisma.subscription.updateMany({
      where: { user: { brandId: params.brandId }, status: "ACTIVE" },
      data: { status: "CANCELED" },
    });

    // Create new active subscription
    await prisma.subscription.create({
      data: {
        userId: params.userId,
        planName: plan.planName,
        status: "ACTIVE",
        billingCycle: "MONTHLY",
        price: plan.priceMonthly,
        discount: 0,
        finalPrice: plan.priceMonthly,
        startDate: new Date(),
      },
    });

    return { success: true, data: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al cambiar el plan.";
    return { success: false, error: msg };
  }
}

export async function getUserSubscription(
  userId: string
): Promise<ApiResponse<Subscription | null>> {
  try {
    const sub = await prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: sub };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch subscription.";
    return { success: false, error: message };
  }
}

export async function createSubscription(
  data: SubscriptionInput
): Promise<ApiResponse<Subscription>> {
  try {
    const parsed = subscriptionSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Entrada inválida.";
      return { success: false, error: firstError };
    }

    const {
      userId,
      planName,
      status,
      billingCycle,
      startDate,
      endDate,
      price,
      discount,
      finalPrice,
      timezone,
    } = parsed.data;

    const utcStart = toUtcDate(startDate, timezone);
    const utcEnd = toUtcDate(endDate, timezone);

    if (!utcStart || !utcEnd) {
      return {
        success: false,
        error: "Las fechas de inicio y fin deben ser válidas.",
      };
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planName,
        status,
        billingCycle,
        startDate: utcStart,
        endDate: utcEnd,
        price,
        discount,
        finalPrice,
      },
    });

    prisma.user
      .findUnique({ where: { id: userId }, select: { brandId: true } })
      .then((u) => {
        triggerOutboundWebhook(u?.brandId ?? null, "subscription.created", {
          subscriptionId: subscription.id,
          userId,
          planName,
          finalPrice,
        }).catch(() => {});
      })
      .catch(() => {});

    return {
      success: true,
      data: subscription,
      message: "Suscripción creada exitosamente.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al crear la suscripción.";
    return { success: false, error: message };
  }
}

export async function updateSubscription(
  id: string,
  data: Partial<SubscriptionInput>
): Promise<ApiResponse<Subscription>> {
  try {
    const existing = await prisma.subscription.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Suscripción no encontrada." };
    }

    const timezone = data.timezone ?? "UTC";
    const updateData: Record<string, unknown> = {};

    if (data.planName) updateData.planName = data.planName;
    if (data.status) updateData.status = data.status;
    if (data.billingCycle) updateData.billingCycle = data.billingCycle;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.discount !== undefined) updateData.discount = data.discount;
    if (data.finalPrice !== undefined) updateData.finalPrice = data.finalPrice;

    if (data.startDate) {
      const utcStart = toUtcDate(data.startDate, timezone);
      if (!utcStart) {
        return { success: false, error: "Fecha de inicio inválida." };
      }
      updateData.startDate = utcStart;
    }

    if (data.endDate) {
      const utcEnd = toUtcDate(data.endDate, timezone);
      if (!utcEnd) {
        return { success: false, error: "Fecha de fin inválida." };
      }
      updateData.endDate = utcEnd;
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      data: updated,
      message: "Suscripción actualizada exitosamente.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al actualizar la suscripción.";
    return { success: false, error: message };
  }
}

export async function createPayment(
  data: PaymentInput
): Promise<ApiResponse<Payment>> {
  try {
    const parsed = paymentSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Entrada inválida.";
      return { success: false, error: firstError };
    }

    const {
      userId,
      amount,
      discountApplied,
      paymentDate,
      status,
      billingPeriodStart,
      billingPeriodEnd,
      notes,
      timezone,
    } = parsed.data;

    const utcPaymentDate = toUtcDate(paymentDate, timezone);
    const utcPeriodStart = toUtcDate(billingPeriodStart, timezone);
    const utcPeriodEnd = toUtcDate(billingPeriodEnd, timezone);

    if (!utcPaymentDate || !utcPeriodStart || !utcPeriodEnd) {
      return {
        success: false,
        error: "Las fechas de pago y período deben ser válidas.",
      };
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        discountApplied,
        paymentDate: utcPaymentDate,
        status,
        billingPeriodStart: utcPeriodStart,
        billingPeriodEnd: utcPeriodEnd,
        notes: notes ?? null,
      },
    });

    prisma.user
      .findUnique({ where: { id: userId }, select: { brandId: true } })
      .then((u) => {
        triggerOutboundWebhook(u?.brandId ?? null, "payment.success", {
          paymentId: payment.id,
          userId,
          amount,
          status,
        }).catch(() => {});
      })
      .catch(() => {});

    return {
      success: true,
      data: payment,
      message: "Pago registrado exitosamente.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al registrar el pago.";
    return { success: false, error: message };
  }
}

export async function createCheckoutSession(data: {
  userId: string;
  userEmail: string;
  planName: string;
  price: number;
  billingCycle: "MONTHLY" | "YEARLY";
  successUrl: string;
  cancelUrl: string;
}): Promise<ApiResponse<{ sessionId: string; checkoutUrl: string }>> {
  try {
    const provider = getPaymentProvider();
    const result = await provider.createCheckoutSession(data);

    return {
      success: true,
      data: result,
      message: `Sesión de checkout generada con ${provider.name}.`,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al generar sesión de checkout.";
    return { success: false, error: message };
  }
}

export async function getExchangeRates(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<
  ApiResponse<{ rates: ExchangeRate[]; total: number; totalPages: number }>
> {
  try {
    const prismaAny = prisma as unknown as Record<string, unknown>;
    if (!prismaAny.exchangeRate) {
      return {
        success: false,
        error:
          "El cliente Prisma Client no incluye el modelo ExchangeRate. " +
          "Ejecuta 'make db-generate' y reinicia el contenedor app.",
      };
    }

    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(50, Math.max(1, params?.limit ?? 10));
    const skip = (page - 1) * limit;
    const search = params?.search?.trim();

    const where = search
      ? {
          OR: [
            { code: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [total, rawRates] = await Promise.all([
      prisma.exchangeRate.count({ where }),
      prisma.exchangeRate.findMany({
        where,
        orderBy: { code: "asc" },
        skip,
        take: limit,
      }),
    ]);

    const rates: ExchangeRate[] = rawRates.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      symbol: r.symbol,
      rateAgainstUsd: r.rateAgainstUsd,
      isDefault: r.isDefault,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return {
      success: true,
      data: {
        rates,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al obtener tipos de cambio.";
    return { success: false, error: message };
  }
}

export async function createExchangeRate(
  data: ExchangeRateInput
): Promise<ApiResponse<ExchangeRate>> {
  try {
    const prismaAny = prisma as unknown as Record<string, unknown>;
    if (!prismaAny.exchangeRate) {
      return {
        success: false,
        error: "El modelo ExchangeRate no está disponible en Prisma Client.",
      };
    }

    const parsed = exchangeRateSchema.safeParse(data);
    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message ?? "Entrada inválida.";
      return { success: false, error: firstError };
    }

    const { code } = parsed.data;
    const existing = await prisma.exchangeRate.findUnique({
      where: { code },
    });

    if (existing) {
      return { success: false, error: `La divisa ${code} ya existe.` };
    }

    const created = await prisma.exchangeRate.create({
      data: parsed.data,
    });

    return {
      success: true,
      data: created,
      message: "Tipo de cambio creado exitosamente.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create exchange rate.";
    return { success: false, error: message };
  }
}

export async function updateExchangeRate(
  id: string,
  data: ExchangeRateInput
): Promise<ApiResponse<ExchangeRate>> {
  try {
    const prismaAny = prisma as unknown as Record<string, unknown>;
    if (!prismaAny.exchangeRate) {
      return {
        success: false,
        error: "El modelo ExchangeRate no está disponible en Prisma Client.",
      };
    }

    const parsed = exchangeRateSchema.safeParse(data);
    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message ?? "Entrada inválida.";
      return { success: false, error: firstError };
    }

    const updated = await prisma.exchangeRate.update({
      where: { id },
      data: parsed.data,
    });

    return {
      success: true,
      data: updated,
      message: "Tipo de cambio actualizado exitosamente.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update exchange rate.";
    return { success: false, error: message };
  }
}

export async function deleteExchangeRate(
  id: string
): Promise<ApiResponse<null>> {
  try {
    const prismaAny = prisma as unknown as Record<string, unknown>;
    if (!prismaAny.exchangeRate) {
      return {
        success: false,
        error: "El modelo ExchangeRate no está disponible en Prisma Client.",
      };
    }

    const existing = await prisma.exchangeRate.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Divisa no encontrada." };
    }

    if (existing.code === "USD") {
      return {
        success: false,
        error: "La divisa base del sistema (USD) no se puede eliminar.",
      };
    }

    await prisma.exchangeRate.delete({ where: { id } });
    return {
      success: true,
      data: null,
      message: "Tipo de cambio eliminado exitosamente.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete exchange rate.";
    return { success: false, error: message };
  }
}

