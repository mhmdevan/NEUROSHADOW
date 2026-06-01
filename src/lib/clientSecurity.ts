"use client";

import { CSRF_COOKIE } from "@/lib/authCookies";

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : "";
}

export function csrfHeaders() {
  const token = readCookie(CSRF_COOKIE);
  return token ? { "x-neuroshadow-csrf": token } : {};
}

export function secureFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const method = (init.method ?? "GET").toUpperCase();
  const unsafe = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const headers = new Headers(init.headers);

  if (unsafe) {
    const token = readCookie(CSRF_COOKIE);
    if (token) {
      headers.set("x-neuroshadow-csrf", token);
    }
  }

  return fetch(input, { ...init, headers });
}
