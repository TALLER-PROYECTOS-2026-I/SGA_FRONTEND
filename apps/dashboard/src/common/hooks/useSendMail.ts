import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export type GraphFileAttachment = {
  "@odata.type": "#microsoft.graph.fileAttachment";
  name: string;
  contentType: string;
  contentBytes: string;
};

export interface SendMailOptions {
  to: string;
  subject: string;
  body: string;
  files?: File[];
}

export const MAX_FILE_BYTES = 3 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 10 * 1024 * 1024;
export const MAX_FILES = 5;

const MAX_SUBJECT_LENGTH = 150;
const MAX_BODY_LENGTH = 10000;

const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "png",
  "jpg",
  "jpeg",
]);

const FORBIDDEN_FILENAME_CHARS = new Set([
  "\\",
  "/",
  ":",
  "*",
  "?",
  '"',
  "<",
  ">",
  "|",
]);

const isValidEmailAddress = (value: string): boolean => {
  const trimmed = value.trim();

  if (!trimmed) return false;
  if (trimmed.includes(" ")) return false;

  const atIndex = trimmed.indexOf("@");
  const lastAtIndex = trimmed.lastIndexOf("@");

  if (atIndex <= 0 || atIndex !== lastAtIndex) return false;

  const domain = trimmed.slice(atIndex + 1);
  const dotIndex = domain.lastIndexOf(".");

  return dotIndex > 0 && dotIndex < domain.length - 1;
};

const humanSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };

    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

const collapseSpaces = (value: string): string => {
  const parts: string[] = [];
  let current = "";

  for (const char of value) {
    if (char.trim() === "") {
      if (current) {
        parts.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }

  if (current) {
    parts.push(current);
  }

  return parts.join(" ");
};

const getSafeFileName = (name: string): string => {
  let safeName = "";

  for (const char of name) {
    safeName += FORBIDDEN_FILENAME_CHARS.has(char) ? "_" : char;
  }

  const cleaned = collapseSpaces(safeName).trim();

  return cleaned || "adjunto";
};

const getFileExtension = (name: string) => {
  const lastDotIndex = name.lastIndexOf(".");

  if (lastDotIndex <= 0 || lastDotIndex === name.length - 1) {
    return "";
  }

  return name.slice(lastDotIndex + 1).toLowerCase().trim();
};

const sendMailRequest = async (opts: SendMailOptions): Promise<void> => {
  const { to, subject, body, files = [] } = opts;

  const normalizedTo = to.trim();
  const normalizedSubject = subject.trim();
  const normalizedBody = body.trim();

  if (!normalizedTo || !normalizedSubject || !normalizedBody) {
    throw new Error("Completa destinatario, asunto y mensaje");
  }

  if (!isValidEmailAddress(normalizedTo)) {
    throw new Error("El destinatario no tiene un formato de correo válido");
  }

  if (normalizedSubject.length > MAX_SUBJECT_LENGTH) {
    throw new Error(
      `El asunto no debe superar ${MAX_SUBJECT_LENGTH} caracteres`,
    );
  }

  if (normalizedBody.length > MAX_BODY_LENGTH) {
    throw new Error(`El mensaje no debe superar ${MAX_BODY_LENGTH} caracteres`);
  }

  const mailToken = sessionStorage.getItem("mailToken");

  if (!mailToken) {
    throw new Error(
      "No se encontraron los permisos para enviar email. Vuelva a iniciar sesión.",
    );
  }

  let attachments: GraphFileAttachment[] | undefined = undefined;

  if (files.length > 0) {
    if (files.length > MAX_FILES) {
      throw new Error(`Máximo ${MAX_FILES} archivos permitidos`);
    }

    const totalBytes = files.reduce((acc, file) => acc + file.size, 0);

    if (totalBytes > MAX_TOTAL_BYTES) {
      throw new Error(
        `Límite total excedido (${humanSize(totalBytes)} > ${humanSize(
          MAX_TOTAL_BYTES,
        )})`,
      );
    }

    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        throw new Error(`Archivo muy grande: ${file.name}`);
      }

      const extension = getFileExtension(file.name);

      if (!ALLOWED_ATTACHMENT_EXTENSIONS.has(extension)) {
        throw new Error(`Tipo de archivo no permitido: ${file.name}`);
      }
    }

    const converted: GraphFileAttachment[] = [];

    for (const file of files) {
      const contentBytes = await fileToBase64(file);

      converted.push({
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: getSafeFileName(file.name),
        contentType: file.type || "application/octet-stream",
        contentBytes,
      });
    }

    attachments = converted;
  }

  const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${mailToken}`,
    },
    body: JSON.stringify({
      message: {
        subject: normalizedSubject,
        body: {
          contentType: "HTML",
          content: normalizedBody,
        },
        toRecipients: [
          {
            emailAddress: {
              address: normalizedTo,
            },
          },
        ],
        ...(attachments ? { attachments } : {}),
      },
      saveToSentItems: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "No se pudo enviar el correo con Microsoft Graph");
  }
};

export function useSendMail() {
  const mutation = useMutation({
    mutationFn: sendMailRequest,
    onMutate: () => {
      toast.loading("Enviando correo...", { id: "send-mail" });
    },
    onSuccess: () => {
      toast.dismiss("send-mail");
      toast.success("Mensaje enviado con éxito", {
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      toast.dismiss("send-mail");
      toast.error(error.message || "Error al enviar el correo", {
        duration: 5000,
      });
    },
  });

  return {
    sendMail: mutation.mutateAsync,
    isSending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
  };
}