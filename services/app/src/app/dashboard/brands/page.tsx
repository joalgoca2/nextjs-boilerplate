"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Plus,
  Edit2,
  Search,
  X,
  Loader2,
  Layers,
  CreditCard,
  Zap,
  Sparkles,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/components/providers/i18n-provider";
import { BrandPaymentConfigDialog } from "@/components/payment/brand-payment-config-dialog";
import {
  getBrandsCatalog,
  createBrand,
  updateBrandSettings,
  type BrandWithUsersCount,
} from "@/actions/brand";
import {
  getPlanConfigs,
  switchBrandSubscriptionPlanAction,
} from "@/actions/billing";
import type { PlanConfig } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormattedDate } from "@/components/ui/formatted-date";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaginationControl } from "@/components/ui/pagination-control";
import { Skeleton } from "@/components/ui/skeleton";

export default function BrandsCatalogPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const currentPage = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const currentSearch = searchParams.get("search") ?? "";

  const [brands, setBrands] = useState<BrandWithUsersCount[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Local input state for smooth typing before explicit search submit
  const [searchInput, setSearchInput] = useState(currentSearch);

  const { data: session } = useSession();
  const sessionUser = session?.user;

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandWithUsersCount | null>(null);

  // Payment Config Modal state
  const [isPaymentConfigOpen, setIsPaymentConfigOpen] = useState(false);
  const [paymentConfigBrand, setPaymentConfigBrand] = useState<BrandWithUsersCount | null>(null);

  // Subscription Plan Assign Modal state
  const [isAssignPlanOpen, setIsAssignPlanOpen] = useState(false);
  const [assignPlanBrand, setAssignPlanBrand] = useState<BrandWithUsersCount | null>(null);
  const [availablePlans, setAvailablePlans] = useState<PlanConfig[]>([]);
  const [selectedPlanName, setSelectedPlanName] = useState("");
  const [isAssigningPlan, setIsAssigningPlan] = useState(false);

  // Form states
  const [brandName, setBrandName] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await getPlanConfigs();
      if (res.success && res.data) {
        setAvailablePlans(res.data.filter((p) => p.isActive));
      }
    } catch (_err) {}
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleOpenPaymentConfig = (b: BrandWithUsersCount) => {
    setPaymentConfigBrand(b);
    setIsPaymentConfigOpen(true);
  };

  const handleOpenAssignPlan = (b: BrandWithUsersCount) => {
    setAssignPlanBrand(b);
    setIsAssignPlanOpen(true);
  };

  const handleAssignPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignPlanBrand || !selectedPlanName || !sessionUser?.id) return;
    setIsAssigningPlan(true);
    try {
      const res = await switchBrandSubscriptionPlanAction({
        userId: sessionUser.id,
        brandId: assignPlanBrand.id,
        newPlanName: selectedPlanName,
      });

      if (res.success) {
        toast.success(`Plan ${selectedPlanName} asignado exitosamente a la marca.`);
        setIsAssignPlanOpen(false);
        setAssignPlanBrand(null);
      } else {
        toast.error(res.error ?? "No se pudo asignar el plan.");
      }
    } catch (_err) {
      toast.error("Error al asignar el plan.");
    } finally {
      setIsAssigningPlan(false);
    }
  };

  // Helper to update URL search parameters
  const updateUrlParams = useCallback(
    (updates: { page?: number; search?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.page !== undefined) {
        if (updates.page <= 1) params.delete("page");
        else params.set("page", updates.page.toString());
      }

      if (updates.search !== undefined) {
        if (!updates.search.trim()) params.delete("search");
        else params.set("search", updates.search.trim());
      }

      const queryString = params.toString();
      const newPath = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(newPath);
    },
    [pathname, router, searchParams]
  );

  const fetchBrands = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getBrandsCatalog({
        page: currentPage,
        limit: 10,
        search: currentSearch || undefined,
      });

      if (res.success && res.data) {
        setBrands(res.data.brands);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      } else {
        toast.error(res.error ?? t("toasts.errorOccurred", "No se pudieron cargar las marcas."));
      }
    } catch (_error: unknown) {
      toast.error(t("toasts.errorOccurred", "Error al conectar con la base de datos."));
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, currentSearch, t]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams({ search: searchInput, page: 1 });
  };

  const handleClearSearch = () => {
    setSearchInput("");
    updateUrlParams({ search: "", page: 1 });
  };

  const handleOpenCreate = () => {
    setEditingBrand(null);
    setBrandName("");
    setBrandDescription("");
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (brand: BrandWithUsersCount) => {
    setEditingBrand(brand);
    setBrandName(brand.name);
    setBrandDescription(brand.description ?? "");
  };

  const handleSaveBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let res;
      if (editingBrand) {
        res = await updateBrandSettings(editingBrand.id, {
          name: brandName,
          description: brandDescription || undefined,
        });
      } else {
        res = await createBrand({
          name: brandName,
          description: brandDescription || undefined,
        });
      }

      if (res.success) {
        toast.success(
          editingBrand
            ? t("toasts.brandUpdated", "¡Marca actualizada exitosamente!")
            : t("toasts.brandCreated", "¡Marca creada exitosamente!")
        );
        setIsCreateModalOpen(false);
        setEditingBrand(null);
        fetchBrands();
      } else {
        toast.error(res.error ?? t("toasts.errorOccurred", "No se pudo guardar la marca."));
      }
    } catch (_error: unknown) {
      toast.error(t("toasts.errorOccurred", "Error al procesar la solicitud."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            <span>{t("brands.title", "Catálogo de Marcas y Tenants")}</span>
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {t(
              "brands.subtitle",
              "Gestión independiente de marcas, empresas e inquilinos de la plataforma"
            )}
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="gap-2 shrink-0 rounded-2xl font-bold px-5 py-2.5">
          <Plus className="h-4 w-4" />
          <span>{t("brands.newBrand", "Nueva Marca")}</span>
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {t("brands.totalBrands", "Total de Marcas")}
            </CardTitle>
            <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">{total}</div>
            <p className="text-xs text-zinc-500 mt-1">
              {t("brands.registeredEntities", "Entidades registradas en el sistema")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {t("brands.activeBrandsCard", "Marcas Activas")}
            </CardTitle>
            <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">{total}</div>
            <p className="text-xs text-zinc-500 mt-1">
              {t("brands.enabledForUsers", "Habilitadas para asignación de usuarios")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {t("brands.multitenantMode", "Modo Multitenant")}
            </CardTitle>
            <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">
              {t("brands.isolated", "Aislado")}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {t("brands.accessControl", "Control de acceso basado en marca")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar & Filter */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full"
      >
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
          <Input
            placeholder={t("brands.searchPlaceholder", "Buscar marca por nombre o descripción...")}
            className="pl-10 h-10 w-full rounded-xl"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button type="submit" variant="secondary" className="gap-2 h-10 px-5 rounded-xl font-bold flex-1 sm:flex-none">
            <Search className="h-4 w-4" />
            <span>{t("common.search", "Buscar")}</span>
          </Button>
          {(currentSearch || searchInput) && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClearSearch}
              className="gap-1.5 h-10 px-4 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex-1 sm:flex-none"
            >
              <X className="h-4 w-4" />
              <span>{t("common.clear", "Limpiar")}</span>
            </Button>
          )}
        </div>
      </form>

      {/* Brands Data Table */}
      <div className="space-y-4">
        <Table>
          <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/80">
            <TableRow>
              <TableHead className="font-bold">{t("brands.idCol", "ID de Marca")}</TableHead>
              <TableHead className="font-bold">{t("brands.nameCol", "Nombre Comercial")}</TableHead>
              <TableHead className="font-bold">{t("brands.descCol", "Descripción")}</TableHead>
              <TableHead className="text-center font-bold">{t("brands.assignedUsersCol", "Usuarios Asignados")}</TableHead>
              <TableHead className="text-right font-bold">{t("brands.regDateCol", "Fecha de Registro")}</TableHead>
              <TableHead className="text-right font-bold">{t("brands.actionsCol", "Acciones")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`brand-skel-${i}`}>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : brands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                  {t("brands.noBrandsFound", "No se encontraron marcas registradas.")}
                </TableCell>
              </TableRow>
            ) : (
              brands.map((b) => (
                <TableRow key={b.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                  <TableCell className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    {b.id}
                  </TableCell>
                  <TableCell className="font-semibold text-zinc-900 dark:text-white">
                    {b.name}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-600 dark:text-zinc-300">
                    {b.description ?? t("brands.noDesc", "Sin descripción")}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800">
                      {b.usersCount} {t("brands.usersBadge", "usuarios")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500 dark:text-zinc-400 text-right font-mono">
                    <FormattedDate date={b.createdAt} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                        onClick={() => handleOpenPaymentConfig(b)}
                        title={t("brands.configPaymentGateway", "Configurar pasarela de cobro de la marca")}
                      >
                        <CreditCard className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
                        onClick={() => handleOpenAssignPlan(b)}
                        title={t("brands.assignPlan", "Asignar plan de suscripción")}
                      >
                        <Zap className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                        onClick={() => handleOpenEdit(b)}
                        title={t("brands.editBrand", "Editar marca")}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Server-Side Synchronized Pagination Control */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <PaginationControl
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(newPage) => updateUrlParams({ page: newPage })}
          />
        </div>
      </div>

      {/* Create / Edit Brand Modal */}
      <Dialog
        open={isCreateModalOpen || Boolean(editingBrand)}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateModalOpen(false);
            setEditingBrand(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingBrand
                ? `${t("brands.editModalTitle", "Editar Marca")}: ${editingBrand.name}`
                : t("brands.createModalTitle", "Crear Nueva Marca / Tenant")}
            </DialogTitle>
            <DialogDescription>
              {t("brands.modalSub", "Ingresa la información comercial de la marca en el sistema")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBrandSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="brand-name-input">{t("brands.tradeName", "Nombre Comercial")}</Label>
              <Input
                id="brand-name-input"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Ej. Acma Corporation"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand-desc-input">{t("brands.descOptional", "Descripción (Opcional)")}</Label>
              <Input
                id="brand-desc-input"
                value={brandDescription}
                onChange={(e) => setBrandDescription(e.target.value)}
                placeholder="Ej. Soluciones tecnológicas y consultoría"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingBrand(null);
                }}
              >
                {t("common.cancel", "Cancelar")}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="font-bold">
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("brands.saveBrand", "Guardar Marca")
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* SuperAdmin Brand Payment Config Dialog */}
      {isPaymentConfigOpen && paymentConfigBrand && (
        <BrandPaymentConfigDialog
          isOpen={isPaymentConfigOpen}
          onClose={() => {
            setIsPaymentConfigOpen(false);
            setPaymentConfigBrand(null);
          }}
          onSuccess={() => {
            toast.success("Credenciales de la marca guardadas cifradas.");
            setIsPaymentConfigOpen(false);
            setPaymentConfigBrand(null);
          }}
          brands={[{ id: paymentConfigBrand.id, name: paymentConfigBrand.name }]}
          initialBrandId={paymentConfigBrand.id}
          isSuperAdmin={true}
        />
      )}

      {/* SuperAdmin Assign Subscription Plan Modal */}
      {isAssignPlanOpen && assignPlanBrand && (
        <Dialog
          open={isAssignPlanOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsAssignPlanOpen(false);
              setAssignPlanBrand(null);
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <span>Asignar Plan de Suscripción</span>
              </DialogTitle>
              <DialogDescription>
                Selecciona el paquete de cobro que deseas asignar a la marca{" "}
                <strong>{assignPlanBrand.name}</strong>.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAssignPlanSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Seleccionar Plan de Precios</Label>
                <Select value={selectedPlanName} onValueChange={setSelectedPlanName}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un plan del catálogo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlans.map((p) => (
                      <SelectItem key={p.id} value={p.planName}>
                        {p.planName} — ${p.priceMonthly} USD/mes ({p.maxProjects === 999999 ? "Ilimitado" : `${p.maxProjects} proy.`})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAssignPlanOpen(false);
                    setAssignPlanBrand(null);
                  }}
                >
                  {t("common.cancel", "Cancelar")}
                </Button>
                <Button type="submit" disabled={isAssigningPlan || !selectedPlanName} className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                  {isAssigningPlan ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Asignar Plan"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
