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
  store.push({
    id: `api-error-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    route,
    status,
    message: message.slice(0, 240),
    timestamp: new Date().toISOString(),
  });

  if (store.length > 40) {
    store.splice(0, store.length - 40);
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
