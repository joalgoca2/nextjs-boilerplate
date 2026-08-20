"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, LogOut, Shield } from "lucide-react";
import { useTranslation } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSelector } from "@/components/layout/language-selector";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useTranslation();

  const isDashboardOrAuth =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/reset-password");

  if (isDashboardOrAuth) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/80 backdrop-blur transition-colors duration-200">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
            N
          </div>
          <span className="font-bold text-zinc-900 dark:text-white tracking-tight text-base">
            Next.js Boilerplate
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          <LanguageSelector compact />
          <ThemeToggle />

          {session?.user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2 text-xs">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>{t("nav.dashboard", "Dashboard")}</span>
                </Button>
              </Link>

              {session.user.roles?.includes("ADMIN") && (
                <Link href="/dashboard/admin">
                  <Button variant="outline" size="sm" className="gap-2 text-xs">
                    <Shield className="h-4 w-4 text-emerald-500" />
                    <span className="hidden sm:inline">{t("nav.admin", "Admin")}</span>
                  </Button>
                </Link>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t("nav.signOut", "Cerrar Sesión")}</span>
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-xs">
                  {t("nav.signIn", "Iniciar Sesión")}
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="default" size="sm" className="text-xs">
                  {t("nav.register", "Registrarse")}
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
