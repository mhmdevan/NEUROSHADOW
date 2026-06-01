import { NextResponse } from "next/server";
import { recordApiError } from "./apiMonitoring";

export function sanitizeText(value: string, maxLength = 2000) {
  return value
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .trim()
    .slice(0, maxLength);
}

export function safeJson<T>(data: T, init?: ResponseInit) {
  const status = init?.status ?? 200;
  if (status >= 400) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String((data as { error?: unknown }).error)
        : data && typeof data === "object" && "errors" in data
          ? "Validation error"
          : "API error";
    recordApiError("api", status, message);
  }

  return NextResponse.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...(init?.headers ?? {}),
    },
  });
}

export function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}
