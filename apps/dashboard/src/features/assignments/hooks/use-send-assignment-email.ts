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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
      if (!teacherEmail || !EMAIL_PATTERN.test(teacherEmail.trim())) {
        throw new Error("Email inválido");
      }

      const safeTeacherName = escapeHtml(teacherName);
      const safeCourseName = escapeHtml(courseName);
      const safeCourseCode = escapeHtml(courseCode);
      const safeAcademicPeriod = escapeHtml(academicPeriod);
      const safeAdditionalMessage = additionalMessage
        ? escapeHtml(additionalMessage)
        : "";

      // 3. Construir el cuerpo del correo HTML
      const emailBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #2563eb;">Asignación a nuevo curso</h2>
          <p>Estimado/a <strong>${safeTeacherName}</strong>,</p>
          <p>Se le ha asignado el siguiente curso:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Curso:</strong> ${safeCourseName}</p>
            <p><strong>Código:</strong> ${safeCourseCode}</p>
            <p><strong>Periodo Académico:</strong> ${safeAcademicPeriod}</p>
          </div>
          ${safeAdditionalMessage ? `<p><strong>Mensaje adicional:</strong></p><p style="background-color: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b;">${safeAdditionalMessage}</p>` : ""}
          <p style="margin-top: 20px;">Por favor, acceda al sistema para revisar los detalles y comenzar con la elaboración del sílabo.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">Este es un correo automático, por favor no responder.</p>
        </div>
      `;

      // 4. Enviar correo usando Microsoft Graph API
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
        let errorCode = "";

        // Parsear errores comunes de Microsoft Graph
        try {
          const errorData = JSON.parse(errorText);
          errorCode = String(errorData?.error?.code ?? "");
        } catch {
          errorCode = "";
        }

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

        throw new Error("No se pudo enviar el correo con Microsoft Graph");
      }

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
