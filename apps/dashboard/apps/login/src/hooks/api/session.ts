import { useMutation, useQuery } from "@tanstack/react-query";

export interface UserSession {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateSessionParams {
  baseUrl: string;
  apiToken: string;
  graphToken: string;
}

// Clase: solo lógica de API (sin hooks)
class SessionManager {
  async createSession({
    baseUrl,
    apiToken,
    graphToken,
  }: CreateSessionParams): Promise<UserSession> {
    const res = await fetch(`${baseUrl}/session/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ graphToken }),
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`Error creando sesión: ${res.statusText}`);
    }

    return res.json();
  }

  async verifySession(baseUrl: string): Promise<UserSession> {
    const res = await fetch(`${baseUrl}/session/me`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`Sesión no verificada: ${res.statusText}`);
    }

    return res.json();
  }
}

export const sessionManager = new SessionManager();

// Hooks: solo para usar en componentes funcionales
export const useCreateSession = () => {
  return useMutation<UserSession, Error, CreateSessionParams>({
    mutationFn: (params) => sessionManager.createSession(params),
  });
};

export const useVerifySession = (baseUrl: string) => {
  return useQuery<UserSession, Error>({
    queryKey: ["session"],
    queryFn: () => sessionManager.verifySession(baseUrl),
    retry: false,
  });
};
