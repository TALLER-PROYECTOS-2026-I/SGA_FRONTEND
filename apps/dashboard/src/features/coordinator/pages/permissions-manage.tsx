import { useState, useEffect } from "react";
import {
  Info,
  ArrowLeft,
  ArrowRight,
  KeyRound,
  User,
  BookOpen,
  CheckCircle,
  CheckCircle2,
  Lock,
  Loader2,
  Edit3,
  Save,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCoordinator } from "../contexts/coordinator-context";
import { useSession } from "../../auth/hooks/use-session";
import { getRoleName } from "../../../common/constants/roles";
import { usePermissions, useSavePermissions } from "../hooks/permissions-query";

interface SyllabusSection {
  id: number;
  title: string;
  isEnabled: boolean;
  hasInfo: boolean;
}

type AccessType = "READ_ONLY" | "RESTRICTED_EDIT" | "FULL_EDIT";

const INITIAL_SECTIONS: SyllabusSection[] = [
  { id: 1, title: "Datos generales", isEnabled: false, hasInfo: true },
  { id: 2, title: "Sumilla", isEnabled: false, hasInfo: true },
  {
    id: 3,
    title: "Competencias y componentes",
    isEnabled: false,
    hasInfo: true,
  },
  {
    id: 4,
    title: "Programación del contenido",
    isEnabled: false,
    hasInfo: false,
  },
  {
    id: 5,
    title: "Estrategias metodológicas",
    isEnabled: false,
    hasInfo: false,
  },
  {
    id: 6,
    title: "Recursos didácticos",
    isEnabled: false,
    hasInfo: false,
  },
  {
    id: 7,
    title: "Evaluación de aprendizaje",
    isEnabled: false,
    hasInfo: false,
  },
  {
    id: 8,
    title: "Fuentes de consulta",
    isEnabled: false,
    hasInfo: false,
  },
  {
    id: 9,
    title: "Resultados (outcomes)",
    isEnabled: false,
    hasInfo: false,
  },
];

function isBaseSection(sectionId: number) {
  return sectionId <= 3;
}

function getAccessLabel(accessType: AccessType) {
  switch (accessType) {
    case "READ_ONLY":
      return "Solo lectura";
    case "RESTRICTED_EDIT":
      return "Edición restringida";
    case "FULL_EDIT":
      return "Edición completa autorizada";
    default:
      return "Solo lectura";
  }
}

function getAccessDescription(accessType: AccessType) {
  switch (accessType) {
    case "READ_ONLY":
      return "El docente solo podrá consultar el sílabo. No tendrá secciones habilitadas para edición.";
    case "RESTRICTED_EDIT":
      return "El docente podrá editar únicamente las secciones habilitadas. Las secciones 1, 2 y 3 permanecen bloqueadas.";
    case "FULL_EDIT":
      return "El docente podrá editar todas las secciones del sílabo.";
    default:
      return "Seleccione un nivel de acceso para continuar.";
  }
}

function getAccessIcon(accessType: AccessType) {
  if (accessType === "READ_ONLY") {
    return <Lock size={18} />;
  }

  if (accessType === "RESTRICTED_EDIT") {
    return <Edit3 size={18} />;
  }

  return <CheckCircle2 size={18} />;
}

function getAccessStyles(accessType: AccessType) {
  if (accessType === "READ_ONLY") {
    return {
      badge: "bg-slate-100 text-slate-700 border-slate-200",
      icon: "bg-slate-100 text-slate-700",
      card: "border-slate-200 bg-slate-50",
    };
  }

  if (accessType === "RESTRICTED_EDIT") {
    return {
      badge: "bg-yellow-50 text-yellow-700 border-yellow-200",
      icon: "bg-yellow-100 text-yellow-700",
      card: "border-yellow-200 bg-yellow-50",
    };
  }

  return {
    badge: "bg-green-50 text-green-700 border-green-200",
    icon: "bg-green-100 text-green-700",
    card: "border-green-200 bg-green-50",
  };
}

export default function PermissionsManage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const teacherName = searchParams.get("teacherName") || "Docente";
  const courseCode = searchParams.get("courseCode") || "";
  const courseName = searchParams.get("courseName") || "Curso no especificado";
  const teacherEmail = searchParams.get("teacherEmail") || "";

  const { user, isLoading: sessionLoading } = useSession();

  const { selectedDocenteId, selectedSilaboId } = useCoordinator();

  const { data: permissions = [], isLoading: permissionsLoading } =
    usePermissions(selectedDocenteId, selectedSilaboId);

  const savePermissionsMutation = useSavePermissions();

  const [sections, setSections] = useState<SyllabusSection[]>(INITIAL_SECTIONS);

  const [accessType, setAccessType] = useState<AccessType>("READ_ONLY");

  useEffect(() => {
    if (!sessionLoading && user) {
      const roleName = getRoleName(user.role);

      if (roleName !== "coordinadora_academica") {
        navigate("/");
      }
    }
  }, [user, sessionLoading, navigate]);

  useEffect(() => {
    if (permissionsLoading) return;

    const updatedSections = INITIAL_SECTIONS.map((section) => ({
      ...section,
      isEnabled: permissions.some((p) => p.numeroSeccion === section.id),
    }));

    const enabledCount = updatedSections.filter(
      (section) => section.isEnabled,
    ).length;

    const allEnabled = enabledCount === updatedSections.length;
    const noneEnabled = enabledCount === 0;

    if (allEnabled) {
      setAccessType("FULL_EDIT");
      setSections(
        updatedSections.map((section) => ({
          ...section,
          isEnabled: true,
        })),
      );
      return;
    }

    if (noneEnabled) {
      setAccessType("READ_ONLY");
      setSections(
        updatedSections.map((section) => ({
          ...section,
          isEnabled: false,
        })),
      );
      return;
    }

    setAccessType("RESTRICTED_EDIT");
    setSections(
      updatedSections.map((section) => ({
        ...section,
        isEnabled: isBaseSection(section.id) ? false : section.isEnabled,
      })),
    );
  }, [permissions, permissionsLoading]);

  const handleAccessChange = (value: AccessType) => {
    setAccessType(value);

    if (value === "READ_ONLY") {
      setSections((prevSections) =>
        prevSections.map((section) => ({
          ...section,
          isEnabled: false,
        })),
      );
      return;
    }

    if (value === "FULL_EDIT") {
      setSections((prevSections) =>
        prevSections.map((section) => ({
          ...section,
          isEnabled: true,
        })),
      );
      return;
    }

    setSections((prevSections) =>
      prevSections.map((section) => ({
        ...section,
        isEnabled: isBaseSection(section.id) ? false : section.isEnabled,
      })),
    );
  };

  const isSectionLocked = (id: number) => {
    if (accessType === "READ_ONLY") return true;
    if (accessType === "FULL_EDIT") return true;
    return isBaseSection(id);
  };

  const handleToggle = (id: number) => {
    if (accessType !== "RESTRICTED_EDIT") return;
    if (isBaseSection(id)) return;

    setSections((prevSections) =>
      prevSections.map((section) =>
        section.id === id
          ? { ...section, isEnabled: !section.isEnabled }
          : section,
      ),
    );
  };

  const getFinalEnabledSections = () => {
    if (accessType === "READ_ONLY") {
      return [];
    }

    if (accessType === "FULL_EDIT") {
      return sections.map((section) => ({
        ...section,
        isEnabled: true,
      }));
    }

    return sections.filter(
      (section) => section.isEnabled && !isBaseSection(section.id),
    );
  };

  const finalEnabledSections = getFinalEnabledSections();

  const enabledCount =
    accessType === "FULL_EDIT" ? sections.length : finalEnabledSections.length;

  const lockedCount =
    accessType === "READ_ONLY"
      ? sections.length
      : accessType === "RESTRICTED_EDIT"
        ? sections.filter((section) => isBaseSection(section.id)).length
        : 0;

  const accessLabel = getAccessLabel(accessType);
  const accessDescription = getAccessDescription(accessType);
  const accessStyles = getAccessStyles(accessType);

  const handleSave = async () => {
    if (!selectedDocenteId || !selectedSilaboId) {
      alert("Error: No se encontró información del docente o sílabo");
      return;
    }

    if (accessType === "RESTRICTED_EDIT" && finalEnabledSections.length === 0) {
      alert(
        "Para edición restringida debe seleccionar al menos una sección editable del 4 al 9.",
      );
      return;
    }

    const permissionsToSave =
      accessType === "READ_ONLY"
        ? []
        : finalEnabledSections.map((section) => ({
            numeroSeccion: section.id,
          }));

    try {
      await savePermissionsMutation.mutateAsync({
        silaboId: selectedSilaboId,
        docenteId: selectedDocenteId,
        permisos: permissionsToSave,
      });

      const queryParams = new URLSearchParams({
        fromPermissions: "1",
        teacherName,
        courseName,
        courseCode,
        accessType,
        accessLabel,
        docenteId: String(selectedDocenteId),
        silaboId: String(selectedSilaboId),
        enabledSections:
          accessType === "READ_ONLY"
            ? ""
            : finalEnabledSections.map((section) => section.title).join("|"),
      });

      navigate(`/coordinator/send-email?${queryParams.toString()}`, {
        state: { teacherEmail },
      });
    } catch {
      alert("Error al guardar los permisos. Por favor, intente de nuevo.");
    }
  };

  if (sessionLoading || permissionsLoading) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-8 py-6 text-gray-600 shadow-md">
          <Loader2 className="animate-spin text-red-600" size={22} />
          Cargando permisos...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-6 py-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión de permisos del sílabo
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Define qué secciones podrá editar el docente seleccionado.
            </p>
          </div>

          <div
            className={`inline-flex w-fit items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold ${accessStyles.badge}`}
          >
            {getAccessIcon(accessType)}
            {accessLabel}
          </div>
        </div>

        <section className="mb-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
          <div className="border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white px-7 py-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md">
                  <KeyRound size={30} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Permisos de edición
                  </h2>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    <span>
                      <span className="font-semibold text-gray-900">
                        Docente:
                      </span>{" "}
                      {teacherName}
                    </span>

                    {teacherEmail && (
                      <span>
                        <span className="font-semibold text-gray-900">
                          Correo:
                        </span>{" "}
                        {teacherEmail}
                      </span>
                    )}

                    <span>
                      <span className="font-semibold text-gray-900">
                        Curso:
                      </span>{" "}
                      {courseCode || "N/A"} - {courseName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 xl:min-w-[520px]">
                <div className="rounded-2xl bg-blue-600 p-4 text-white shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-white/80">Total</p>
                    <BookOpen size={20} className="text-white/80" />
                  </div>
                  <p className="mt-2 text-3xl font-bold">{sections.length}</p>
                </div>

                <div className="rounded-2xl bg-green-600 p-4 text-white shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-white/80">
                      Activadas
                    </p>
                    <CheckCircle size={20} className="text-white/80" />
                  </div>
                  <p className="mt-2 text-3xl font-bold">{enabledCount}</p>
                </div>

                <div className="rounded-2xl bg-gray-900 p-4 text-white shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-white/80">
                      Bloqueadas
                    </p>
                    <Lock size={20} className="text-white/80" />
                  </div>
                  <p className="mt-2 text-3xl font-bold">{lockedCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-7 xl:grid-cols-[1fr_360px]">
            <main className="space-y-6">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <label className="mb-2 block text-sm font-bold text-gray-900">
                  Alcance de edición
                </label>

                <select
                  value={accessType}
                  onChange={(event) =>
                    handleAccessChange(event.target.value as AccessType)
                  }
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                >
                  <option value="READ_ONLY">Solo lectura</option>
                  <option value="RESTRICTED_EDIT">Edición restringida</option>
                  <option value="FULL_EDIT">Edición completa autorizada</option>
                </select>

                <div
                  className={`mt-4 flex items-start gap-3 rounded-xl border p-4 ${accessStyles.card}`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accessStyles.icon}`}
                  >
                    {getAccessIcon(accessType)}
                  </div>

                  <div>
                    <p className="font-bold text-gray-900">{accessLabel}</p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                      {accessDescription}
                    </p>
                  </div>
                </div>
              </div>

              <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 bg-white px-6 py-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Secciones disponibles
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {accessType === "RESTRICTED_EDIT"
                          ? "Activa solo las secciones que podrá modificar el docente."
                          : "Vista informativa de las secciones según el alcance seleccionado."}
                      </p>
                    </div>

                    <div className="hidden rounded-xl bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-600 md:block">
                      {enabledCount} de {sections.length} habilitadas
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 p-5 md:grid-cols-2">
                  {sections.map((section) => {
                    const locked = isSectionLocked(section.id);
                    const visibleEnabled =
                      accessType === "FULL_EDIT" || section.isEnabled;

                    return (
                      <div
                        key={section.id}
                        className={`rounded-2xl border p-4 transition ${
                          visibleEnabled
                            ? "border-green-100 bg-green-50"
                            : locked
                              ? "border-gray-100 bg-gray-50"
                              : "border-red-100 bg-red-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                                visibleEnabled
                                  ? "bg-green-100 text-green-700"
                                  : "bg-white text-red-600"
                              }`}
                            >
                              {section.id}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-gray-900">
                                  {section.title}
                                </h4>

                                {section.hasInfo && (
                                  <button
                                    type="button"
                                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                                    title="Información"
                                  >
                                    <Info size={15} />
                                  </button>
                                )}
                              </div>

                              <p className="mt-1 text-xs text-gray-500">
                                {accessType === "READ_ONLY"
                                  ? "Solo disponible para consulta"
                                  : accessType === "FULL_EDIT"
                                    ? "Disponible para edición completa"
                                    : isBaseSection(section.id)
                                      ? "Bloqueada en edición restringida"
                                      : section.isEnabled
                                        ? "Disponible para edición"
                                        : "Sin permiso de edición"}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggle(section.id)}
                            disabled={locked}
                            className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                              locked
                                ? "cursor-not-allowed bg-gray-300"
                                : section.isEnabled
                                  ? "bg-green-600"
                                  : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                visibleEnabled
                                  ? "translate-x-8"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </main>

            <aside className="space-y-5">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <User size={20} />
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900">
                      Información del docente
                    </h3>
                    <p className="text-xs text-gray-500">
                      Datos asociados a la asignación
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-400">
                      Docente
                    </p>
                    <p className="font-semibold text-gray-900">{teacherName}</p>
                  </div>

                  {teacherEmail && (
                    <div>
                      <p className="text-xs font-bold uppercase text-gray-400">
                        Correo
                      </p>
                      <p className="break-all font-semibold text-gray-900">
                        {teacherEmail}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-bold uppercase text-gray-400">
                      Código
                    </p>
                    <p className="font-semibold text-gray-900">
                      {courseCode || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase text-gray-400">
                      Curso
                    </p>
                    <p className="font-semibold text-gray-900">{courseName}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${accessStyles.icon}`}
                  >
                    <ShieldCheck size={20} />
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900">
                      Configuración activa
                    </h3>
                    <p className="text-xs text-gray-500">
                      Resumen antes de guardar
                    </p>
                  </div>
                </div>

                <div className={`rounded-xl border p-4 ${accessStyles.card}`}>
                  <p className="text-xs font-bold uppercase text-gray-400">
                    Alcance
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${accessStyles.icon}`}
                    >
                      {getAccessIcon(accessType)}
                    </div>

                    <p className="font-bold text-gray-900">{accessLabel}</p>
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {accessDescription}
                  </p>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-bold uppercase text-gray-400">
                    Secciones habilitadas
                  </p>

                  {accessType === "READ_ONLY" && (
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
                      No se habilitarán secciones para edición.
                    </div>
                  )}

                  {accessType === "RESTRICTED_EDIT" && (
                    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                      {finalEnabledSections.length > 0 ? (
                        finalEnabledSections.map((section) => (
                          <div
                            key={section.id}
                            className="flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm font-medium text-green-800"
                          >
                            <CheckCircle2 size={15} />
                            {section.id}. {section.title}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-4 text-sm text-yellow-800">
                          Seleccione al menos una sección editable del 4 al 9.
                        </div>
                      )}
                    </div>
                  )}

                  {accessType === "FULL_EDIT" && (
                    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                      <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-sm font-medium text-green-800">
                        Todas las secciones estarán habilitadas.
                      </div>

                      {sections.map((section) => (
                        <div
                          key={section.id}
                          className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                        >
                          <FileText size={15} />
                          {section.id}. {section.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-7 py-5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gray-900 px-6 font-semibold text-white shadow-sm transition hover:bg-gray-800"
            >
              <ArrowLeft size={18} />
              Atrás
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={savePermissionsMutation.isPending || permissionsLoading}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-8 font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
            >
              {savePermissionsMutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Guardar y continuar
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
