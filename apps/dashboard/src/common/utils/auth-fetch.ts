export function getStoredAuthToken(): string | null {
  return (
    sessionStorage.getItem("token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("accessToken") ||
    localStorage.getItem("accessToken")
  );
}

function trimTrailingSlashes(value: string): string {
  let end = value.length;

  while (end > 0 && value[end - 1] === "/") {
    end -= 1;
  }

  return value.slice(0, end);
}

export function getApiBaseUrl() {
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_API_URL ??
    "http://localhost:7071/api";

  return trimTrailingSlashes(apiBaseUrl);
}

export function getHttpErrorFallback(status: number): string {
  switch (status) {
    case 400:
      return "Los datos enviados no son válidos. Revisa los campos obligatorios.";
    case 409:
      return "Ya existe un sílabo para esta asignatura, semestre y programa académico. Puedes editar el sílabo existente o usar otro código/semestre.";
    case 500:
      return "Ocurrió un error inesperado. Intenta nuevamente.";
    default:
      return `Error ${status}`;
  }
}

export async function readApiErrorMessage(
  response: Response,
  fallback?: string,
): Promise<string> {
  const defaultMessage = fallback ?? getHttpErrorFallback(response.status);

  try {
    const text = await response.text();
    if (!text.trim()) return defaultMessage;

    try {
      const json = JSON.parse(text) as { message?: string; error?: string };
      return json.message?.trim() || json.error?.trim() || defaultMessage;
    } catch {
      return text.trim() || defaultMessage;
    }
  } catch {
    return defaultMessage;
  }
}

export async function authFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = getStoredAuthToken();
  const headers = new Headers(init.headers ?? {});

  if (!headers.has("Content-Type") && init.body) {
    const isPlainObject =
      typeof init.body === "object" &&
      !(init.body instanceof FormData) &&
      !(init.body instanceof Blob) &&
      !(init.body instanceof ArrayBuffer) &&
      !ArrayBuffer.isView(init.body) &&
      !(init.body instanceof URLSearchParams);
    const isJsonString = typeof init.body === "string";
    if (isPlainObject || isJsonString) {
      headers.set("Content-Type", "application/json");
    }
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...init,
    credentials: init.credentials ?? "include",
    headers,
  });

  if (response.status === 401) {
    throw new Error("Sesión expirada o no autorizada.");
  }

  if (response.status === 403) {
    const message = await readApiErrorMessage(
      response.clone(),
      "No tienes permiso para realizar esta acción.",
    );
    throw new Error(message);
  }

  return response;
}
