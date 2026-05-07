// use-send-mail.ts
// Archivo encargado de enviar correos usando Microsoft Graph.
// Este hook permite enviar un email con asunto, cuerpo HTML y archivos adjuntos opcionales.
// También maneja estados de envío usando React Query y muestra notificaciones con Sonner.

// =====================================================
// IMPORTS
// =====================================================

// Importa useMutation desde React Query.
// Sirve para ejecutar operaciones asíncronas que modifican datos,
// como enviar un correo mediante una petición HTTP.
import { useMutation } from "@tanstack/react-query";

// Importa toast desde Sonner.
// Sirve para mostrar notificaciones al usuario,
// por ejemplo cuando el correo se está enviando o cuando ocurre un error.
import { toast } from "sonner";

// =====================================================
// TIPOS
// =====================================================

// Define la estructura que debe tener un archivo adjunto
// para ser enviado mediante Microsoft Graph.
// Microsoft Graph requiere que los archivos estén en base64.
export type GraphFileAttachment = {
  // Tipo requerido por Microsoft Graph para indicar que es un archivo adjunto.
  "@odata.type": "#microsoft.graph.fileAttachment";

  // Nombre del archivo adjunto.
  name: string;

  // Tipo MIME del archivo, por ejemplo application/pdf o image/png.
  contentType: string;

  // Contenido del archivo convertido a base64.
  contentBytes: string;
};

// Define las opciones necesarias para enviar un correo.
// Incluye destinatario, asunto, cuerpo y archivos opcionales.
export interface SendMailOptions {
  // Correo electrónico del destinatario.
  to: string;

  // Asunto del correo.
  subject: string;

  // Cuerpo del correo.
  // Se enviará como contenido HTML.
  body: string;

  // Lista opcional de archivos adjuntos.
  files?: File[];
}

// =====================================================
// CONSTANTES DE LÍMITES DE ARCHIVOS
// =====================================================

// Tamaño máximo permitido para cada archivo individual.
// 3 * 1024 * 1024 equivale a 3 MB.
export const MAX_FILE_BYTES = 3 * 1024 * 1024;

// Tamaño máximo permitido para todos los archivos juntos.
// 10 * 1024 * 1024 equivale a 10 MB.
export const MAX_TOTAL_BYTES = 10 * 1024 * 1024;

// Cantidad máxima de archivos permitidos por correo.
export const MAX_FILES = 5;

// =====================================================
// UTILIDAD PARA FORMATEAR TAMAÑOS
// =====================================================

// Convierte una cantidad de bytes a un formato más legible.
// Por ejemplo: 500 B, 200 KB o 2.50 MB.
const humanSize = (bytes: number) => {
  // Si el tamaño es menor a 1024, se muestra en bytes.
  if (bytes < 1024) return `${bytes} B`;

  // Si el tamaño es menor a 1 MB, se muestra en KB.
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;

  // Si el tamaño es mayor o igual a 1 MB, se muestra en MB con dos decimales.
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// =====================================================
// CONVERSIÓN DE ARCHIVO A BASE64
// =====================================================

// Convierte un archivo del navegador a base64.
// Microsoft Graph necesita recibir los archivos adjuntos en contentBytes,
// y contentBytes debe estar codificado en base64.
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    // FileReader permite leer archivos seleccionados en el navegador.
    const reader = new FileReader();

    // Cuando el archivo termina de cargarse, se obtiene su contenido.
    reader.onload = () => {
      // reader.result devuelve un DataURL, por ejemplo:
      // data:application/pdf;base64,JVBERi0x...
      const result = reader.result as string;

      // Se separa el DataURL por coma y se toma solo la parte base64.
      const base64 = result.split(",")[1] ?? "";

      // Devuelve el contenido base64.
      resolve(base64);
    };

    // Si ocurre un error al leer el archivo, se rechaza la promesa.
    reader.onerror = (error) => reject(error);

    // Inicia la lectura del archivo como DataURL.
    reader.readAsDataURL(file);
  });

// =====================================================
// PETICIÓN PARA ENVIAR CORREO
// =====================================================

// Función encargada de enviar el correo usando Microsoft Graph.
// Recibe destinatario, asunto, cuerpo y archivos opcionales.
// Si hay archivos, primero los valida y los convierte a base64.
const sendMailRequest = async (opts: SendMailOptions): Promise<void> => {
  // Extrae los datos necesarios para enviar el correo.
  // Si files no llega, se usa un arreglo vacío por defecto.
  const { to, subject, body, files = [] } = opts;

  // Valida que destinatario, asunto y mensaje no estén vacíos.
  // trim() elimina espacios al inicio y al final.
  if (!to.trim() || !subject.trim() || !body.trim()) {
    throw new Error("Completa destinatario, asunto y mensaje");
  }

  // Obtiene el token de permisos para enviar correo desde sessionStorage.
  // Este token se usa como Bearer Token en la petición a Microsoft Graph.
  const mailToken = sessionStorage.getItem("mailToken");

  // Si no existe token, no se puede enviar el correo.
  // Se lanza un error para pedir al usuario que vuelva a iniciar sesión.
  if (!mailToken) {
    throw new Error(
      "No se encontraron los permisos para enviar email. Vuelva a iniciar sesión.",
    );
  }

  // Variable donde se guardarán los archivos adjuntos ya convertidos
  // al formato que requiere Microsoft Graph.
  // Inicia como undefined porque puede que el correo no tenga adjuntos.
  let attachments: GraphFileAttachment[] | undefined = undefined;

  // =====================================================
  // VALIDACIÓN Y CONVERSIÓN DE ARCHIVOS ADJUNTOS
  // =====================================================

  // Si el usuario seleccionó archivos, se validan antes de enviarlos.
  if (files.length > 0) {
    // Valida que no se exceda la cantidad máxima de archivos permitidos.
    if (files.length > MAX_FILES) {
      throw new Error(`Máximo ${MAX_FILES} archivos permitidos`);
    }

    // Calcula el tamaño total de todos los archivos.
    // reduce acumula el size de cada archivo.
    const totalBytes = files.reduce((acc, file) => acc + file.size, 0);

    // Valida que el tamaño total de adjuntos no exceda el límite permitido.
    if (totalBytes > MAX_TOTAL_BYTES) {
      throw new Error(
        `Límite total excedido (${humanSize(totalBytes)} > ${humanSize(MAX_TOTAL_BYTES)})`,
      );
    }

    // Recorre cada archivo para validar que ninguno exceda el tamaño individual permitido.
    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        throw new Error(`Archivo muy grande: ${file.name}`);
      }
    }

    // Arreglo temporal donde se guardarán los archivos convertidos
    // al formato GraphFileAttachment.
    const converted: GraphFileAttachment[] = [];

    // Recorre cada archivo válido.
    // Cada archivo se convierte a base64 y luego se agrega al arreglo converted.
    for (const file of files) {
      // Convierte el archivo actual a base64.
      const contentBytes = await fileToBase64(file);

      // Agrega el archivo convertido al arreglo de adjuntos.
      // Se incluye el nombre, tipo MIME y contenido base64.
      converted.push({
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: file.name,
        contentType: file.type || "application/octet-stream",
        contentBytes,
      });
    }

    // Asigna los archivos convertidos a attachments.
    // Esta variable luego se agrega al body de la petición.
    attachments = converted;
  }

  // =====================================================
  // ENVÍO DEL CORREO CON MICROSOFT GRAPH
  // =====================================================

  // Envía una petición POST al endpoint de Microsoft Graph para enviar correos.
  // El token se manda en Authorization como Bearer Token.
  // El cuerpo incluye el asunto, contenido HTML, destinatario y adjuntos si existen.
  const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${mailToken}`,
    },
    body: JSON.stringify({
      message: {
        subject,
        body: {
          contentType: "HTML",
          content: body,
        },
        toRecipients: [
          {
            emailAddress: {
              address: to,
            },
          },
        ],

        // Si existen adjuntos, se agregan al mensaje.
        // Si no existen, no se incluye la propiedad attachments.
        ...(attachments ? { attachments } : {}),
      },

      // Indica que el correo enviado debe guardarse en elementos enviados.
      saveToSentItems: true,
    }),
  });

  // Si Microsoft Graph responde con error,
  // se intenta leer el texto de respuesta para mostrar un mensaje más claro.
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Error al enviar el correo");
  }
};

// =====================================================
// HOOK PARA ENVIAR CORREOS
// =====================================================

// Hook personalizado que expone la función sendMail y estados del envío.
// Usa useMutation porque enviar correo es una operación asíncrona.
export function useSendMail() {
  // Configura la mutación encargada de ejecutar sendMailRequest.
  const mutation = useMutation({
    // Función que se ejecuta cuando se llama a sendMail.
    mutationFn: sendMailRequest,

    // Se ejecuta antes de iniciar la petición.
    // Muestra una notificación indicando que el correo se está enviando.
    onMutate: () => {
      toast.loading("Enviando correo...", { id: "send-mail" });
    },

    // Se ejecuta cuando el correo se envía correctamente.
    // Cierra la notificación de carga.
    onSuccess: () => {
      toast.dismiss("send-mail");
    },

    // Se ejecuta si ocurre un error al enviar el correo.
    // Cierra la notificación de carga y muestra el mensaje de error.
    onError: (error: Error) => {
      toast.dismiss("send-mail");
      toast.error(error.message || "Error al enviar el correo", {
        duration: 5000,
      });
    },
  });

  // Devuelve una interfaz más simple para que los componentes puedan usar el hook.
  return {
    // Función para enviar el correo.
    sendMail: mutation.mutateAsync,

    // Indica si el correo se está enviando.
    isSending: mutation.isPending,

    // Indica si el envío terminó correctamente.
    isSuccess: mutation.isSuccess,

    // Indica si ocurrió un error.
    isError: mutation.isError,

    // Contiene el error si ocurrió alguno.
    error: mutation.error,
  };
}