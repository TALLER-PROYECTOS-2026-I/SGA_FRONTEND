import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export interface SendAssignmentEmailOptions {
  teacherName: string;
  teacherEmail: string;
  courseName: string;
  courseCode: string;
  academicPeriod: string;
  additionalMessage?: string;
}

/**
 * Hook especializado para enviar correos de notificación de asignación
 * Verifica el token de Microsoft Graph y maneja errores específicos
 */
export function useSendAssignmentEmail() {
  const mutation = useMutation({
    mutationFn: async (options: SendAssignmentEmailOptions) => {
      const {
        teacherName,
        teacherEmail,
        courseName,
        courseCode,
        academicPeriod,
        additionalMessage,
      } = options;

      // 1. Verificar que existe el mailToken
      const mailToken = sessionStorage.getItem("mailToken");
      if (!mailToken) {
        throw new Error(
          "Token de correo no disponible. Por favor, cierra sesión y vuelve a iniciar sesión.",
        );
      }

      // 2. Validar email
      if (!teacherEmail || !teacherEmail.includes("@")) {
        throw new Error(`Email inválido: ${teacherEmail}`);
      }

      // 3. Construir el cuerpo del correo HTML
      const emailBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #2563eb;">Asignación a nuevo curso</h2>
          <p>Estimado/a <strong>${teacherName}</strong>,</p>
          <p>Se le ha asignado el siguiente curso:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Curso:</strong> ${courseName}</p>
            <p><strong>Código:</strong> ${courseCode}</p>
            <p><strong>Periodo Académico:</strong> ${academicPeriod}</p>
          </div>
          ${additionalMessage ? `<p><strong>Mensaje adicional:</strong></p><p style="background-color: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b;">${additionalMessage}</p>` : ""}
          <p style="margin-top: 20px;">Por favor, acceda al sistema para revisar los detalles y comenzar con la elaboración del sílabo.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">Este es un correo automático, por favor no responder.</p>
        </div>
      `;

      // 4. Enviar correo usando Microsoft Graph API
      console.log("📧 Enviando correo a:", teacherEmail);
      const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mailToken}`,
        },
        body: JSON.stringify({
          message: {
            subject: "Asignación a nuevo curso",
            body: {
              contentType: "HTML",
              content: emailBody,
            },
            toRecipients: [
              {
                emailAddress: {
                  address: teacherEmail,
                },
              },
            ],
          },
          saveToSentItems: "true",
        }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        console.error("❌ Error de Microsoft Graph:", errorText);

        // Parsear errores comunes de Microsoft Graph
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            const errorCode = errorData.error.code;
            const errorMessage = errorData.error.message;

            if (errorCode === "InvalidAuthenticationToken") {
              throw new Error(
                "Token de correo expirado. Por favor, cierra sesión y vuelve a iniciar sesión.",
              );
            }

            if (errorCode === "MailboxNotEnabledForRESTAPI") {
              throw new Error(
                "El buzón de correo no está habilitado. Contacta al administrador.",
              );
            }

            throw new Error(`Error de Microsoft Graph: ${errorMessage}`);
          }
        } catch (parseError) {
          console.log("Parse error " + parseError);
        }

        throw new Error(errorText || "Error al enviar el correo");
      }

      console.log("✅ Correo enviado exitosamente");
      return { success: true };
    },
    onMutate: () => {
      toast.loading("Enviando correo de notificación...", {
        id: "send-assignment-email",
      });
    },
    onSuccess: () => {
      toast.dismiss("send-assignment-email");
      toast.success("Correo enviado con éxito", {
        description: "El docente ha sido notificado por correo electrónico",
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      toast.dismiss("send-assignment-email");
      toast.error("Error al enviar el correo", {
        description:
          error.message || "No se pudo enviar el correo de notificación",
        duration: 7000,
      });
    },
  });

  return {
    sendEmail: mutation.mutateAsync,
    isSending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
  };
}
