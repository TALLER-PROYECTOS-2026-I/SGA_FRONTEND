import { useState, useEffect } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Edit3,
  Info,
  Lock,
  Save,
  User,
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
      return "El docente solo podrá consultar la información del sílabo, sin realizar modificaciones.";
    case "RESTRICTED_EDIT":
      return "El docente podrá editar únicamente las secciones habilitadas por la coordinación. Las secciones 1, 2 y 3 permanecen bloqueadas.";
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

export default function PermissionsManage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const teacherName = searchParams.get("teacherName") || "Docente";
  const teacherEmail = searchParams.get("teacherEmail") || "";
  const courseName = searchParams.get("courseName") || "Sílabo asignado";
  const courseCode = searchParams.get("courseCode") || "";

  const { user, isLoading: sessionLoading } = useSession();
  const { selectedDocenteId, selectedSilaboId } = useCoordinator();

  const { data: permissions = [], isLoading: permissionsLoading } =
    usePermissions(selectedDocenteId);

  const savePermissionsMutation = useSavePermissions();

  const [sections, setSections] =
    useState<SyllabusSection[]>(INITIAL_SECTIONS);

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
    if (!selectedDocenteId || !selectedSilaboId) {
      console.warn("No se encontró información del docente o sílabo.");
    }
  }, [selectedDocenteId, selectedSilaboId]);

  useEffect(() => {
    if (!permissionsLoading) {
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
    }
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

  const handleToggleSection = (id: number) => {
    if (accessType !== "RESTRICTED_EDIT") {
      return;
    }

    if (isBaseSection(id)) {
      return;
    }

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
  const accessLabel = getAccessLabel(accessType);
  const accessDescription = getAccessDescription(accessType);

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

    const permissionsToSave = finalEnabledSections.map((section) => ({
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
        teacherEmail,
        courseName,
        courseCode,
        accessType,
        accessLabel,
        docenteId: String(selectedDocenteId),
        silaboId: String(selectedSilaboId),
        enabledSections: finalEnabledSections
          .map((section) => section.title)
          .join("|"),
      });

      navigate(`/coordinator/send-email?${queryParams.toString()}`);
    } catch (error) {
      console.error("Error al guardar permisos:", error);
      alert("Error al guardar los permisos. Por favor, intente de nuevo.");
    }
  };

  if (sessionLoading || permissionsLoading) {
    return (
      <div className="p-6 text-center text-gray-600">
        Cargando permisos...
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-8 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7">
          <h1 className="text-3xl font-bold text-gray-900">
            Configurar Alcance de Edición de Sílabos
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Define el nivel de edición que tendrá cada docente sobre los sílabos
            asignados.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.85fr]">
          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
            <div className="border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                  <Edit3 size={24} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Nueva configuración
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Asigna permisos de edición para el sílabo seleccionado.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 p-8">
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-900">
                  Sílabo asignado
                </label>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700">
                      <BookOpen size={20} />
                    </div>

                    <div>
                      <p className="font-semibold text-gray-900">
                        {courseName}
                      </p>

                      <p className="text-sm text-gray-500">
                        {courseCode
                          ? `Código: ${courseCode}`
                          : "Código no informado"}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Docente: {teacherName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
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
                  <option value="RESTRICTED_EDIT">
                    Edición restringida
                  </option>
                  <option value="FULL_EDIT">
                    Edición completa autorizada
                  </option>
                </select>

                <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        accessType === "READ_ONLY"
                          ? "bg-gray-200 text-gray-700"
                          : accessType === "RESTRICTED_EDIT"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {getAccessIcon(accessType)}
                    </div>

                    <div>
                      <p className="font-bold text-gray-900">{accessLabel}</p>

                      <p className="mt-1 text-sm text-gray-600">
                        {accessDescription}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {accessType === "RESTRICTED_EDIT" && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="block text-sm font-bold text-gray-900">
                      Secciones habilitadas
                    </label>

                    <span className="text-xs font-semibold text-gray-500">
                      {finalEnabledSections.length} de 6
                    </span>
                  </div>

                  <div className="space-y-3">
                    {sections.map((section) => {
                      const disabled = isBaseSection(section.id);

                      return (
                        <div
                          key={section.id}
                          className={`flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 transition hover:shadow-sm ${
                            disabled ? "opacity-60" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800">
                              {section.id}. {section.title}
                            </span>

                            {disabled && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                                <Lock size={12} />
                                Bloqueado
                              </span>
                            )}

                            {section.hasInfo && (
                              <button
                                type="button"
                                className="text-blue-500 transition hover:text-blue-700"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <Info size={16} />
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleSection(section.id)}
                            disabled={disabled}
                            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                              disabled ? "cursor-not-allowed" : ""
                            }`}
                            style={{
                              backgroundColor: section.isEnabled
                                ? "#991B1B"
                                : "#D1D5DB",
                            }}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                                section.isEnabled
                                  ? "translate-x-8"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  <ArrowLeft size={17} />
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={savePermissionsMutation.isPending}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-700 px-6 text-sm font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  <Save size={17} />
                  {savePermissionsMutation.isPending
                    ? "Guardando..."
                    : "Guardar configuración"}
                </button>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
            <div className="bg-red-700 px-6 py-5 text-white">
              <h2 className="text-lg font-bold">Configuración activa</h2>

              <p className="mt-1 text-sm text-red-100">
                Vista previa de la configuración que se guardará.
              </p>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                  <User size={20} />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">
                    Docente
                  </p>

                  <p className="font-semibold text-gray-900">{teacherName}</p>

                  <p className="text-sm text-gray-500">
                    {teacherEmail || "Correo no informado"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                  <BookOpen size={20} />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">
                    Sílabo
                  </p>

                  <p className="font-semibold text-gray-900">{courseName}</p>

                  <p className="text-sm text-gray-500">
                    {courseCode || "Código no informado"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase text-gray-400">
                  Alcance
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      accessType === "READ_ONLY"
                        ? "bg-gray-200 text-gray-700"
                        : accessType === "RESTRICTED_EDIT"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                    }`}
                  >
                    {getAccessIcon(accessType)}
                  </div>

                  <p className="font-bold text-gray-900">{accessLabel}</p>
                </div>

                <p className="mt-2 text-sm text-gray-600">
                  {accessDescription}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase text-gray-400">
                  Secciones habilitadas
                </p>

                {accessType === "READ_ONLY" && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
                    No se habilitarán secciones para edición.
                  </div>
                )}

                {accessType === "RESTRICTED_EDIT" && (
                  <div className="space-y-2">
                    {finalEnabledSections.length > 0 ? (
                      finalEnabledSections.map((section) => (
                        <div
                          key={section.id}
                          className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                        >
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
                  <div className="space-y-2">
                    <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-sm font-medium text-green-800">
                      Todas las secciones del sílabo estarán habilitadas.
                    </div>

                    {sections.map((section) => (
                      <div
                        key={section.id}
                        className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                      >
                        {section.id}. {section.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}