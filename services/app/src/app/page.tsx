"use client";

import { useTranslation } from "@/components/providers/i18n-provider";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-6 sm:p-24 bg-gradient-to-b from-zinc-100 to-white dark:from-zinc-900 dark:to-zinc-950 transition-colors duration-200">
      <div className="z-10 max-w-4xl w-full items-center justify-between font-mono text-sm flex flex-col gap-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {t("landing.containerRunning", "Docker Container Running")}
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-800 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
            {t("landing.title", "Next.js 16 Boilerplate")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-xl text-base sm:text-lg">
            {t(
              "landing.subtitle",
              "Entorno base limpio configurado con Node 22 LTS, Next.js 16, React 19, Tailwind CSS v4 y Prisma 6."
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-8">
          <div className="p-5 rounded-xl border border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur shadow-sm">
            <div className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Framework
            </div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white">
              {t("landing.frameworkTitle", "Next.js 16.3")}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {t("landing.frameworkSub", "App Router + Node 22 LTS")}
            </div>
          </div>

          <div className="p-5 rounded-xl border border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur shadow-sm">
            <div className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">
              UI & Style
            </div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white">
              {t("landing.uiTitle", "React 19 + Tailwind v4")}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {t("landing.uiSub", "Modern design system ready")}
            </div>
          </div>

          <div className="p-5 rounded-xl border border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur shadow-sm">
            <div className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Database
            </div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white">
              {t("landing.dbTitle", "Prisma 6")}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {t("landing.dbSub", "Schema & Seed prepared")}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
