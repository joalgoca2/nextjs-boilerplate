"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { User, Mail, Lock, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { useTranslation } from "@/components/providers/i18n-provider";
import { LanguageSelector } from "@/components/layout/language-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RegisterPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (res?.error) {
        toast.error(
          t("toasts.errorOccurred", "Error al registrar la cuenta. Inténtalo de nuevo.")
        );
      } else {
        toast.success(
          t("toasts.registerSuccess", "¡Cuenta creada exitosamente!")
        );
        window.location.href = "/dashboard";
      }
    } catch (_error: unknown) {
      toast.error(
        t("toasts.errorOccurred", "Ocurrió un error inesperado al crear la cuenta.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Header Controls: Back link + Language Selector */}
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 text-xs">
            <ArrowLeft className="h-4 w-4" />
            <span>{t("common.backHome", "Volver al Inicio")}</span>
          </Button>
        </Link>
        <LanguageSelector compact />
      </div>

      <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/70 backdrop-blur shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {t("auth.registerTitle", "Crear Cuenta")}
          </CardTitle>
          <CardDescription>
            {t("auth.registerSubtitle", "Regístrate para comenzar a usar la plataforma")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("common.name", "Nombre Completo")}</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  id="name"
                  placeholder={t("auth.namePlaceholder", "ej. Juan Pérez")}
                  className="pl-9"
                  error={Boolean(errors.name)}
                  {...register("name")}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-rose-500">{t(errors.name.message ?? "")}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("common.email", "Correo Electrónico")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder", "tu@ejemplo.com")}
                  className="pl-9"
                  error={Boolean(errors.email)}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-500">{t(errors.email.message ?? "")}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password", "Contraseña")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder={t("auth.minCharactersPlaceholder", "Mínimo 8 caracteres")}
                  className="pl-9"
                  error={Boolean(errors.password)}
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-rose-500">
                  {t(errors.password.message ?? "")}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full gap-2 font-bold" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>{t("auth.registerTitle", "Crear Cuenta")}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 border-t border-zinc-200 dark:border-zinc-800/80 pt-4 text-center">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {t("auth.alreadyHaveAccount", "¿Ya tienes una cuenta?")}{" "}
            <Link
              href="/login"
              className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {t("auth.loginHere", "Inicia sesión aquí")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
