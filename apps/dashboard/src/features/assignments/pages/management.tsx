import { useState, useEffect } from "react";
import { getCurrentAcademicPeriod } from "../../../common/utils/academic-period";
import { useToast } from "../../../common/hooks/use-toast";
import { useSendAssignmentEmail } from "../hooks/use-send-assignment-email";
import { useTeachers, type Teacher } from "../hooks/use-teachers";
import { usePendingCourses, type Course } from "../hooks/use-courses";
import { useCreateAssignment } from "../hooks/use-create-assignment";
import TeacherSelect from "../components/teacher-select";
import CourseSelect from "../components/course-select";
import CourseCodeInput from "../components/course-code-input";
import AcademicPeriodInput from "../components/academic-period-input";
import MessageTextarea from "../components/message-textarea";
import FormActions from "../components/form-actions";
import { UserPlus } from "lucide-react";

export default function Management() {
  const toast = useToast();
  const [academicPeriod, setAcademicPeriod] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseCode, setCourseCode] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [charCount, setCharCount] = useState<number>(0);
  const maxChars = 400;

  // Búsqueda de docentes
  const [teacherSearch, setTeacherSearch] = useState<string>("");
  const [showTeacherDropdown, setShowTeacherDropdown] =
    useState<boolean>(false);

  // Búsqueda de asignaturas
  const [courseSearch, setCourseSearch] = useState<string>("");
  const [showCourseDropdown, setShowCourseDropdown] = useState<boolean>(false);

  // Cargar docentes y cursos desde el backend
  const {
    data: teachers = [],
    isError: isErrorTeachers,
    error: teachersError,
  } = useTeachers();

  const {
    data: pendingCourses = [],
    isError: isErrorPendingCourses,
    error: pendingCoursesError,
  } = usePendingCourses();

  const createAssignment = useCreateAssignment();
  const { sendEmail } = useSendAssignmentEmail();

  // Mostrar errores de carga
  useEffect(() => {
    if (isErrorTeachers) {
      toast.error(
        "Error al cargar docentes",
        teachersError?.message || "No se pudieron cargar los docentes",
      );
    }
  }, [isErrorTeachers, teachersError, toast]);

  useEffect(() => {
    if (isErrorPendingCourses) {
      toast.error(
        "Error al cargar sílabos pendientes",
        pendingCoursesError?.message ||
          "No se pudieron cargar los sílabos sin asignar",
      );
    }
  }, [isErrorPendingCourses, pendingCoursesError, toast]);

  // Filtrar docentes por nombre o correo
  const filteredTeachers = teachers.filter((teacher) => {
    const searchLower = teacherSearch.toLowerCase();
    const matchesName = teacher.name.toLowerCase().includes(searchLower);
    const matchesEmail = teacher.email.toLowerCase().includes(searchLower);
    return matchesName || matchesEmail;
  });

  const filteredPendingCourses = pendingCourses.filter((course) =>
    course.name.toLowerCase().includes(courseSearch.toLowerCase()),
  );

  // Inicializar el periodo académico al cargar el componente
  useEffect(() => {
    const period = getCurrentAcademicPeriod();
    setAcademicPeriod(period);
  }, []);

  const handleTeacherSelect = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setTeacherSearch(teacher.name);
    setShowTeacherDropdown(false);
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setCourseSearch(course.name);
    setCourseCode(course.code);
    setShowCourseDropdown(false);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= maxChars) {
      setMessage(text);
      setCharCount(text.length);
    }
  };

  const handleClearTeacher = () => {
    setSelectedTeacher(null);
    setTeacherSearch("");
  };

  const handleClearCourse = () => {
    setSelectedCourse(null);
    setCourseSearch("");
    setCourseCode("");
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!selectedTeacher) {
      toast.error(
        "Docente requerido",
        "Por favor selecciona un docente antes de continuar",
      );
      return;
    }

    if (!selectedCourse) {
      toast.error(
        "Asignatura requerida",
        "Por favor selecciona una asignatura antes de continuar",
      );
      return;
    }

    // Validar IDs antes de continuar
    const teacherId = parseInt(selectedTeacher.id);
    const syllabusId = parseInt(selectedCourse.id);

    if (isNaN(teacherId)) {
      toast.error(
        "ID de docente inválido",
        "El ID del docente seleccionado no es válido",
      );
      return;
    }

    if (isNaN(syllabusId)) {
      toast.error(
        "ID de curso inválido",
        "El ID del curso seleccionado no es válido",
      );
      return;
    }

    const mailToken = sessionStorage.getItem("mailToken");
    if (!mailToken) {
      toast.error(
        "Token de correo no disponible",
        "No se puede enviar el correo de notificación. Por favor, cierra sesión y vuelve a iniciar sesión.",
      );
      return;
    }

    try {
      // PASO 1: Crear la asignación primero
      const assignmentData: {
        teacherId: number;
        syllabusId: number;
        courseCode: string;
        academicPeriod: string;
        message?: string;
      } = {
        teacherId,
        syllabusId,
        courseCode: courseCode.trim(),
        academicPeriod: academicPeriod.trim(),
      };

      // Solo agregar message si tiene contenido
      if (message.trim()) {
        assignmentData.message = message.trim();
      }

      await createAssignment.mutateAsync(assignmentData);

      // PASO 2: Si la asignación fue exitosa, enviar el correo
      try {
        const emailData: {
          teacherName: string;
          teacherEmail: string;
          courseName: string;
          courseCode: string;
          academicPeriod: string;
          additionalMessage?: string;
        } = {
          teacherName: selectedTeacher.name,
          teacherEmail: selectedTeacher.email,
          courseName: selectedCourse.name,
          courseCode: courseCode.trim(),
          academicPeriod: academicPeriod.trim(),
        };

        // Solo agregar additionalMessage si tiene contenido
        if (message.trim()) {
          emailData.additionalMessage = message.trim();
        }

        await sendEmail(emailData);

        // Éxito completo
        toast.success(
          "¡Asignación exitosa!",
          `Se asignó ${selectedCourse.name} a ${selectedTeacher.name} para el periodo ${academicPeriod}. Correo enviado correctamente.`,
        );
      } catch (emailError) {
        // Si falla el email, mostrar advertencia pero la asignación ya se guardó
        const emailErrorMsg =
          emailError instanceof Error ? emailError.message : String(emailError);

        toast.warning(
          "Asignación guardada",
          `La asignación se guardó correctamente, pero no se pudo enviar el correo: ${emailErrorMsg}`,
        );
      }

      // Limpiar formulario después de éxito
      setTimeout(() => {
        setSelectedTeacher(null);
        setSelectedCourse(null);
        setTeacherSearch("");
        setCourseSearch("");
        setCourseCode("");
        setMessage("");
        setCharCount(0);
      }, 1500);
    } catch (error) {
      // Extraer mensaje de error del backend
      let errorMessage = "Error al procesar la asignación";
      let isDuplicateError = false;

      if (error instanceof Error) {
        // Primero verificar si el error completo contiene indicios de duplicado
        const fullErrorText = error.message.toLowerCase();

        // Detectar error de constraint unique/duplicate key en el mensaje completo
        if (
          fullErrorText.includes("duplicate key") ||
          fullErrorText.includes("unique constraint") ||
          fullErrorText.includes("violates unique constraint") ||
          fullErrorText.includes("already exists") ||
          fullErrorText.includes("failed query: insert")
        ) {
          isDuplicateError = true;
          errorMessage = "Ya existe una asignación para este docente y curso";
        } else {
          try {
            // Intentar parsear si el mensaje es JSON limpio
            const errorObj = JSON.parse(error.message);
            errorMessage = errorObj.message || errorObj.error || error.message;

            // Verificar también en el mensaje parseado
            const parsedMsgLower = errorMessage.toLowerCase();
            if (
              parsedMsgLower.includes("duplicate key") ||
              parsedMsgLower.includes("unique constraint") ||
              parsedMsgLower.includes("ya está asignado")
            ) {
              isDuplicateError = true;
            }
          } catch {
            // Si no es JSON, usar el mensaje tal cual
            errorMessage = error.message;

            // Limpiar mensaje si contiene el query completo
            if (errorMessage.includes("Failed query:")) {
              errorMessage =
                "Ya existe una asignación para este docente y curso";
              isDuplicateError = true;
            }
          }
        }
      }

      // Manejar casos específicos según el mensaje del backend
      if (isDuplicateError) {
        toast.error(
          "Asignación duplicada",
          `El docente ${selectedTeacher?.name} ya está asignado al curso ${selectedCourse?.name} para el periodo ${academicPeriod}.`,
        );
      } else if (
        errorMessage.includes("Conflicto de asignación") ||
        errorMessage.includes("no puede asignarse a sí mismo")
      ) {
        toast.error(
          "Conflicto de asignación",
          "El docente no puede asignarse a sí mismo este curso.",
        );
      } else if (errorMessage.includes("Docente no encontrado")) {
        toast.error(
          "Docente no encontrado",
          "El docente seleccionado no existe en el sistema.",
        );
      } else if (errorMessage.includes("Sílabo no encontrado")) {
        toast.error(
          "Curso no encontrado",
          "El curso seleccionado no existe en el sistema.",
        );
      } else if (
        errorMessage.includes("Error de validación") ||
        errorMessage.includes("Invalid input")
      ) {
        // Extraer y traducir mensaje de validación
        let cleanMessage = errorMessage;

        // Limpiar prefijos
        cleanMessage = cleanMessage.replace("Error de validación: ", "");

        // Traducir errores comunes de Zod
        if (
          cleanMessage.includes(
            "Invalid input: expected string, received undefined",
          )
        ) {
          cleanMessage = "Todos los campos requeridos deben estar completos";
        } else if (cleanMessage.includes("expected string, received null")) {
          cleanMessage = "Todos los campos requeridos deben estar completos";
        } else if (cleanMessage.includes("Invalid input")) {
          cleanMessage = "Los datos proporcionados no son válidos";
        }

        toast.error("Datos incompletos", cleanMessage);
      } else {
        // Error genérico
        toast.error("Error al crear asignación", errorMessage);
      }
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
  <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-8 py-8">
    <div className="max-w-6xl mx-auto">
      <div className="mb-7">
        <h1 className="text-3xl font-bold text-gray-900">
          Asignar Docente
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Completa los datos para asignar un sílabo a un docente.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white">
          <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md">
            <UserPlus size={30} />
          </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Datos de la Asignación
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Selecciona el docente, la asignatura y envía el mensaje de
                asignación.
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {pendingCourses.length > 0 && (
            <section className="mb-8 rounded-xl border border-amber-100 bg-amber-50/60 p-5">
              <h3 className="text-sm font-bold text-amber-900">
                Sin asignar ({pendingCourses.length})
              </h3>
              <p className="text-xs text-amber-800/80 mt-1 mb-3">
                Sílabos en borrador pendientes de asignar docente.
              </p>
              <ul className="space-y-2 max-h-40 overflow-y-auto">
                {pendingCourses.map((course) => (
                  <li
                    key={course.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm border border-amber-100"
                  >
                    <span className="font-medium text-gray-900 truncate">
                      {course.name}
                    </span>
                    <span className="shrink-0 text-xs text-gray-500">
                      {course.code}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <TeacherSelect
              selectedTeacher={selectedTeacher}
              teacherSearch={teacherSearch}
              setTeacherSearch={setTeacherSearch}
              showTeacherDropdown={showTeacherDropdown}
              setShowTeacherDropdown={setShowTeacherDropdown}
              onTeacherSelect={handleTeacherSelect}
              onClearTeacher={handleClearTeacher}
              teachers={filteredTeachers}
            />

            <CourseSelect
              selectedCourse={selectedCourse}
              courseSearch={courseSearch}
              setCourseSearch={setCourseSearch}
              showCourseDropdown={showCourseDropdown}
              setShowCourseDropdown={setShowCourseDropdown}
              onCourseSelect={handleCourseSelect}
              onClearCourse={handleClearCourse}
              courses={filteredPendingCourses}
              showInconsistentBadge={false}
            />

            <CourseCodeInput courseCode={courseCode} />

            <AcademicPeriodInput academicPeriod={academicPeriod} />
          </div>

          <div className="mt-7">
            <MessageTextarea
              message={message}
              onChange={handleMessageChange}
              charCount={charCount}
              maxChars={maxChars}
            />
          </div>

          <div className="mt-8 border-t border-gray-100 pt-6">
            <FormActions onGoBack={handleGoBack} onSubmit={handleSubmit} />
          </div>
        </div>
      </div>
    </div>
  </div>
);
}