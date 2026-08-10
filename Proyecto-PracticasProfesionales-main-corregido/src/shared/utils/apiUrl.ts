import { apiClient } from "../../infrastructure/api/apiClient";

export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;

  const baseUrl = String(apiClient.defaults.baseURL ?? "").replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
