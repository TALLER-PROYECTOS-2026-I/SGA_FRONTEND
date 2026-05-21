import { useMutation } from "@tanstack/react-query";

interface SendTokenParams {
  baseUrl: string;
  microsoftToken: string;
  mailToken: string;
}

async function sendTokenToBackend({
  baseUrl,
  microsoftToken,
  mailToken,
}: SendTokenParams): Promise<{ url: string }> {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ microsoftToken, mailToken }),
  });
  const data = await res.json();

  if (!res.ok) {
    const message =
      (data && (data.message || JSON.stringify(data))) ||
      "Fallo en la creación de la sesión interna.";
    throw new Error(message);
  }

  return { url: data.url };
}

export const useSendTokenToBackend = () =>
  useMutation<{ url: string }, Error, SendTokenParams>({
    mutationFn: sendTokenToBackend,
  });
