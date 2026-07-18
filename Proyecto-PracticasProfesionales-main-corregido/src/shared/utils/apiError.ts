import axios from "axios";

type ApiErrorPayload = {
  detail?: unknown;
};

function stringifyDetail(detail: unknown): string | null {
  if (typeof detail === "string") return translateApiMessage(detail);
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") return translateApiMessage(item);
        if (item && typeof item === "object" && "msg" in item) {
          const message = (item as { msg?: unknown }).msg;
          return typeof message === "string" ? translateApiMessage(message) : null;
        }
        return null;
      })
      .filter((item): item is string => Boolean(item));
    return messages.length > 0 ? messages.join(". ") : null;
  }
  if (detail && typeof detail === "object" && "msg" in detail) {
    const message = (detail as { msg?: unknown }).msg;
    return typeof message === "string" ? translateApiMessage(message) : null;
  }
  return null;
}

function translateApiMessage(message: string): string {
  const normalized = message.trim().toLowerCase();
  if (normalized.includes("valid email")) return "Ingresa un correo valido";
  if (normalized.includes("field required") || normalized.includes("required")) {
    return "Este campo es obligatorio";
  }
  const translations: Record<string, string> = {
    "field required": "Este campo es obligatorio",
    "value is not a valid email address": "Ingresa un correo valido",
    "input should be a valid string": "Ingresa un texto valido",
    "input should be a valid integer": "Ingresa un numero valido",
    "input should be a valid number": "Ingresa un numero valido",
    "input should be a valid boolean": "Ingresa un valor valido",
  };
  return translations[normalized] ?? message;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) return fallback;
  return stringifyDetail(error.response?.data?.detail) ?? fallback;
}
