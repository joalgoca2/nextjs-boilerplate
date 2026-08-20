import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-zinc-100 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 transition-colors duration-200">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-lg border border-emerald-500/30">
            N
          </div>
          <span className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Next.js Boilerplate
          </span>
        </Link>
      </div>

      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
