import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import {
  useSendMail,
  MAX_FILES,
  MAX_FILE_BYTES,
} from "../../../common/hooks/useSendMail";
import {
  useTeachers,
  type Teacher,
} from "../../assignments/hooks/use-teachers";
import { useCourses, type Course } from "../../assignments/hooks/use-courses";
import { useSession } from "../../auth/hooks/use-session";
import { getRoleName } from "../../../common/constants/roles";
import { toast } from "sonner";

type SendResult = "idle" | "success" | "error";

type AuditEventPayload = {
  tabla: string;
  registroPk: string;
  accion: string;
  descripcion?: string;
  docenteId?: number | null;
  silaboId?: number | null;
  oldValues?: unknown;
  newValues?: unknown;
};

function buildManualNotificationMessage({
  teacherName,
  courseName,
  courseCode,
}: {
  teacherName?: string;
  courseName?: string;
  courseCode?: string;
}) {
  const safeTeacherName = teacherName?.trim() || "Docente responsable";
  const safeCourseName = courseName?.trim() || "Asignatura seleccionada";
  const safeCourseCode = courseCode?.trim() || "No informado";

  return `Estimado(a) ${safeTeacherName},

Se le informa que el sílabo correspondiente a la asignatura indicada presenta observaciones pendientes de atención.

Curso/Sílabo: ${safeCourseName}
Código: ${safeCourseCode}

Acción esperada:
Ingrese al Sistema de Gestión Académica, revise las observaciones correspondientes y realice las actualizaciones necesarias en el sílabo asignado.

Atentamente,
Comité Curricular EPICS`;
}

const DEFAULT_MANUAL_MESSAGE = buildManualNotificationMessage({});

function formatFileSize(size: number) {
  return `${Math.round(size / 1024)} KB`;
}

function getCoursePeriod(course: Course | null) {
  if (!course) return "No informado";

  const record = course as unknown as Record<string, unknown>;

  return String(
    record.periodoAcademico ||
      record.academicPeriod ||
      record.semestreAcademico ||
      record.periodo ||
      "No informado",
  );
}

function getAccessText(accessLabel: string) {
  if (!accessLabel) return "Permiso de edición configurado";
  return accessLabel;
}

function isInstitutionalEmail(email: string) {
  return email.trim().toLowerCase().endsWith("@usmp.pe");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function plainTextToHtml(value: string) {
  return `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #111827; line-height: 1.6;">${escapeHtml(
    value,
  ).replaceAll("\n", "<br/>")}</div>`;
}

async function registerAuditEvent(payload: AuditEventPayload) {
  const apiUrl = import.meta.env.VITE_API_URL || "";

  const response = await fetch(`${apiUrl}/api/audit-events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "No se pudo registrar auditoría");
  }
}

export default function SendEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const fromPermissions = searchParams.get("fromPermissions") === "1";

  const teacherEmailParam = searchParams.get("teacherEmail") || "";
  const teacherNameParam = searchParams.get("teacherName") || "";
  const courseCodeParam = searchParams.get("courseCode") || "";
  const courseNameParam = searchParams.get("courseName") || "";
  const accessLabelParam = searchParams.get("accessLabel") || "";
  const accessTypeParam = searchParams.get("accessType") || "";
  const enabledSectionsParam = searchParams.get("enabledSections") || "";
  const docenteIdParam = searchParams.get("docenteId") || "";
  const silaboIdParam = searchParams.get("silaboId") || "";

  const docenteId = docenteIdParam ? Number(docenteIdParam) : null;
  const silaboId = silaboIdParam ? Number(silaboIdParam) : null;

  const enabledSections = useMemo(() => {
    if (!enabledSectionsParam.trim()) return [];

    return enabledSectionsParam
      .split("|")
      .map((section) => section.trim())
      .filter(Boolean);
  }, [enabledSectionsParam]);

  const { user, isLoading: sessionLoading } = useSession();

  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseSearch, setCourseSearch] = useState("");
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  const [message, setMessage] = useState(DEFAULT_MANUAL_MESSAGE);
  const [charCount, setCharCount] = useState(DEFAULT_MANUAL_MESSAGE.length);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sendResult, setSendResult] = useState<SendResult>("idle");
  const [resultMessage, setResultMessage] = useState("");

  const maxChars = 400;

  const { sendMail, isSending } = useSendMail();

  const {
    data: teachers = [],
    isError: isErrorTeachers,
    error: teachersError,
  } = useTeachers();

  const {
    data: courses = [],
    isLoading: isLoadingCourses,
    isError: isErrorCourses,
    error: coursesError,
  } = useCourses();

  const userRoleName = user ? getRoleName(user.role) : "";
  const canSendHU06 =
    userRoleName === "coordinadora_academica" ||
    userRoleName === "director_escuela";

  useEffect(() => {
    if (isErrorTeachers) {
      toast.error(
        teachersError?.message || "No se pudieron cargar los docentes",
      );
    }
  }, [isErrorTeachers, teachersError]);

  useEffect(() => {
    if (isErrorCourses) {
      toast.error(coursesError?.message || "No se pudieron cargar los cursos");
    }
  }, [isErrorCourses, coursesError]);

  useEffect(() => {
    if (!sessionLoading && user && fromPermissions && !canSendHU06) {
      toast.error("No tiene permisos para enviar correos de habilitación.");
      navigate("/");
    }
  }, [sessionLoading, user, fromPermissions, canSendHU06, navigate]);

  useEffect(() => {
    if (teacherEmailParam && teachers.length > 0) {
      const teacher = teachers.find(
        (item) =>
          item.email.toLowerCase() === teacherEmailParam.toLowerCase(),
      );

      if (teacher) {
        setSelectedTeacher(teacher);
        setTeacherSearch(teacher.name);
        return;
      }
    }

    if (teacherNameParam) {
      setTeacherSearch(teacherNameParam);
    }
  }, [teacherEmailParam, teacherNameParam, teachers]);

  useEffect(() => {
    if (courseCodeParam && courses.length > 0) {
      const course = courses.find(
        (item: Course) =>
          item.code.toLowerCase() === courseCodeParam.toLowerCase(),
      );

      if (course) {
        setSelectedCourse(course);
        setCourseSearch(`${course.code} - ${course.name}`);
        return;
      }
    }

    if (courseNameParam || courseCodeParam) {
      setCourseSearch(
        courseCodeParam && courseNameParam
          ? `${courseCodeParam} - ${courseNameParam}`
          : courseNameParam || courseCodeParam,
      );
    }
  }, [courseCodeParam, courseNameParam, courses]);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowTeacherDropdown(false);
      setShowCourseDropdown(false);
    };

    document.addEventListener("click", handleClickOutside);

    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const filteredTeachers = teachers.filter((teacher) => {
    const search = teacherSearch.toLowerCase();

    return (
      teacher.name.toLowerCase().includes(search) ||
      teacher.email.toLowerCase().includes(search)
    );
  });

  const filteredCourses = courses.filter((course: Course) => {
    const search = courseSearch.toLowerCase();

    return (
      course.name.toLowerCase().includes(search) ||
      course.code.toLowerCase().includes(search)
    );
  });

  const recipientEmail = selectedTeacher?.email || teacherEmailParam || "";
  const recipientName =
    selectedTeacher?.name || teacherNameParam || "Docente responsable";

  const hasCourseSelected = Boolean(
    selectedCourse || courseCodeParam || courseNameParam,
  );

  const courseCode = selectedCourse?.code || courseCodeParam;
  const courseName = selectedCourse?.name || courseNameParam;
  const coursePeriod = getCoursePeriod(selectedCourse);

  const accessLabel = getAccessText(accessLabelParam);

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

  useEffect(() => {
    if (fromPermissions) return;

    const nextMessage = buildManualNotificationMessage({
      teacherName: selectedTeacher?.name || teacherNameParam,
      courseName: selectedCourse?.name || courseNameParam,
      courseCode: selectedCourse?.code || courseCodeParam,
    });

    setMessage(nextMessage);
    setCharCount(nextMessage.length);
  }, [
    fromPermissions,
    selectedTeacher,
    selectedCourse,
    teacherNameParam,
    courseNameParam,
    courseCodeParam,
  ]);

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
Comité Curricular EPICS`;
  }, [
    recipientName,
    courseName,
    courseCode,
    coursePeriod,
    accessLabel,
    accessTypeParam,
    enabledSections,
  ]);

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
          Comité Curricular EPICS
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

  const subject = fromPermissions
    ? `Habilitación de edición de sílabo - ${courseCode || "N/A"}`
    : selectedCourse
      ? `Notificación - Curso ${selectedCourse.code}`
      : "Notificación académica";

  const bodyToSend = fromPermissions
    ? permissionHtmlMessage
    : plainTextToHtml(message);

  const handleTeacherSelect = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setTeacherSearch(teacher.name);
    setShowTeacherDropdown(false);
    setSendResult("idle");
    setResultMessage("");
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setCourseSearch(`${course.code} - ${course.name}`);
    setShowCourseDropdown(false);
    setSendResult("idle");
    setResultMessage("");
  };

  const handleClearTeacher = () => {
    if (fromPermissions) return;

    setSelectedTeacher(null);
    setTeacherSearch("");
    setSendResult("idle");
    setResultMessage("");
  };

  const handleClearCourse = () => {
    if (fromPermissions) return;

    setSelectedCourse(null);
    setCourseSearch("");
    setSendResult("idle");
    setResultMessage("");
  };

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

  const removeAttachment = (index: number) => {
    setAttachments((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
    setSendResult("idle");
    setResultMessage("");
  };

  const validateForm = () => {
    if (fromPermissions && !canSendHU06) {
      toast.error("No tiene permisos para enviar correos de habilitación.");
      return false;
    }

    if (fromPermissions && !hasHU06Context) {
      toast.error(
        "No se puede enviar el correo. Falta la configuración de alcance o la asignación del sílabo.",
      );
      return false;
    }

    if (!recipientEmail) {
      toast.error("Selecciona un destinatario");
      return false;
    }

    if (!isInstitutionalEmail(recipientEmail)) {
      toast.error(
        "El destinatario debe tener correo institucional con dominio @usmp.pe.",
      );
      return false;
    }

    if (!hasCourseSelected) {
      toast.error("Selecciona un curso");
      return false;
    }

    if (!bodyToSend.trim()) {
      toast.error("Ingresa el mensaje");
      return false;
    }

    return true;
  };

  const registerEmailAuditSuccess = async () => {
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

  const registerEmailAuditFailure = async (error: unknown) => {
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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSendResult("idle");
    setResultMessage("");

    try {
      await sendMail({
        to: recipientEmail,
        subject,
        body: bodyToSend,
        files: attachments,
      });

      await registerEmailAuditSuccess().catch((auditError) => {
        console.error("No se pudo registrar auditoría del envío:", auditError);
      });

      setSendResult("success");
      setResultMessage(
        fromPermissions
          ? `Correo de habilitación enviado correctamente a ${recipientEmail}.`
          : `Correo enviado correctamente a ${recipientEmail}.`,
      );

      toast.success("Correo enviado correctamente");

      if (!fromPermissions) {
        setSelectedTeacher(null);
        setTeacherSearch("");
        setSelectedCourse(null);
        setCourseSearch("");

        const resetMessage = buildManualNotificationMessage({});
        setMessage(resetMessage);
        setCharCount(resetMessage.length);
      }

      setAttachments([]);
    } catch (error) {
      console.error("Error al enviar correo:", error);

      await registerEmailAuditFailure(error).catch((auditError) => {
        console.error("No se pudo registrar auditoría del fallo:", auditError);
      });

      setSendResult("error");
      setResultMessage(
        "No se pudo enviar el correo. Verifica la sesión de Microsoft Graph o vuelve a iniciar sesión.",
      );

      toast.error(
        "No se pudo enviar el correo. Verifica la sesión de Microsoft Graph.",
      );
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (sessionLoading) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-md px-8 py-6 flex items-center gap-3 text-gray-600">
          <Loader2 className="animate-spin text-red-600" size={22} />
          Cargando sesión...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-7">
          <h1 className="text-3xl font-bold text-gray-900">
            {fromPermissions
              ? "Enviar correo de habilitación"
              : "Enviar Correo"}
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            {fromPermissions
              ? "Notifica al docente que su alcance de edición fue configurado."
              : "Envía notificaciones académicas a docentes con archivos adjuntos."}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md">
                <Mail size={30} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {fromPermissions
                    ? "Correo de habilitación"
                    : "Datos del Correo"}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {fromPermissions
                    ? "Revisa el contenido generado y envía la notificación al docente."
                    : "Selecciona el destinatario, curso y escribe el mensaje."}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
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
                      onChange={(e) => {
                        setTeacherSearch(e.target.value);
                        setSelectedTeacher(null);
                        setShowTeacherDropdown(true);
                      }}
                      onFocus={() => {
                        if (!fromPermissions) {
                          setShowTeacherDropdown(true);
                        }
                      }}
                      className="w-full h-12 pl-12 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:cursor-not-allowed disabled:bg-gray-100 transition-all"
                      placeholder="Buscar docente por nombre o correo..."
                    />

                    {(selectedTeacher || teacherSearch) && !fromPermissions && (
                      <button
                        type="button"
                        onClick={handleClearTeacher}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>

                  {showTeacherDropdown &&
                    teacherSearch &&
                    filteredTeachers.length > 0 &&
                    !fromPermissions && (
                      <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                        {filteredTeachers.map((teacher) => (
                          <button
                            type="button"
                            key={teacher.id}
                            onClick={() => handleTeacherSelect(teacher)}
                            className="w-full px-4 py-4 text-left hover:bg-red-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="font-semibold text-gray-900">
                              {teacher.name}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {teacher.email}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

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
                          className={`w-10 h-10 rounded-xl text-white flex items-center justify-center ${
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

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
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
                      onChange={(e) => {
                        setCourseSearch(e.target.value);
                        setSelectedCourse(null);
                        setShowCourseDropdown(true);
                      }}
                      onFocus={() => {
                        if (!fromPermissions) {
                          setShowCourseDropdown(true);
                        }
                      }}
                      className="w-full h-12 pl-12 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:cursor-not-allowed disabled:bg-gray-100 transition-all"
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>

                  {showCourseDropdown &&
                    courseSearch &&
                    filteredCourses.length > 0 &&
                    !fromPermissions && (
                      <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                        {filteredCourses.map((course: Course) => (
                          <button
                            type="button"
                            key={course.id}
                            onClick={() => handleCourseSelect(course)}
                            className="w-full px-4 py-4 text-left hover:bg-red-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="font-semibold text-gray-900">
                              {course.name}
                            </div>

                            <div className="text-sm text-gray-500 mt-1">
                              Código: {course.code}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                  {showCourseDropdown &&
                    courseSearch &&
                    filteredCourses.length === 0 &&
                    !isLoadingCourses &&
                    !fromPermissions && (
                      <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl p-5 text-center text-sm text-gray-500">
                        No se encontraron cursos
                      </div>
                    )}

                  {hasCourseSelected && (
                    <div className="mt-3 rounded-xl bg-green-50 border border-green-100 p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center">
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

            {fromPermissions && (
              <div className="mt-7 rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <h3 className="mb-3 text-sm font-bold text-gray-900">
                  3. Mensaje generado para el docente
                </h3>

                <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
                  <p className="font-semibold">
                    Tipo de acceso: {accessLabel}
                  </p>

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
                      {accessTypeParam === "READ_ONLY"
                        ? "No se habilitaron secciones para edición."
                        : "Todas las secciones configurables del sílabo fueron habilitadas."}
                    </p>
                  )}
                </div>

                <pre className="whitespace-pre-wrap rounded-xl border border-gray-100 bg-white p-4 text-sm leading-relaxed text-gray-700">
                  {permissionMessage}
                </pre>
              </div>
            )}

            {!fromPermissions && (
              <div className="mt-7">
                <div className="flex items-center justify-between mb-2">
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
                  placeholder={DEFAULT_MANUAL_MESSAGE}
                  rows={8}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 resize-none bg-gray-50 text-sm text-gray-700 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            <div className="mt-7">
              <label className="block text-sm font-bold text-gray-900 mb-2">
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
                className={`flex items-center justify-center gap-3 px-4 py-6 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${
                  attachments.length >= MAX_FILES
                    ? "border-gray-200 bg-gray-100 cursor-not-allowed"
                    : "border-gray-200 bg-gray-50 hover:border-red-400 hover:bg-red-50"
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                  <Upload size={22} className="text-gray-500" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {attachments.length >= MAX_FILES
                      ? `Máximo ${MAX_FILES} archivos`
                      : "Seleccionar archivos"}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Máximo 3MB por archivo
                  </p>
                </div>
              </label>

              {attachments.length > 0 && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {attachments.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                          <Paperclip size={18} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
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
                        className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

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

            <div className="mt-8 border-t border-gray-100 pt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={handleGoBack}
                className="h-11 px-6 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 font-semibold shadow-sm"
              >
                <ArrowLeft size={18} />
                Volver
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSending}
                className="h-11 px-8 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center gap-2 font-semibold shadow-sm"
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