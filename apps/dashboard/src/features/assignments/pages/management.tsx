import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { Navigate } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Search,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { getCurrentAcademicPeriod } from "../../../common/utils/academic-period";
import { getRoleName } from "../../../common/constants/roles";
import { useToast } from "../../../common/hooks/use-toast";
import { useSendAssignmentEmail } from "../hooks/use-send-assignment-email";
import { useTeachers, type Teacher } from "../hooks/use-teachers";
import { useCourses, type Course } from "../hooks/use-courses";
import {
  useCreateAssignment,
  useUnassignTeacher,
} from "../hooks/use-create-assignment";
import { useSession } from "../../auth/hooks/use-session";
import TeacherSelect from "../components/teacher-select";
import CourseSelect from "../components/course-select";
import CourseCodeInput from "../components/course-code-input";
import AcademicPeriodInput from "../components/academic-period-input";
import MessageTextarea from "../components/message-textarea";
import FormActions from "../components/form-actions";

type AssignmentMode = "assign" | "unassign";

const maxChars = 400;

function buildAutomaticMessage(course: Course | null, academicPeriod: string) {
  if (!course) return "";

  return `Estimado docente, se le ha asignado el sílabo de ${course.name} para el periodo académico ${academicPeriod || "correspondiente"}. Por favor, revise el contenido y complete la información correspondiente.`;
}

function normalizeRoleName(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function formatCourseText(value?: string | null, fallback = "No registrado") {
  const text = String(value ?? "").trim();

  return text || fallback;
}

function CourseBadge({
  children,
  variant = "gray",
}: {
  children: React.ReactNode;
  variant?: "gray" | "red" | "blue" | "green" | "amber";
}) {
  const variants = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    red: "bg-red-50 text-red-700 border-red-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-green-50 text-green-700 border-green-100",
    amber: "bg-amber-50 text-amber-800 border-amber-100",
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg border px-3 py-1 text-xs font-bold ${variants[variant]}`}
    >
      {children}
    </span>
  );
}

export default function Management() {
  const toast = useToast();
  const { user, isLoading: isSessionLoading } = useSession();

  const [mode, setMode] = useState<AssignmentMode>("assign");
  const [academicPeriod, setAcademicPeriod] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseCode, setCourseCode] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [charCount, setCharCount] = useState<number>(0);

  const [teacherSearch, setTeacherSearch] = useState<string>("");
  const [showTeacherDropdown, setShowTeacherDropdown] =
    useState<boolean>(false);

  const [courseSearch, setCourseSearch] = useState<string>("");
  const [showCourseDropdown, setShowCourseDropdown] = useState<boolean>(false);
  const [unassignSearch, setUnassignSearch] = useState<string>("");

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

  const createAssignment = useCreateAssignment();
  const unassignTeacher = useUnassignTeacher();
  const { sendEmail } = useSendAssignmentEmail();

  const roleName = normalizeRoleName(getRoleName(user?.role));
  const canManageAssignments = roleName === "comite_curricular_operativo";

  const unassignedCourses = useMemo(() => {
    return courses.filter((course) => !course.docenteId);
  }, [courses]);

  const assignedCourses = useMemo(() => {
    return courses.filter((course) => Boolean(course.docenteId));
  }, [courses]);

  const filteredTeachers = useMemo(() => {
    const searchLower = teacherSearch.toLowerCase();

    return teachers.filter((teacher) => {
      const matchesName = teacher.name.toLowerCase().includes(searchLower);
      const matchesEmail = teacher.email.toLowerCase().includes(searchLower);

      return matchesName || matchesEmail;
    });
  }, [teacherSearch, teachers]);

  const filteredPendingCourses = useMemo(() => {
    const searchLower = courseSearch.toLowerCase();

    return unassignedCourses.filter((course) => {
      const matchesName = formatCourseText(course.name, "")
        .toLowerCase()
        .includes(searchLower);
      const matchesCode = formatCourseText(course.code, "")
        .toLowerCase()
        .includes(searchLower);

      return matchesName || matchesCode;
    });
  }, [courseSearch, unassignedCourses]);

  const filteredAssignedCourses = useMemo(() => {
    const searchLower = unassignSearch.toLowerCase().trim();

    if (!searchLower) return assignedCourses;

    return assignedCourses.filter((course) => {
      const name = formatCourseText(course.name, "").toLowerCase();
      const code = formatCourseText(course.code, "").toLowerCase();
      const teacher = formatCourseText(course.nombreDocente, "").toLowerCase();
      const status = formatCourseText(course.estadoRevision, "").toLowerCase();

      return (
        name.includes(searchLower) ||
        code.includes(searchLower) ||
        teacher.includes(searchLower) ||
        status.includes(searchLower)
      );
    });
  }, [assignedCourses, unassignSearch]);

  useEffect(() => {
    const period = getCurrentAcademicPeriod();
    setAcademicPeriod(period);
  }, []);

  useEffect(() => {
    if (isErrorTeachers) {
      toast.error(
        "Error al cargar docentes",
        teachersError?.message || "No se pudieron cargar los docentes",
      );
    }
  }, [isErrorTeachers, teachersError, toast]);

  useEffect(() => {
    if (isErrorCourses) {
      toast.error(
        "Error al cargar sílabos",
        coursesError?.message || "No se pudieron cargar los sílabos",
      );
    }
  }, [isErrorCourses, coursesError, toast]);

  useEffect(() => {
    if (mode !== "assign") return;
    if (!selectedCourse) return;

    const automaticMessage = buildAutomaticMessage(
      selectedCourse,
      academicPeriod,
    );

    const limitedMessage = automaticMessage.slice(0, maxChars);

    setMessage(limitedMessage);
    setCharCount(limitedMessage.length);
  }, [mode, selectedCourse, academicPeriod]);

  const resetAssignmentForm = () => {
    setSelectedTeacher(null);
    setSelectedCourse(null);
    setTeacherSearch("");
    setCourseSearch("");
    setCourseCode("");
    setMessage("");
    setCharCount(0);
    setShowTeacherDropdown(false);
    setShowCourseDropdown(false);
  };

  const handleModeChange = (nextMode: AssignmentMode) => {
    setMode(nextMode);
    resetAssignmentForm();
  };

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

  const handleMessageChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;

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
    setMessage("");
    setCharCount(0);
  };

  const handleQuickAssign = (course: Course) => {
    setMode("assign");
    handleCourseSelect(course);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUnassign = async (course: Course) => {
    const confirmed = window.confirm(
      `¿Deseas desasignar al docente ${
        course.nombreDocente ?? "asignado"
      } del sílabo ${course.name}? El sílabo volverá a estar disponible para asignación.`,
    );

    if (!confirmed) return;

    try {
      await unassignTeacher.mutateAsync(Number(course.id));

      toast.success(
        "Docente desasignado",
        `El sílabo ${course.name} volvió a estar disponible para asignación.`,
      );

      if (selectedCourse?.id === course.id) {
        handleClearCourse();
      }
    } catch (error) {
      toast.error(
        "No se pudo desasignar",
        error instanceof Error ? error.message : "Intenta nuevamente.",
      );
    }
  };

  const handleSubmit = async () => {
    if (mode !== "assign") return;

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

    const teacherId = Number(selectedTeacher.id);
    const syllabusId = Number(selectedCourse.id);

    if (!Number.isFinite(teacherId) || teacherId <= 0) {
      toast.error(
        "ID de docente inválido",
        "El ID del docente seleccionado no es válido",
      );
      return;
    }

    if (!Number.isFinite(syllabusId) || syllabusId <= 0) {
      toast.error(
        "ID de curso inválido",
        "El ID del curso seleccionado no es válido",
      );
      return;
    }

    try {
      await createAssignment.mutateAsync({
        teacherId,
        syllabusId,
        courseCode: courseCode.trim(),
        academicPeriod: academicPeriod.trim(),
        message: message.trim(),
      });

      try {
        await sendEmail({
          teacherName: selectedTeacher.name,
          teacherEmail: selectedTeacher.email,
          courseName: selectedCourse.name,
          courseCode: courseCode.trim(),
          academicPeriod: academicPeriod.trim(),
          additionalMessage: message.trim(),
        });

        toast.success(
          "Asignación exitosa",
          `Se asignó ${selectedCourse.name} a ${selectedTeacher.name}. El correo fue enviado correctamente.`,
        );
      } catch (emailError) {
        toast.warning(
          "Asignación guardada",
          `La asignación se guardó correctamente, pero no se pudo enviar el correo: ${
            emailError instanceof Error
              ? emailError.message
              : "Error desconocido"
          }`,
        );
      }

      setTimeout(() => {
        resetAssignmentForm();
      }, 800);
    } catch (error) {
      const messageError =
        error instanceof Error
          ? error.message
          : "Error al procesar la asignación";

      if (
        messageError.toLowerCase().includes("ya tiene docente") ||
        messageError.toLowerCase().includes("ya está asignado") ||
        messageError.toLowerCase().includes("conflict")
      ) {
        toast.error(
          "Asignación duplicada",
          "Este sílabo ya tiene docente asignado. Primero debe desasignarlo.",
        );
        return;
      }

      toast.error("Error al crear asignación", messageError);
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  if (!isSessionLoading && !canManageAssignments) {
    return <Navigate to="/" replace />;
  }

  if (isSessionLoading) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-8 py-8">
        <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <Loader2 size={18} className="animate-spin" />
          Validando acceso...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-6 py-8 xl:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <h1 className="mt-1 text-3xl font-black text-gray-900">
            Asignar / Desasignar Docente
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-gray-500">
            Gestiona la asignación operativa de docentes a sílabos. Los sílabos
            desasignados vuelven a estar disponibles para una nueva asignación.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <BookOpen size={24} />
              </div>

              <div>
                <p className="text-xs font-black uppercase text-gray-400">
                  Total de sílabos
                </p>
                <p className="text-2xl font-black text-gray-900">
                  {courses.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
                <UserPlus size={24} />
              </div>

              <div>
                <p className="text-xs font-black uppercase text-gray-400">
                  Sin docente
                </p>
                <p className="text-2xl font-black text-gray-900">
                  {unassignedCourses.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                <Users size={24} />
              </div>

              <div>
                <p className="text-xs font-black uppercase text-gray-400">
                  Con docente
                </p>
                <p className="text-2xl font-black text-gray-900">
                  {assignedCourses.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => handleModeChange("assign")}
            className={`rounded-3xl border px-6 py-6 text-left shadow-sm transition ${
              mode === "assign"
                ? "border-red-500 bg-red-600 text-white shadow-red-100"
                : "border-gray-100 bg-white text-gray-800 hover:border-red-100 hover:bg-red-50"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                  mode === "assign"
                    ? "bg-white/20 text-white"
                    : "bg-red-50 text-red-600"
                }`}
              >
                <UserPlus size={27} />
              </div>

              <div>
                <p className="text-xl font-black">Asignar docente</p>
                <p
                  className={`mt-1 text-sm ${
                    mode === "assign" ? "text-white/80" : "text-gray-500"
                  }`}
                >
                  Sílabos sin docente asignado: {unassignedCourses.length}
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange("unassign")}
            className={`rounded-3xl border px-6 py-6 text-left shadow-sm transition ${
              mode === "unassign"
                ? "border-red-500 bg-red-600 text-white shadow-red-100"
                : "border-gray-100 bg-white text-gray-800 hover:border-red-100 hover:bg-red-50"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                  mode === "unassign"
                    ? "bg-white/20 text-white"
                    : "bg-red-50 text-red-600"
                }`}
              >
                <UserMinus size={27} />
              </div>

              <div>
                <p className="text-xl font-black">Desasignar docente</p>
                <p
                  className={`mt-1 text-sm ${
                    mode === "unassign" ? "text-white/80" : "text-gray-500"
                  }`}
                >
                  Sílabos con docente asignado: {assignedCourses.length}
                </p>
              </div>
            </div>
          </button>
        </div>

        {mode === "assign" ? (
          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl">
            <div className="border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white px-8 py-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md">
                    <UserPlus size={30} />
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-gray-900">
                      Asignar docente
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Selecciona un docente y un sílabo disponible. El mensaje
                      se genera automáticamente.
                    </p>
                  </div>
                </div>

                <span className="inline-flex w-fit items-center rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-black text-red-700 shadow-sm">
                  {unassignedCourses.length} disponibles
                </span>
              </div>
            </div>

            <div className="p-8">
              {isLoadingCourses ? (
                <div className="mb-6 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  <Loader2 size={18} className="animate-spin" />
                  Cargando sílabos disponibles...
                </div>
              ) : (
                <section className="mb-8 rounded-3xl border border-amber-100 bg-amber-50/60 p-6">
                  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-black text-amber-950">
                        Sílabos disponibles para asignar
                      </h3>

                      <p className="mt-1 text-sm text-amber-800/80">
                        Aquí aparecen los sílabos que no tienen docente
                        asignado.
                      </p>
                    </div>

                    <span className="inline-flex w-fit items-center rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-black text-amber-800 shadow-sm">
                      {unassignedCourses.length} sílabos
                    </span>
                  </div>

                  {unassignedCourses.length === 0 ? (
                    <div className="rounded-2xl border border-amber-100 bg-white px-5 py-8 text-center text-sm text-gray-500">
                      No hay sílabos disponibles para asignar.
                    </div>
                  ) : (
                    <div className="grid max-h-[430px] grid-cols-1 gap-4 overflow-y-auto pr-2 xl:grid-cols-2">
                      {unassignedCourses.map((course) => (
                        <article
                          key={course.id}
                          className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="break-words text-base font-black text-gray-900">
                                {formatCourseText(
                                  course.name,
                                  "Sílabo sin nombre",
                                )}
                              </p>

                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <CourseBadge>
                                  {formatCourseText(course.code, "Sin código")}
                                </CourseBadge>

                                <CourseBadge variant="blue">
                                  Ciclo {course.ciclo ?? "-"}
                                </CourseBadge>

                                <CourseBadge variant="amber">
                                  {course.estadoRevision ?? "Sin estado"}
                                </CourseBadge>
                              </div>

                              <p className="mt-3 text-xs text-gray-500">
                                {course.escuela ?? "Escuela no registrada"}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleQuickAssign(course)}
                              className="h-10 shrink-0 rounded-xl bg-red-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-red-700"
                            >
                              Asignar
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}

              <section className="rounded-3xl border border-gray-100 bg-gray-50 p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-red-600 shadow-sm">
                    <GraduationCap size={22} />
                  </div>

                  <div>
                    <h3 className="text-base font-black text-gray-900">
                      Formulario de asignación
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Completa la selección del docente y del sílabo.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
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

                {selectedTeacher && selectedCourse && (
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-800">
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold">Asignación preparada</p>
                      <p>
                        Se asignará {selectedCourse.name} a{" "}
                        {selectedTeacher.name}.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-8 border-t border-gray-200 pt-6">
                  <FormActions
                    onGoBack={handleGoBack}
                    onSubmit={handleSubmit}
                  />
                </div>
              </section>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl">
            <div className="border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white px-8 py-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md">
                    <UserMinus size={30} />
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-gray-900">
                      Desasignar docente
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Puedes desasignar docentes sin importar el estado del
                      sílabo. El sílabo volverá a BORRADOR.
                    </p>
                  </div>
                </div>

                <span className="inline-flex w-fit items-center rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-black text-red-700 shadow-sm">
                  {assignedCourses.length} asignados
                </span>
              </div>
            </div>

            <div className="p-8">
              <div className="mb-6 rounded-3xl border border-gray-100 bg-gray-50 p-5">
                <label className="mb-2 block text-sm font-black text-gray-900">
                  Buscar sílabo o docente asignado
                </label>

                <div className="relative">
                  <Search
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    value={unassignSearch}
                    onChange={(event) => setUnassignSearch(event.target.value)}
                    placeholder="Buscar por curso, código, docente o estado..."
                    className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />
                </div>
              </div>

              {isLoadingCourses ? (
                <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  <Loader2 size={18} className="animate-spin" />
                  Cargando sílabos asignados...
                </div>
              ) : filteredAssignedCourses.length === 0 ? (
                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-10 text-center">
                  <Users size={40} className="mx-auto text-gray-400" />
                  <p className="mt-3 font-black text-gray-800">
                    No hay sílabos con docente asignado.
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Cuando se asignen docentes, aparecerán en esta sección.
                  </p>
                </div>
              ) : (
                <div className="grid max-h-[620px] grid-cols-1 gap-4 overflow-y-auto pr-2 xl:grid-cols-2">
                  {filteredAssignedCourses.map((course) => (
                    <article
                      key={course.id}
                      className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="break-words text-base font-black text-gray-900">
                            {formatCourseText(course.name, "Sílabo sin nombre")}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <CourseBadge>
                              {formatCourseText(course.code, "Sin código")}
                            </CourseBadge>

                            <CourseBadge variant="blue">
                              Ciclo {course.ciclo ?? "-"}
                            </CourseBadge>

                            <CourseBadge variant="green">
                              {course.estadoRevision ?? "Sin estado"}
                            </CourseBadge>
                          </div>

                          <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                            <p className="text-xs font-black uppercase text-gray-400">
                              Docente asignado
                            </p>

                            <p className="mt-1 font-bold text-gray-900">
                              {course.nombreDocente ?? "Docente asignado"}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              ID docente: {course.docenteId ?? "-"}
                            </p>
                          </div>

                          <p className="mt-3 text-xs text-gray-500">
                            {course.escuela ?? "Escuela no registrada"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUnassign(course)}
                          disabled={unassignTeacher.isPending}
                          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-4 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {unassignTeacher.isPending ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <UserMinus size={16} />
                          )}
                          Desasignar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <div className="mt-8 border-t border-gray-100 pt-6">
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="h-11 rounded-xl bg-gray-900 px-5 text-sm font-bold text-white hover:bg-black"
                >
                  Volver
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
