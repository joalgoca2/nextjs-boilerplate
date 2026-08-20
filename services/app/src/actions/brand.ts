"use server";

import { parseBrowser, parseDevice } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  createBrandSchema,
  updateBrandSchema,
} from "@/lib/validations/brand";
import type { ApiResponse, Brand } from "@/types";

export interface AdminMetrics {
  totalUsers: number;
  totalBrands: number;
  activeSubscriptions: number;
  brandSubscription?: {
    planName: string;
    status: string;
    endDate: Date | null;
  } | null;
  recentLogins: {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    ip: string | null;
    browser: string | null;
    device: string | null;
    createdAt: Date;
  }[];
  loginsTotal: number;
  loginsTotalPages: number;
  brands: Brand[];
  brandsTotal: number;
  brandsTotalPages: number;
}

export async function getAdminMetrics(params?: {
  brandsPage?: number;
  loginsPage?: number;
  brandId?: string;
  userId?: string;
}): Promise<ApiResponse<AdminMetrics>> {
  try {
    const brandsPage = Math.max(1, params?.brandsPage ?? 1);
    const loginsPage = Math.max(1, params?.loginsPage ?? 1);
    const limit = 5;
    const brandId = params?.brandId;
    const userId = params?.userId;

    const userWhere = brandId ? { brandId } : {};
    const loginWhere: Record<string, unknown> = {};
    if (userId) {
      loginWhere.userId = userId;
    } else if (brandId) {
      loginWhere.user = { brandId };
    }

    const [
      totalUsers,
      totalBrands,
      activeSubscriptions,
      loginsTotal,
      recentLoginsRaw,
      brands,
      activeSub,
    ] = await Promise.all([
      prisma.user.count({ where: userWhere }),
      prisma.brand.count(),
      prisma.subscription.count({
        where: {
          status: "ACTIVE",
          ...(brandId && { user: { brandId } }),
        },
      }),
      prisma.loginHistory.count({ where: loginWhere }),
      prisma.loginHistory.findMany({
        where: loginWhere,
        take: limit,
        skip: (loginsPage - 1) * limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.brand.findMany({
        take: limit,
        skip: (brandsPage - 1) * limit,
        orderBy: { createdAt: "desc" },
      }),
      brandId
        ? prisma.subscription.findFirst({
            where: {
              status: "ACTIVE",
              user: { brandId },
            },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve(null),
    ]);

    const brandSubscription = activeSub
      ? {
          planName: activeSub.planName,
          status: activeSub.status,
          endDate: activeSub.endDate,
        }
      : null;

    const recentLogins = recentLoginsRaw.map((log) => {
      const detectedBrowser =
        log.browser ??
        (log.userAgent ? parseBrowser(log.userAgent) : "Navegador Web");
      const detectedDevice =
        log.device ??
        (log.userAgent ? parseDevice(log.userAgent) : "Escritorio");

      let cleanIp = log.ip ?? "127.0.0.1";
      if (cleanIp.includes(",")) {
        cleanIp = cleanIp.split(",")[0].trim();
      }
      if (cleanIp.startsWith("::ffff:")) {
        cleanIp = cleanIp.substring(7);
      }
      if (cleanIp === "::1") {
        cleanIp = "127.0.0.1";
      }

      return {
        id: log.id,
        userId: log.userId,
        userName: log.user.name ?? "Sin Nombre",
        userEmail: log.user.email,
        ip: cleanIp,
        browser: detectedBrowser,
        device: detectedDevice,
        createdAt: log.createdAt,
      };
    });

    return {
      success: true,
      data: {
        totalUsers,
        totalBrands,
        activeSubscriptions,
        brandSubscription,
        recentLogins,
        loginsTotal,
        loginsTotalPages: Math.ceil(loginsTotal / limit),
        brands,
        brandsTotal: totalBrands,
        brandsTotalPages: Math.ceil(totalBrands / limit),
      },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch admin metrics.";
    return { success: false, error: message };
  }
}

export async function getBrandById(
  brandId: string
): Promise<ApiResponse<Brand>> {
  try {
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      return { success: false, error: "Brand not found." };
    }

    return { success: true, data: brand };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch brand.";
    return { success: false, error: message };
  }
}

export async function createBrand(data: {
  name: string;
  description?: string;
  logoUrl?: string;
  defaultLocale?: string;
  timezone?: string;
}): Promise<ApiResponse<Brand>> {
  try {
    const parsed = createBrandSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
      return { success: false, error: firstError };
    }

    const validData = parsed.data;
    const brand = await prisma.brand.create({
      data: {
        name: validData.name,
        description: validData.description,
        logoUrl: validData.logoUrl,
        defaultLocale: validData.defaultLocale,
        timezone: validData.timezone,
      },
    });

    return { success: true, data: brand };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create brand.";
    return { success: false, error: message };
  }
}

export async function updateBrandSettings(
  brandId: string,
  data: {
    name?: string;
    description?: string;
    logoUrl?: string;
    defaultLocale?: string;
    timezone?: string;
  }
): Promise<ApiResponse<Brand>> {
  try {
    const parsed = updateBrandSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
      return { success: false, error: firstError };
    }

    const validData = parsed.data;
    const brand = await prisma.brand.update({
      where: { id: brandId },
      data: {
        ...(validData.name && { name: validData.name }),
        ...(validData.description !== undefined && {
          description: validData.description,
        }),
        ...(validData.logoUrl !== undefined && {
          logoUrl: validData.logoUrl,
        }),
        ...(validData.defaultLocale && {
          defaultLocale: validData.defaultLocale,
        }),
        ...(validData.timezone && { timezone: validData.timezone }),
      },
    });

    return { success: true, data: brand };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update brand settings.";
    return { success: false, error: message };
  }
}

export async function getBrandsList(): Promise<
  ApiResponse<{ id: string; name: string }[]>
> {
  try {
    const brands = await prisma.brand.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: brands };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch brands list.";
    return { success: false, error: message };
  }
}

export interface BrandWithUsersCount extends Brand {
  usersCount: number;
}

export async function getBrandsCatalog(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<
  ApiResponse<{
    brands: BrandWithUsersCount[];
    total: number;
    totalPages: number;
  }>
> {
  try {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(50, Math.max(1, params?.limit ?? 10));
    const skip = (page - 1) * limit;
    const search = params?.search?.trim();

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [total, rawBrands] = await Promise.all([
      prisma.brand.count({ where }),
      prisma.brand.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { users: true },
          },
        },
      }),
    ]);

    const brands: BrandWithUsersCount[] = rawBrands.map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      logoUrl: b.logoUrl,
      defaultLocale: b.defaultLocale,
      timezone: b.timezone,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      usersCount: b._count.users,
    }));

    return {
      success: true,
      data: {
        brands,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch brands catalog.";
    return { success: false, error: message };
  }
}
