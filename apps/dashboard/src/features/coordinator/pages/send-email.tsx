// send-email.tsx
// Archivo encargado de enviar correos académicos desde el sistema.
// Puede funcionar en modo normal para enviar mensajes manuales
// o en modo de habilitación de permisos cuando viene desde la pantalla de permisos.
// También registra auditoría cuando se envían correos de habilitación.

// =====================================================
// IMPORTS
// =====================================================

// Importa hooks de React.
// useState permite manejar estados internos.
// useEffect permite ejecutar acciones cuando cambian datos.
// useMemo permite memorizar valores calculados para evitar cálculos repetidos.
import { useState, useEffect, useMemo } from "react";

// Importa hooks de React Router.
// useNavigate permite navegar a otra pantalla.
// useSearchParams permite leer parámetros de la URL.
import { useNavigate, useSearchParams } from "react-router-dom";

// Importa íconos desde lucide-react.
// Se usan para botones, estados, tarjetas, campos y mensajes visuales.
import {
  ArrowLeft,
  Upload,
  X,
  Search,
  Mail,
  Send,
  User,
  BookOpen,
  Paperclip,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

// Importa el hook para enviar correos y las constantes de validación de archivos.
// useSendMail envía el correo usando Microsoft Graph.
// MAX_FILES define la cantidad máxima de archivos.
// MAX_FILE_BYTES define el tamaño máximo permitido por archivo.
import {
  useSendMail,
  MAX_FILES,
  MAX_FILE_BYTES,
} from "../../../common/hooks/useSendMail";

// Importa el hook para obtener docentes y el tipo Teacher.
// useTeachers consulta docentes desde el backend.
// Teacher define la estructura de un docente.
import {
  useTeachers,
  type Teacher,
} from "../../assignments/hooks/use-teachers";

// Importa el hook para obtener cursos y el tipo Course.
// useCourses consulta cursos desde el backend.
// Course define la estructura de un curso.
import { useCourses, type Course } from "../../assignments/hooks/use-courses";

// Importa el hook de sesión.
// Sirve para obtener el usuario actual y validar permisos.
import { useSession } from "../../auth/hooks/use-session";

// Importa la función getRoleName.
// Sirve para convertir el id del rol del usuario en el nombre del rol.
import { getRoleName } from "../../../common/constants/roles";

// Importa toast desde Sonner.
// Sirve para mostrar notificaciones de éxito, error o advertencia.
import { toast } from "sonner";

// =====================================================
// TIPOS
// =====================================================

// Define los posibles resultados visuales del envío.
// idle significa que aún no hay resultado.
// success significa que el correo se envió correctamente.
// error significa que el envío falló.
type SendResult = "idle" | "success" | "error";

// Define la estructura del evento de auditoría que se enviará al backend.
// Se usa cuando se envía o falla un correo de habilitación.
type AuditEventPayload = {
  // Tabla o módulo relacionado con el evento auditado.
  tabla: string;

  // Clave primaria o identificador del registro afectado.
  registroPk: string;

  // Acción realizada dentro del sistema.
  accion: string;

  // Descripción opcional del evento.
  descripcion?: string;

  // Id del docente relacionado, si existe.
  docenteId?: number | null;

  // Id del sílabo relacionado, si existe.
  silaboId?: number | null;

  // Valores anteriores, si aplica.
  oldValues?: unknown;

  // Valores nuevos o datos registrados en auditoría.
  newValues?: unknown;
};

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

// Convierte el tamaño de un archivo de bytes a KB.
// Se usa para mostrar el tamaño de archivos adjuntos en pantalla.
function formatFileSize(size: number) {
  return `${Math.round(size / 1024)} KB`;
}

// Obtiene el periodo académico de un curso.
// Como Course puede tener diferentes nombres de propiedad,
// se convierte a Record para revisar varias opciones posibles.
function getCoursePeriod(course: Course | null) {
  // Si no hay curso seleccionado, devuelve "No informado".
  if (!course) return "No informado";

  // Convierte el curso a un objeto genérico para leer campos dinámicos.
  const record = course as unknown as Record<string, unknown>;

  // Devuelve el primer campo de periodo encontrado.
  return String(
    record.periodoAcademico ||
      record.academicPeriod ||
      record.semestreAcademico ||
      record.periodo ||
      "No informado",
  );
}

// Devuelve el texto del tipo de acceso.
// Si no llega accessLabel, devuelve un texto por defecto.
function getAccessText(accessLabel: string) {
  if (!accessLabel) return "Permiso de edición configurado";
  return accessLabel;
}

// Valida si un correo pertenece al dominio institucional.
// Solo permite correos terminados en @usmp.pe.
function isInstitutionalEmail(email: string) {
  return email.trim().toLowerCase().endsWith("@usmp.pe");
}

// Escapa caracteres especiales para evitar insertar HTML peligroso.
// Se usa antes de construir mensajes HTML.
function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Convierte texto plano a HTML.
// Escapa el texto y reemplaza saltos de línea por <br/>.
function plainTextToHtml(value: string) {
  return `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #111827; line-height: 1.6;">${escapeHtml(
    value,
  ).replaceAll("\n", "<br/>")}</div>`;
}

// Registra un evento de auditoría en el backend.
// Se usa para guardar si el correo de habilitación se envió correctamente o falló.
async function registerAuditEvent(payload: AuditEventPayload) {
  // Obtiene la URL base de la API desde variables de entorno.
  const apiUrl = import.meta.env.VITE_API_URL || "";

  // Envía el evento de auditoría al endpoint correspondiente.
  const response = await fetch(`${apiUrl}/api/audit-events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  // Si el backend responde con error, lanza una excepción.
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "No se pudo registrar auditoría");
  }
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

// Componente encargado de enviar correos.
// Puede enviar correos normales o correos de habilitación de permisos.
export default function SendEmail() {
  // Hook para navegar entre pantallas.
  const navigate = useNavigate();

  // Hook para leer parámetros de la URL.
  const [searchParams] = useSearchParams();

  // =====================================================
  // PARÁMETROS DE URL
  // =====================================================

  // Indica si esta pantalla fue abierta desde la configuración de permisos.
  const fromPermissions = searchParams.get("fromPermissions") === "1";

  // Parámetros del docente recibidos por URL.
  const teacherEmailParam = searchParams.get("teacherEmail") || "";
  const teacherNameParam = searchParams.get("teacherName") || "";

  // Parámetros del curso recibidos por URL.
  const courseCodeParam = searchParams.get("courseCode") || "";
  const courseNameParam = searchParams.get("courseName") || "";

  // Parámetros de acceso o permiso recibidos por URL.
  const accessLabelParam = searchParams.get("accessLabel") || "";
  const accessTypeParam = searchParams.get("accessType") || "";
  const enabledSectionsParam = searchParams.get("enabledSections") || "";

  // Parámetros de ids recibidos por URL.
  const docenteIdParam = searchParams.get("docenteId") || "";
  const silaboIdParam = searchParams.get("silaboId") || "";

  // Convierte docenteId a número si existe.
  const docenteId = docenteIdParam ? Number(docenteIdParam) : null;

  // Convierte silaboId a número si existe.
  const silaboId = silaboIdParam ? Number(silaboIdParam) : null;

  // Convierte las secciones habilitadas recibidas por URL en un arreglo.
  // El separador esperado es "|".
  const enabledSections = useMemo(() => {
    // Si no hay secciones, devuelve arreglo vacío.
    if (!enabledSectionsParam.trim()) return [];

    // Separa las secciones, limpia espacios y elimina valores vacíos.
    return enabledSectionsParam
      .split("|")
      .map((section) => section.trim())
      .filter(Boolean);
  }, [enabledSectionsParam]);

  // =====================================================
  // SESIÓN Y PERMISOS
  // =====================================================

  // Obtiene el usuario actual y el estado de carga de la sesión.
  const { user, isLoading: sessionLoading } = useSession();

  // =====================================================
  // ESTADOS DE DOCENTE
  // =====================================================

  // Docente seleccionado.
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Texto del buscador de docentes.
  const [teacherSearch, setTeacherSearch] = useState("");

  // Controla si se muestra el dropdown de docentes.
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);

  // =====================================================
  // ESTADOS DE CURSO
  // =====================================================

  // Curso seleccionado.
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Texto del buscador de cursos.
  const [courseSearch, setCourseSearch] = useState("");

  // Controla si se muestra el dropdown de cursos.
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  // =====================================================
  // ESTADOS DEL MENSAJE, ARCHIVOS Y RESULTADO
  // =====================================================

  // Mensaje escrito manualmente cuando no viene desde permisos.
  const [message, setMessage] = useState("");

  // Contador de caracteres del mensaje.
  const [charCount, setCharCount] = useState(0);

  // Archivos adjuntos seleccionados.
  const [attachments, setAttachments] = useState<File[]>([]);

  // Resultado del envío para mostrar alerta visual.
  const [sendResult, setSendResult] = useState<SendResult>("idle");

  // Mensaje asociado al resultado del envío.
  const [resultMessage, setResultMessage] = useState("");

  // Máximo de caracteres permitidos en el mensaje manual.
  const maxChars = 400;

  // =====================================================
  // HOOKS DE ENVÍO Y CONSULTAS
  // =====================================================

  // Hook para enviar el correo.
  // sendMail ejecuta el envío.
  // isSending indica si el correo está en proceso.
  const { sendMail, isSending } = useSendMail();

  // Consulta la lista de docentes desde el backend.
  const {
    data: teachers = [],
    isError: isErrorTeachers,
    error: teachersError,
  } = useTeachers();

  // Consulta la lista de cursos desde el backend.
  const {
    data: courses = [],
    isLoading: isLoadingCourses,
    isError: isErrorCourses,
    error: coursesError,
  } = useCourses();

  // Obtiene el nombre del rol del usuario actual.
  const userRoleName = user ? getRoleName(user.role) : "";

  // Valida si el usuario tiene permiso para enviar correos HU06.
  // Solo coordinadora académica o director de escuela pueden hacerlo.
  const canSendHU06 =
    userRoleName === "coordinadora_academica" ||
    userRoleName === "director_escuela";

  // =====================================================
  // EFECTOS DE ERRORES Y PERMISOS
  // =====================================================

  // Muestra error si falla la carga de docentes.
  useEffect(() => {
    if (isErrorTeachers) {
      toast.error(
        teachersError?.message || "No se pudieron cargar los docentes",
      );
    }
  }, [isErrorTeachers, teachersError]);

  // Muestra error si falla la carga de cursos.
  useEffect(() => {
    if (isErrorCourses) {
      toast.error(coursesError?.message || "No se pudieron cargar los cursos");
    }
  }, [isErrorCourses, coursesError]);

  // Si viene desde permisos y el usuario no tiene rol permitido,
  // muestra error y redirige al inicio.
  useEffect(() => {
    if (!sessionLoading && user && fromPermissions && !canSendHU06) {
      toast.error("No tiene permisos para enviar correos de habilitación.");
      navigate("/");
    }
  }, [sessionLoading, user, fromPermissions, canSendHU06, navigate]);

  // =====================================================
  // EFECTOS PARA PRECARGAR DOCENTE Y CURSO DESDE URL
  // =====================================================

  // Precarga el docente cuando el correo o nombre viene por URL.
  useEffect(() => {
    // Si hay correo por URL y ya cargaron los docentes,
    // busca el docente por correo.
    if (teacherEmailParam && teachers.length > 0) {
      const teacher = teachers.find(
        (item) =>
          item.email.toLowerCase() === teacherEmailParam.toLowerCase(),
      );

      // Si encuentra docente, lo selecciona y coloca su nombre en el buscador.
      if (teacher) {
        setSelectedTeacher(teacher);
        setTeacherSearch(teacher.name);
        return;
      }
    }

    // Si no encuentra por correo pero viene nombre por URL,
    // coloca ese nombre en el buscador.
    if (teacherNameParam) {
      setTeacherSearch(teacherNameParam);
    }
  }, [teacherEmailParam, teacherNameParam, teachers]);

  // Precarga el curso cuando el código o nombre viene por URL.
  useEffect(() => {
    // Si hay código por URL y ya cargaron los cursos,
    // busca el curso por código.
    if (courseCodeParam && courses.length > 0) {
      const course = courses.find(
        (item: Course) =>
          item.code.toLowerCase() === courseCodeParam.toLowerCase(),
      );

      // Si encuentra curso, lo selecciona y muestra código + nombre.
      if (course) {
        setSelectedCourse(course);
        setCourseSearch(`${course.code} - ${course.name}`);
        return;
      }
    }

    // Si no encuentra el curso, pero hay datos por URL,
    // muestra el texto disponible en el buscador.
    if (courseNameParam || courseCodeParam) {
      setCourseSearch(
        courseCodeParam && courseNameParam
          ? `${courseCodeParam} - ${courseNameParam}`
          : courseNameParam || courseCodeParam,
      );
    }
  }, [courseCodeParam, courseNameParam, courses]);

  // Cierra los dropdowns cuando se hace clic fuera.
  useEffect(() => {
    const handleClickOutside = () => {
      setShowTeacherDropdown(false);
      setShowCourseDropdown(false);
    };

    document.addEventListener("click", handleClickOutside);

    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // =====================================================
  // FILTROS DE DOCENTES Y CURSOS
  // =====================================================

  // Filtra docentes por nombre o correo.
  const filteredTeachers = teachers.filter((teacher) => {
    const search = teacherSearch.toLowerCase();

    return (
      teacher.name.toLowerCase().includes(search) ||
      teacher.email.toLowerCase().includes(search)
    );
  });

  // Filtra cursos por nombre o código.
  const filteredCourses = courses.filter((course: Course) => {
    const search = courseSearch.toLowerCase();

    return (
      course.name.toLowerCase().includes(search) ||
      course.code.toLowerCase().includes(search)
    );
  });

  // =====================================================
  // DATOS DERIVADOS DEL FORMULARIO
  // =====================================================

  // Correo final del destinatario.
  // Prioriza el docente seleccionado; si no existe, usa el parámetro de URL.
  const recipientEmail = selectedTeacher?.email || teacherEmailParam || "";

  // Nombre final del destinatario.
  const recipientName =
    selectedTeacher?.name || teacherNameParam || "Docente responsable";

  // Indica si existe un curso seleccionado o recibido por URL.
  const hasCourseSelected = Boolean(
    selectedCourse || courseCodeParam || courseNameParam,
  );

  // Código final del curso.
  const courseCode = selectedCourse?.code || courseCodeParam;

  // Nombre final del curso.
  const courseName = selectedCourse?.name || courseNameParam;

  // Periodo académico del curso seleccionado.
  const coursePeriod = getCoursePeriod(selectedCourse);

  // Texto final del tipo de acceso.
  const accessLabel = getAccessText(accessLabelParam);

  // Verifica si hay todo el contexto necesario para enviar HU06.
  const hasHU06Context = Boolean(
    fromPermissions &&
      teacherEmailParam &&
      teacherNameParam &&
      courseCodeParam &&
      courseNameParam &&
      accessTypeParam &&
      accessLabelParam &&
      docenteId &&
      silaboId,
  );

  // =====================================================
  // MENSAJE DE HABILITACIÓN EN TEXTO PLANO
  // =====================================================

  // Construye el mensaje de habilitación en texto plano.
  // Se muestra en pantalla para que el usuario lo revise.
  const permissionMessage = useMemo(() => {
    const safeCourseName = courseName || "Sílabo asignado";
    const safeCourseCode = courseCode || "N/A";

    const sectionsText =
      enabledSections.length > 0
        ? enabledSections.map((section) => `- ${section}`).join("\n")
        : accessTypeParam === "READ_ONLY"
          ? "No se habilitaron secciones para edición."
          : "Todas las secciones configurables del sílabo fueron habilitadas.";

    return `Estimado(a) ${recipientName},

Se le comunica que se ha configurado el acceso de edición del sílabo correspondiente al curso:

Curso/Sílabo: ${safeCourseName}
Código: ${safeCourseCode}
Periodo académico: ${coursePeriod}
Tipo de acceso: ${accessLabel}

Secciones habilitadas:
${sectionsText}

Acción esperada:
Ingrese al Sistema de Gestión Académica y revise el sílabo asignado según el alcance de edición autorizado.

Atentamente,
Coordinación Académica`;
  }, [
    recipientName,
    courseName,
    courseCode,
    coursePeriod,
    accessLabel,
    accessTypeParam,
    enabledSections,
  ]);

  // =====================================================
  // MENSAJE DE HABILITACIÓN EN HTML
  // =====================================================

  // Construye el mensaje HTML que se enviará por correo cuando viene desde permisos.
  // Se escapan los valores para evitar insertar HTML no deseado.
  const permissionHtmlMessage = useMemo(() => {
    const safeCourseName = escapeHtml(courseName || "Sílabo asignado");
    const safeCourseCode = escapeHtml(courseCode || "N/A");
    const safeRecipientName = escapeHtml(recipientName);
    const safeCoursePeriod = escapeHtml(coursePeriod);
    const safeAccessLabel = escapeHtml(accessLabel);

    const sectionsHtml =
      enabledSections.length > 0
        ? `<ul style="margin-top: 6px; padding-left: 22px;">${enabledSections
            .map((section) => `<li>${escapeHtml(section)}</li>`)
            .join("")}</ul>`
        : accessTypeParam === "READ_ONLY"
          ? `<p style="margin: 6px 0 0 0;">No se habilitaron secciones para edición.</p>`
          : `<p style="margin: 6px 0 0 0;">Todas las secciones configurables del sílabo fueron habilitadas.</p>`;

    return `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #111827; line-height: 1.6;">
        <p style="margin: 0 0 14px 0;">Estimado(a) ${safeRecipientName},</p>

        <p style="margin: 0 0 14px 0;">
          Se le comunica que se ha configurado el acceso de edición del sílabo correspondiente al curso:
        </p>

        <p style="margin: 0 0 14px 0;">
          <strong>Curso/Sílabo:</strong> ${safeCourseName}<br/>
          <strong>Código:</strong> ${safeCourseCode}<br/>
          <strong>Periodo académico:</strong> ${safeCoursePeriod}<br/>
          <strong>Tipo de acceso:</strong> ${safeAccessLabel}
        </p>

        <p style="margin: 0 0 6px 0;"><strong>Secciones habilitadas:</strong></p>
        ${sectionsHtml}

        <p style="margin: 18px 0 6px 0;"><strong>Acción esperada:</strong></p>
        <p style="margin: 0 0 18px 0;">
          Ingrese al Sistema de Gestión Académica y revise el sílabo asignado según el alcance de edición autorizado.
        </p>

        <p style="margin: 0;">
          Atentamente,<br/>
          Coordinación Académica
        </p>
      </div>
    `;
  }, [
    recipientName,
    courseName,
    courseCode,
    coursePeriod,
    accessLabel,
    accessTypeParam,
    enabledSections,
  ]);

  // =====================================================
  // ASUNTO Y CUERPO FINAL DEL CORREO
  // =====================================================

  // Define el asunto del correo.
  // Si viene desde permisos, usa asunto de habilitación.
  // Si es correo normal, usa el curso seleccionado o un asunto genérico.
  const subject = fromPermissions
    ? `Habilitación de edición de sílabo - ${courseCode || "N/A"}`
    : selectedCourse
      ? `Notificación - Curso ${selectedCourse.code}`
      : "Notificación académica";

  // Define el cuerpo final que se enviará.
  // En modo permisos se envía HTML generado.
  // En modo normal se convierte el texto escrito a HTML.
  const bodyToSend = fromPermissions
    ? permissionHtmlMessage
    : plainTextToHtml(message);

  // =====================================================
  // SELECCIÓN Y LIMPIEZA DE DOCENTE / CURSO
  // =====================================================

  // Selecciona un docente desde el dropdown.
  const handleTeacherSelect = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setTeacherSearch(teacher.name);
    setShowTeacherDropdown(false);
    setSendResult("idle");
    setResultMessage("");
  };

  // Selecciona un curso desde el dropdown.
  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setCourseSearch(`${course.code} - ${course.name}`);
    setShowCourseDropdown(false);
    setSendResult("idle");
    setResultMessage("");
  };

  // Limpia el docente seleccionado.
  // En modo permisos no se permite limpiar porque viene preconfigurado.
  const handleClearTeacher = () => {
    if (fromPermissions) return;

    setSelectedTeacher(null);
    setTeacherSearch("");
    setSendResult("idle");
    setResultMessage("");
  };

  // Limpia el curso seleccionado.
  // En modo permisos no se permite limpiar porque viene preconfigurado.
  const handleClearCourse = () => {
    if (fromPermissions) return;

    setSelectedCourse(null);
    setCourseSearch("");
    setSendResult("idle");
    setResultMessage("");
  };

  // =====================================================
  // MENSAJE Y ARCHIVOS
  // =====================================================

  // Actualiza el mensaje manual siempre que no supere el máximo de caracteres.
  const handleMessageChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const text = event.target.value;

    if (text.length <= maxChars) {
      setMessage(text);
      setCharCount(text.length);
      setSendResult("idle");
      setResultMessage("");
    }
  };

  // Maneja la selección de archivos adjuntos.
  // Valida cantidad máxima y tamaño máximo por archivo.
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (attachments.length + files.length > MAX_FILES) {
      toast.error(`Máximo ${MAX_FILES} archivos permitidos`);
      return;
    }

    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`El archivo ${file.name} supera los 3MB`);
        return;
      }
    }

    setAttachments((prev) => [...prev, ...files]);
    event.target.value = "";
    setSendResult("idle");
    setResultMessage("");
  };

  // Elimina un archivo adjunto por su índice.
  const removeAttachment = (index: number) => {
    setAttachments((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
    setSendResult("idle");
    setResultMessage("");
  };

  // =====================================================
  // VALIDACIÓN DEL FORMULARIO
  // =====================================================

  // Valida que el formulario tenga todos los datos necesarios antes de enviar.
  const validateForm = () => {
    // Si viene desde permisos, valida que el usuario tenga rol permitido.
    if (fromPermissions && !canSendHU06) {
      toast.error("No tiene permisos para enviar correos de habilitación.");
      return false;
    }

    // Si viene desde permisos, valida que exista todo el contexto HU06.
    if (fromPermissions && !hasHU06Context) {
      toast.error(
        "No se puede enviar el correo. Falta la configuración de alcance o la asignación del sílabo.",
      );
      return false;
    }

    // Valida que exista destinatario.
    if (!recipientEmail) {
      toast.error("Selecciona un destinatario");
      return false;
    }

    // Valida que el correo sea institucional.
    if (!isInstitutionalEmail(recipientEmail)) {
      toast.error(
        "El destinatario debe tener correo institucional con dominio @usmp.pe.",
      );
      return false;
    }

    // Valida que exista curso seleccionado.
    if (!hasCourseSelected) {
      toast.error("Selecciona un curso");
      return false;
    }

    // Valida que exista cuerpo de correo.
    if (!bodyToSend.trim()) {
      toast.error("Ingresa el mensaje");
      return false;
    }

    // Si todo está correcto, permite continuar.
    return true;
  };

  // =====================================================
  // AUDITORÍA DEL CORREO DE HABILITACIÓN
  // =====================================================

  // Registra en auditoría que el correo de habilitación fue enviado correctamente.
  const registerEmailAuditSuccess = async () => {
    // Solo registra auditoría en modo permisos.
    if (!fromPermissions) return;

    await registerAuditEvent({
      tabla: "correo_habilitacion",
      registroPk: `${silaboId}-${docenteId}-${Date.now()}`,
      accion: "HU06_CORREO_HABILITACION_EXITOSO",
      descripcion: "Correo de habilitación enviado correctamente al docente.",
      docenteId,
      silaboId,
      newValues: {
        correoDestino: recipientEmail,
        asunto: subject,
        estadoEnvio: "EXITOSO",
        tipoAcceso: accessLabel,
        accessType: accessTypeParam,
        seccionesHabilitadas: enabledSections,
        fechaEnvio: new Date().toISOString(),
      },
    });
  };

  // Registra en auditoría que el envío del correo de habilitación falló.
  const registerEmailAuditFailure = async (error: unknown) => {
    // Solo registra auditoría en modo permisos.
    if (!fromPermissions) return;

    await registerAuditEvent({
      tabla: "correo_habilitacion",
      registroPk: `${silaboId}-${docenteId}-${Date.now()}`,
      accion: "HU06_CORREO_HABILITACION_FALLIDO",
      descripcion: "Falló el envío del correo de habilitación.",
      docenteId,
      silaboId,
      newValues: {
        correoDestino: recipientEmail,
        asunto: subject,
        estadoEnvio: "FALLIDO",
        mensajeError:
          error instanceof Error ? error.message : "Error desconocido",
        tipoAcceso: accessLabel,
        accessType: accessTypeParam,
        seccionesHabilitadas: enabledSections,
        fechaEnvio: new Date().toISOString(),
      },
    });
  };

  // =====================================================
  // ENVÍO DEL CORREO
  // =====================================================

  // Valida el formulario, envía el correo y registra auditoría si corresponde.
  const handleSubmit = async () => {
    // Si la validación falla, detiene el envío.
    if (!validateForm()) return;

    // Limpia resultado anterior.
    setSendResult("idle");
    setResultMessage("");

    try {
      // Envía el correo con destinatario, asunto, cuerpo y archivos adjuntos.
      await sendMail({
        to: recipientEmail,
        subject,
        body: bodyToSend,
        files: attachments,
      });

      // Registra auditoría de éxito.
      // Si la auditoría falla, no bloquea el flujo principal.
      await registerEmailAuditSuccess().catch((auditError) => {
        console.error("No se pudo registrar auditoría del envío:", auditError);
      });

      // Actualiza el estado visual de éxito.
      setSendResult("success");
      setResultMessage(
        fromPermissions
          ? `Correo de habilitación enviado correctamente a ${recipientEmail}.`
          : `Correo enviado correctamente a ${recipientEmail}.`,
      );

      // Muestra notificación de éxito.
      toast.success("Correo enviado correctamente");

      // Si es correo normal, limpia docente, curso y mensaje.
      // En modo permisos no limpia porque los datos vienen de la configuración.
      if (!fromPermissions) {
        setSelectedTeacher(null);
        setTeacherSearch("");
        setSelectedCourse(null);
        setCourseSearch("");
        setMessage("");
        setCharCount(0);
      }

      // Limpia archivos adjuntos después del envío.
      setAttachments([]);
    } catch (error) {
      // Registra el error en consola.
      console.error("Error al enviar correo:", error);

      // Registra auditoría de fallo.
      // Si la auditoría falla, no bloquea el mensaje de error al usuario.
      await registerEmailAuditFailure(error).catch((auditError) => {
        console.error("No se pudo registrar auditoría del fallo:", auditError);
      });

      // Actualiza el estado visual de error.
      setSendResult("error");
      setResultMessage(
        "No se pudo enviar el correo. Verifica la sesión de Microsoft Graph o vuelve a iniciar sesión.",
      );

      // Muestra notificación de error.
      toast.error(
        "No se pudo enviar el correo. Verifica la sesión de Microsoft Graph.",
      );
    }
  };

  // =====================================================
  // NAVEGACIÓN
  // =====================================================

  // Regresa a la pantalla anterior.
  const handleGoBack = () => {
    navigate(-1);
  };

  // =====================================================
  // ESTADO DE CARGA DE SESIÓN
  // =====================================================

  // Mientras se carga la sesión, muestra un mensaje simple.
  if (sessionLoading) {
    return (
      <div className="p-6 text-center text-gray-600">Cargando sesión...</div>
    );
  }

  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-8 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Encabezado principal de la página. */}
        <div className="mb-7">
          <h1 className="text-3xl font-bold text-gray-900">
            {fromPermissions
              ? "Enviar correo de habilitación"
              : "Enviar Correo"}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {fromPermissions
              ? "Notifica al docente que su alcance de edición fue configurado."
              : "Envía notificaciones académicas a docentes con archivos adjuntos."}
          </p>
        </div>

        {/* Tarjeta principal del formulario. */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
          {/* Cabecera visual de la tarjeta. */}
          <div className="border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md">
                <Mail size={30} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {fromPermissions
                    ? "Correo de habilitación"
                    : "Datos del Correo"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {fromPermissions
                    ? "Revisa el contenido generado y envía la notificación al docente."
                    : "Selecciona el destinatario, curso y escribe el mensaje."}
                </p>
              </div>
            </div>
          </div>

          {/* Contenido del formulario. */}
          <div className="p-8">
            {/* =====================================================
                DESTINATARIO Y CURSO
                ===================================================== */}

            <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
              {/* Campo de destinatario. */}
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-900">
                  1. Destinatario
                </label>

                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <div className="relative">
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />

                    <input
                      type="text"
                      value={teacherSearch}
                      disabled={fromPermissions}
                      onChange={(event) => {
                        setTeacherSearch(event.target.value);
                        setSelectedTeacher(null);
                        setShowTeacherDropdown(true);
                      }}
                      onFocus={() => {
                        if (!fromPermissions) {
                          setShowTeacherDropdown(true);
                        }
                      }}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-12 text-sm text-gray-700 transition-all placeholder:text-gray-400 focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                      placeholder="Buscar docente por nombre o correo..."
                    />

                    {(selectedTeacher || teacherSearch) && !fromPermissions && (
                      <button
                        type="button"
                        onClick={handleClearTeacher}
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown de docentes filtrados. */}
                  {showTeacherDropdown &&
                    teacherSearch &&
                    filteredTeachers.length > 0 &&
                    !fromPermissions && (
                      <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-xl">
                        {filteredTeachers.map((teacher) => (
                          <button
                            type="button"
                            key={teacher.id}
                            onClick={() => handleTeacherSelect(teacher)}
                            className="w-full border-b border-gray-100 px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-red-50"
                          >
                            <div className="font-semibold text-gray-900">
                              {teacher.name}
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              {teacher.email}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                  {/* Tarjeta de destinatario seleccionado o precargado. */}
                  {recipientEmail && (
                    <div
                      className={`mt-3 rounded-xl border p-4 ${
                        isInstitutionalEmail(recipientEmail)
                          ? "border-blue-100 bg-blue-50"
                          : "border-red-100 bg-red-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${
                            isInstitutionalEmail(recipientEmail)
                              ? "bg-blue-600"
                              : "bg-red-600"
                          }`}
                        >
                          <User size={20} />
                        </div>

                        <div>
                          <div
                            className={`font-bold ${
                              isInstitutionalEmail(recipientEmail)
                                ? "text-blue-950"
                                : "text-red-800"
                            }`}
                          >
                            {recipientName}
                          </div>

                          <div
                            className={`text-sm ${
                              isInstitutionalEmail(recipientEmail)
                                ? "text-blue-700"
                                : "text-red-700"
                            }`}
                          >
                            {recipientEmail}
                          </div>

                          {!isInstitutionalEmail(recipientEmail) && (
                            <p className="mt-1 text-xs font-semibold text-red-700">
                              El correo debe pertenecer al dominio @usmp.pe.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Campo de curso. */}
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-900">
                  2. Curso
                </label>

                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <div className="relative">
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />

                    <input
                      type="text"
                      value={courseSearch}
                      disabled={fromPermissions || isLoadingCourses}
                      onChange={(event) => {
                        setCourseSearch(event.target.value);
                        setSelectedCourse(null);
                        setShowCourseDropdown(true);
                      }}
                      onFocus={() => {
                        if (!fromPermissions) {
                          setShowCourseDropdown(true);
                        }
                      }}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-12 text-sm text-gray-700 transition-all placeholder:text-gray-400 focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                      placeholder={
                        isLoadingCourses
                          ? "Cargando cursos..."
                          : "Buscar curso por nombre o código..."
                      }
                    />

                    {(selectedCourse || courseSearch) && !fromPermissions && (
                      <button
                        type="button"
                        onClick={handleClearCourse}
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown de cursos filtrados. */}
                  {showCourseDropdown &&
                    courseSearch &&
                    filteredCourses.length > 0 &&
                    !fromPermissions && (
                      <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-xl">
                        {filteredCourses.map((course: Course) => (
                          <button
                            type="button"
                            key={course.id}
                            onClick={() => handleCourseSelect(course)}
                            className="w-full border-b border-gray-100 px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-red-50"
                          >
                            <div className="font-semibold text-gray-900">
                              {course.name}
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              Código: {course.code}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                  {/* Tarjeta del curso seleccionado o precargado. */}
                  {hasCourseSelected && (
                    <div className="mt-3 rounded-xl border border-green-100 bg-green-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white">
                          <BookOpen size={20} />
                        </div>

                        <div>
                          <div className="font-bold text-green-950">
                            {courseName || "Curso seleccionado"}
                          </div>
                          <div className="text-sm text-green-700">
                            Código: {courseCode || "No informado"}
                          </div>
                          {fromPermissions && (
                            <div className="text-xs text-green-700">
                              Tipo de acceso: {accessLabel}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* =====================================================
                MENSAJE GENERADO DESDE PERMISOS
                ===================================================== */}

            {fromPermissions && (
              <div className="mt-7 rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <h3 className="mb-3 text-sm font-bold text-gray-900">
                  3. Mensaje generado para el docente
                </h3>

                <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
                  <p className="font-semibold">Tipo de acceso: {accessLabel}</p>

                  {enabledSections.length > 0 ? (
                    <div className="mt-2">
                      <p className="font-semibold">Secciones habilitadas:</p>
                      <ul className="mt-1 list-inside list-disc space-y-1">
                        {enabledSections.map((section) => (
                          <li key={section}>{section}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="mt-2">
                      No se habilitaron secciones para edición.
                    </p>
                  )}
                </div>

                <pre className="whitespace-pre-wrap rounded-xl border border-gray-100 bg-white p-4 text-sm leading-relaxed text-gray-700">
                  {permissionMessage}
                </pre>
              </div>
            )}

            {/* =====================================================
                MENSAJE MANUAL
                ===================================================== */}

            {!fromPermissions && (
              <div className="mt-7">
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-bold text-gray-900">
                    3. Mensaje al Docente
                  </label>

                  <span
                    className={`text-xs font-medium ${
                      charCount >= maxChars ? "text-red-600" : "text-gray-400"
                    }`}
                  >
                    {charCount}/{maxChars}
                  </span>
                </div>

                <textarea
                  value={message}
                  onChange={handleMessageChange}
                  placeholder="Escribe el mensaje que será enviado al docente..."
                  rows={8}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 transition-all placeholder:text-gray-400 focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            )}

            {/* =====================================================
                ARCHIVOS ADJUNTOS
                ===================================================== */}

            <div className="mt-7">
              <label className="mb-2 block text-sm font-bold text-gray-900">
                4. Archivos Adjuntos{" "}
                <span className="font-medium text-gray-400">(opcional)</span>
              </label>

              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                disabled={attachments.length >= MAX_FILES}
              />

              <label
                htmlFor="file-upload"
                className={`flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-6 transition-colors ${
                  attachments.length >= MAX_FILES
                    ? "cursor-not-allowed border-gray-200 bg-gray-100"
                    : "border-gray-200 bg-gray-50 hover:border-red-400 hover:bg-red-50"
                }`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm">
                  <Upload size={22} className="text-gray-500" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {attachments.length >= MAX_FILES
                      ? `Máximo ${MAX_FILES} archivos`
                      : "Seleccionar archivos"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Máximo 3MB por archivo
                  </p>
                </div>
              </label>

              {/* Lista de archivos adjuntos seleccionados. */}
              {attachments.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {attachments.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                          <Paperclip size={18} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-800">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* =====================================================
                RESULTADO DEL ENVÍO
                ===================================================== */}

            {sendResult !== "idle" && (
              <div
                className={`mt-7 rounded-2xl border p-5 ${
                  sendResult === "success"
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <div className="flex gap-3">
                  {sendResult === "success" ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
                  )}

                  <div
                    className={`text-sm ${
                      sendResult === "success"
                        ? "text-green-800"
                        : "text-red-700"
                    }`}
                  >
                    <p className="font-semibold">
                      {sendResult === "success"
                        ? "Resultado del envío registrado"
                        : "Fallo en el envío"}
                    </p>
                    <p>{resultMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* =====================================================
                BOTONES DE ACCIÓN
                ===================================================== */}

            <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
              <button
                type="button"
                onClick={handleGoBack}
                className="flex h-11 items-center gap-2 rounded-xl bg-gray-900 px-6 font-semibold text-white shadow-sm transition-colors hover:bg-gray-800"
              >
                <ArrowLeft size={18} />
                Volver
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSending}
                className="flex h-11 items-center gap-2 rounded-xl bg-red-600 px-8 font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
              >
                {isSending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    {fromPermissions
                      ? "Enviar correo de habilitación"
                      : "Enviar"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}