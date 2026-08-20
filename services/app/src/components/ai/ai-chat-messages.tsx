"use client";

import { useRef, useEffect } from "react";
import { Bot, User, Sparkles } from "lucide-react";
import type { AiChatMessage } from "@/types";
import { useTranslation } from "@/components/providers/i18n-provider";

interface AiChatMessagesProps {
  messages: AiChatMessage[];
  isLoading: boolean;
  onSelectSuggestion: (prompt: string) => void;
}

export function AiChatMessages({
  messages,
  isLoading,
  onSelectSuggestion,
}: AiChatMessagesProps) {
  const { t } = useTranslation();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const suggestions = [
    t("aiChat.suggestionPlan", "¿Qué plan tengo activo y cómo cambio de plan?"),
    t("aiChat.suggestionBrand", "¿Cómo configuro las pasarelas de mi marca?"),
    t("aiChat.suggestionSecurity", "¿Cómo cambio mi PIN de seguridad?"),
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full py-8 text-center space-y-4">
          <div className="p-3 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-200">
              {t("aiChat.title", "Asistente IA")}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              {t("aiChat.subtitle", "Asistencia inteligente y soporte de tu marca")}
            </p>
          </div>

          <div className="w-full pt-4 text-left space-y-2">
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
              {t("aiChat.suggestionTitle", "Preguntas frecuentes:")}
            </p>
            {suggestions.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => onSelectSuggestion(prompt)}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50/50 hover:border-indigo-200 text-xs text-slate-700 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-indigo-950/30 dark:hover:border-indigo-800"
              >
                💡 {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg) => {
        const isUser = msg.role === "user";
        return (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              isUser ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                isUser
                  ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                  : "bg-indigo-600 text-white dark:bg-indigo-500"
              }`}
            >
              {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                isUser
                  ? "bg-indigo-600 text-white dark:bg-indigo-600"
                  : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60"
              }`}
            >
              {msg.content}
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white dark:bg-indigo-500">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <div className="rounded-2xl bg-slate-100 px-3.5 py-2.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" />
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
            <span className="ml-1 text-xs">
              {t("aiChat.typing", "El asistente está pensando...")}
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
