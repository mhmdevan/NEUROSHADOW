export type ApiErrorEvent = {
  id: string;
  route: string;
  status: number;
  message: string;
  timestamp: string;
};

const globalForApiMonitoring = globalThis as unknown as {
  neuroshadowApiErrors?: ApiErrorEvent[];
};

function getStore() {
  globalForApiMonitoring.neuroshadowApiErrors ??= [];
  return globalForApiMonitoring.neuroshadowApiErrors;
}

export function recordApiError(route: string, status: number, message: string) {
  const store = getStore();
  const event: ApiErrorEvent = {
    id: `api-error-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    route,
    status,
    message: message.slice(0, 240),
    timestamp: new Date().toISOString(),
  };
  store.push(event);

  if (store.length > 40) {
    store.splice(0, store.length - 40);
  }

  // Real monitoring sink: emit one structured line to stderr. On a host with a log drain
  // (Vercel, Datadog, etc.) these persist externally and survive restarts. Suppressed in
  // tests to keep the suite quiet.
  if (process.env.NODE_ENV !== "test") {
    console.error(
      JSON.stringify({ level: "error", scope: "neuroshadow.api", ...event }),
    );
  }
}

export function getApiErrorSummary() {
  const store = getStore();
  return {
    recentCount: store.length,
    latest: store.at(-1) ?? null,
  };
}

export function clearApiErrorSummary() {
  globalForApiMonitoring.neuroshadowApiErrors = [];
}
