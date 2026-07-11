import axios from "axios";

type ApiErrorPayload = {
  detail?: string;
};

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) return fallback;
  return error.response?.data?.detail ?? fallback;
}
