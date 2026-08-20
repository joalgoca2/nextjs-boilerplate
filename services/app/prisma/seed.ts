import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed (Upserts standard)...");

  // 1. Seed Roles
  console.log("  -> Seeding roles...");
  const superAdminRole = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: {},
    create: {
      name: "SUPER_ADMIN",
      description: "System super administrator with unrestricted privileges.",
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
      description: "Administrator role for tenant and user management.",
    },
  });

  await prisma.role.upsert({
    where: { name: "USER" },
    update: {},
    create: {
      name: "USER",
      description: "Standard end-user role.",
    },
  });

  // 2. Seed Permissions
  console.log("  -> Seeding permissions...");
  const permissionsList = [
    { name: "users:manage", description: "Create, edit, and delete users" },
    { name: "users:read", description: "View user list and details" },
    { name: "settings:manage", description: "Configure application settings" },
    { name: "billing:manage", description: "Manage subscriptions and billing" },
  ];

  for (const perm of permissionsList) {
    const createdPerm = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: createdPerm.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: createdPerm.id,
      },
    });
  }

  // 3. Seed Default Brand / Tenant
  console.log("  -> Seeding Brand 'General'...");
  const generalBrand = await prisma.brand.upsert({
    where: { id: "brand-general" },
    update: {
      name: "General",
    },
    create: {
      id: "brand-general",
      name: "General",
    },
  });

  // 4. Seed Initial Admin User
  const hashedPassword = await bcrypt.hash("password123", 10);
  const adminEmail = "admin@remotemonkeys.ai";

  console.log(`  -> Seeding admin user (${adminEmail})...`);
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      brandId: null,
    },
    create: {
      email: adminEmail,
      name: "Admin Global",
      password: hashedPassword,
      isActive: true,
      brandId: null,
    },
  });

  // Remove redundant ADMIN role from SUPER_ADMIN if present
  await prisma.userRole.deleteMany({
    where: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: superAdminRole.id,
    },
  });

  // 4.1 Seed Brand Admin User (brand-general)
  const brandAdminEmail = "admin.brand@remotemonkeys.ai";
  console.log(`  -> Seeding brand admin user (${brandAdminEmail})...`);
  const brandAdminUser = await prisma.user.upsert({
    where: { email: brandAdminEmail },
    update: {
      brandId: generalBrand.id,
    },
    create: {
      email: brandAdminEmail,
      name: "Admin Marca General",
      password: hashedPassword,
      isActive: true,
      brandId: generalBrand.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: brandAdminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: brandAdminUser.id,
      roleId: adminRole.id,
    },
  });

  // 4.2 Seed Standard Brand User (brand-general)
  const userRole = await prisma.role.findUnique({
    where: { name: "USER" },
  });

  const brandUserEmail = "user.brand@remotemonkeys.ai";
  console.log(`  -> Seeding standard brand user (${brandUserEmail})...`);
  const standardBrandUser = await prisma.user.upsert({
    where: { email: brandUserEmail },
    update: {
      brandId: generalBrand.id,
    },
    create: {
      email: brandUserEmail,
      name: "Usuario Marca General",
      password: hashedPassword,
      isActive: true,
      brandId: generalBrand.id,
    },
  });

  if (userRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: standardBrandUser.id,
          roleId: userRole.id,
        },
      },
      update: {},
      create: {
        userId: standardBrandUser.id,
        roleId: userRole.id,
      },
    });
  }

  // 5. Seed Subscription for Admin User
  console.log("  -> Seeding Subscription...");
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  await prisma.subscription.upsert({
    where: { id: "sub-admin-test" },
    update: {},
    create: {
      id: "sub-admin-test",
      userId: adminUser.id,
      planName: "Pro Test",
      status: "ACTIVE",
      billingCycle: "YEARLY",
      startDate: new Date(),
      endDate: oneYearFromNow,
      price: 0,
      discount: 0,
      finalPrice: 0,
    },
  });

  // 6. Seed Plan Configurations
  console.log("  -> Seeding Plan Configurations...");
  await prisma.planConfig.upsert({
    where: { planName: "Free" },
    update: { currency: "USD" },
    create: {
      planName: "Free",
      priceMonthly: 0,
      priceYearly: 0,
      currency: "USD",
      maxProjects: 3,
      allowCSVImportExport: false,
      hasLiveSupport: false,
    },
  });

  await prisma.planConfig.upsert({
    where: { planName: "Pro" },
    update: { currency: "USD" },
    create: {
      planName: "Pro",
      priceMonthly: 19,
      priceYearly: 190,
      currency: "USD",
      maxProjects: 25,
      allowCSVImportExport: true,
      hasLiveSupport: true,
    },
  });

  await prisma.planConfig.upsert({
    where: { planName: "Enterprise" },
    update: { currency: "USD" },
    create: {
      planName: "Enterprise",
      priceMonthly: 99,
      priceYearly: 990,
      currency: "USD",
      maxProjects: 999999,
      allowCSVImportExport: true,
      hasLiveSupport: true,
    },
  });

  const proPlan = await prisma.planConfig.findUnique({
    where: { planName: "Pro" },
  });

  if (proPlan) {
    await prisma.subscription.upsert({
      where: { id: "sub-brand-admin-pro" },
      update: {
        planName: proPlan.planName,
        status: "ACTIVE",
      },
      create: {
        id: "sub-brand-admin-pro",
        userId: brandAdminUser.id,
        planName: proPlan.planName,
        status: "ACTIVE",
        billingCycle: "MONTHLY",
        startDate: new Date(),
        endDate: oneYearFromNow,
        price: proPlan.priceMonthly,
        finalPrice: proPlan.priceMonthly,
      },
    });
  }

  // 7. Seed Exchange Rates (Aligned with Locales & Timezones)
  console.log("  -> Seeding Exchange Rates (Aligned with Locales & Timezones)...");
  const defaultRates = [
    {
      code: "USD",
      name: "Dólar Estadounidense",
      symbol: "$",
      rateAgainstUsd: 1.0,
      isDefault: true,
    },
    {
      code: "MXN",
      name: "Peso Mexicano",
      symbol: "$",
      rateAgainstUsd: 20.0,
      isDefault: false,
    },
    {
      code: "EUR",
      name: "Euro",
      symbol: "€",
      rateAgainstUsd: 0.92,
      isDefault: false,
    },
    {
      code: "BRL",
      name: "Real Brasileño",
      symbol: "R$",
      rateAgainstUsd: 5.5,
      isDefault: false,
    },
    {
      code: "COP",
      name: "Peso Colombiano",
      symbol: "$",
      rateAgainstUsd: 4000.0,
      isDefault: false,
    },
    {
      code: "ARS",
      name: "Peso Argentino",
      symbol: "$",
      rateAgainstUsd: 1000.0,
      isDefault: false,
    },
    {
      code: "CLP",
      name: "Peso Chileno",
      symbol: "$",
      rateAgainstUsd: 950.0,
      isDefault: false,
    },
    {
      code: "GBP",
      name: "Libra Esterlina",
      symbol: "£",
      rateAgainstUsd: 0.78,
      isDefault: false,
    },
  ];

  for (const r of defaultRates) {
    await prisma.exchangeRate.upsert({
      where: { code: r.code },
      update: {
        name: r.name,
        symbol: r.symbol,
        rateAgainstUsd: r.rateAgainstUsd,
        isDefault: r.isDefault,
      },
      create: r,
    });
  }

  console.log("✅ Database seeding finished cleanly with 100% Upserts.");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
