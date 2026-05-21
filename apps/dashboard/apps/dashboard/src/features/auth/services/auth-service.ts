class AuthService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL;
  }

  fetchSession = async (tokenFromQuery?: string) => {
    const url = `${this.baseUrl}/auth/me`;

    const body = tokenFromQuery
      ? { token: tokenFromQuery, message: "Login via token in query params" }
      : undefined;

    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) throw new Error("Sesión no válida");

    return res.json();
  };

  logout = async () => {
    const res = await fetch(`${this.baseUrl}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error("Error al cerrar sesión");
    return res.json();
  };
}

export const authService = new AuthService();
