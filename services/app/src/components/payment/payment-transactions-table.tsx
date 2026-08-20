"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslation } from "@/components/providers/i18n-provider";
import { PaginationControl } from "@/components/ui/pagination-control";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaymentTransactionItem } from "@/actions/payment-engine";
import { Search, Filter, ExternalLink, Receipt } from "lucide-react";

interface PaymentTransactionsTableProps {
  transactions: PaymentTransactionItem[];
  total: number;
  currentPage: number;
  totalPages: number;
  isLoading?: boolean;
}

export function PaymentTransactionsTable({
  transactions,
  total: _total,
  currentPage,
  totalPages,
  isLoading,
}: PaymentTransactionsTableProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "ALL";
  const currentProvider = searchParams.get("provider") || "ALL";

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="success" className="text-[10px] font-bold">
            {t("paymentEngineDetails.txStatusCompleted", "Completado")}
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="warning" className="text-[10px] font-bold">
            {t("paymentEngineDetails.txStatusPending", "Pendiente")}
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive" className="text-[10px] font-bold">
            {t("paymentEngineDetails.txStatusFailed", "Fallido")}
          </Badge>
        );
      case "REFUNDED":
        return (
          <Badge variant="secondary" className="text-[10px] font-bold">
            {t("paymentEngineDetails.txStatusRefunded", "Reembolsado")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case "CLIP":
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md">
            Clip
          </span>
        );
      case "STRIPE":
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
            Stripe
          </span>
        );
      case "MERCADOPAGO":
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">
            MercadoPago
          </span>
        );
      case "PSE":
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
            PSE
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
            {provider}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
          <Input
            type="text"
            placeholder={t(
              "paymentEngineDetails.txSearchPlaceholder",
              "Buscar por ID externo o cliente..."
            )}
            defaultValue={currentSearch}
            onChange={(e) => updateParam("search", e.target.value)}
            className="pl-10 text-xs rounded-xl h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 shrink-0 text-xs text-zinc-500">
            <Filter className="w-3.5 h-3.5" />
          </div>

          <Select
            value={currentStatus}
            onValueChange={(val) => updateParam("status", val)}
          >
            <SelectTrigger className="w-36 rounded-xl h-10 text-xs font-semibold">
              <SelectValue placeholder={t("paymentEngineDetails.colStatus", "Estatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                {t("paymentEngineDetails.txFilterAllStatuses", "Todos los Estatus")}
              </SelectItem>
              <SelectItem value="COMPLETED">
                {t("paymentEngineDetails.txStatusCompleted", "Completado")}
              </SelectItem>
              <SelectItem value="PENDING">
                {t("paymentEngineDetails.txStatusPending", "Pendiente")}
              </SelectItem>
              <SelectItem value="FAILED">
                {t("paymentEngineDetails.txStatusFailed", "Fallido")}
              </SelectItem>
              <SelectItem value="REFUNDED">
                {t("paymentEngineDetails.txStatusRefunded", "Reembolsado")}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={currentProvider}
            onValueChange={(val) => updateParam("provider", val)}
          >
            <SelectTrigger className="w-36 rounded-xl h-10 text-xs font-semibold">
              <SelectValue placeholder={t("paymentEngineDetails.colProvider", "Proveedor")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                {t("paymentEngineDetails.txFilterAllProviders", "Todos los Proveedores")}
              </SelectItem>
              <SelectItem value="CLIP">Clip</SelectItem>
              <SelectItem value="STRIPE">Stripe</SelectItem>
              <SelectItem value="MERCADOPAGO">MercadoPago</SelectItem>
              <SelectItem value="PSE">PSE</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="overflow-hidden bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <th className="p-4">{t("paymentEngineDetails.txColId", "ID Transacción")}</th>
                <th className="p-4">{t("paymentEngineDetails.txColBrand", "Marca / Origen")}</th>
                <th className="p-4">{t("paymentEngineDetails.txColProvider", "Pasarela")}</th>
                <th className="p-4">{t("paymentEngineDetails.txColAmount", "Monto")}</th>
                <th className="p-4">{t("paymentEngineDetails.txColStatus", "Estado")}</th>
                <th className="p-4">{t("paymentEngineDetails.txColDate", "Fecha (UTC)")}</th>
                <th className="p-4 text-right">{t("paymentEngineDetails.colActions", "Acciones")}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-400 italic">
                    {t("common.loading", "Cargando...")}
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
                      <span className="italic">
                        {t(
                          "paymentEngineDetails.txEmpty",
                          "No hay transacciones registradas en el historial."
                        )}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="p-4 font-mono font-bold text-zinc-900 dark:text-white">
                      {tx.externalId || tx.id}
                    </td>
                    <td className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">
                      {tx.brandName}
                    </td>
                    <td className="p-4">{getProviderBadge(tx.gatewayType)}</td>
                    <td className="p-4 font-extrabold text-zinc-900 dark:text-white">
                      ${tx.amount.toLocaleString()} {tx.currency}
                    </td>
                    <td className="p-4">{getStatusBadge(tx.status)}</td>
                    <td className="p-4 text-zinc-500 font-mono text-[11px]">
                      {new Date(tx.createdAt).toLocaleDateString([], {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-4 text-right">
                      {tx.checkoutUrl && (
                        <a
                          href={tx.checkoutUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <span>Ver Checkout</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mandatory Pagination Control Component */}
        <div className="px-4 border-t border-zinc-200 dark:border-zinc-800">
          <PaginationControl
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}
