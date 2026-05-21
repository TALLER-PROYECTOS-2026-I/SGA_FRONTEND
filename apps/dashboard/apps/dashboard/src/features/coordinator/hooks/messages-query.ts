import { useMutation } from "@tanstack/react-query";

export interface SendMessageRequest {
  destinatario: string;
  codigoAsignatura: string;
  nombreAsignatura?: string;
  mensaje: string;
  docenteId?: number;
  silaboId?: number;
}

class MessagesManager {
  async sendMessage(data: SendMessageRequest, baseUrl?: string): Promise<void> {
    const apiBase =
      baseUrl ??
      import.meta.env.VITE_API_BASE_URL ??
      "http://localhost:7071/api";
    const url = `${apiBase}/mensajes/`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status} ${t}`);
    }
  }
}

export const messagesManager = new MessagesManager();

export const useSendMessage = () => {
  return useMutation({
    mutationFn: (data: SendMessageRequest) => messagesManager.sendMessage(data),
  });
};
