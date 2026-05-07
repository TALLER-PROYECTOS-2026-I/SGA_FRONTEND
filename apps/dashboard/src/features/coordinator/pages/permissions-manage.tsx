// permissions-manage.tsx
// Archivo encargado de configurar el alcance de edición de un sílabo.
// Permite definir si el docente tendrá solo lectura, edición restringida
// o edición completa sobre las secciones del sílabo.
// Después de guardar los permisos, redirige a la pantalla de envío de correo.

// =====================================================
// IMPORTS
// =====================================================

// Importa hooks de React.
// useState permite manejar estados internos.
// useEffect permite ejecutar acciones cuando cambian datos o al cargar el componente.
import { useState, useEffect } from "react";

// Importa íconos desde lucide-react.
// Se usan para botones, tarjetas, estados visuales y opciones de permisos.
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

// Importa hooks de React Router.
// useNavigate permite navegar entre pantallas.
// useSearchParams permite leer parámetros de la URL.
import { useNavigate, useSearchParams } from "react-router-dom";

// Importa el contexto del coordinador.
// Sirve para obtener el docente y sílabo seleccionados previamente.
import { useCoordinator } from "../contexts/coordinator-context";

// Importa el hook de sesión.
// Sirve para obtener el usuario actual y validar su rol.
import { useSession } from "../../auth/hooks/use-session";

// Importa getRoleName.
// Convierte el id del rol del usuario en el nombre del rol.
import { getRoleName } from "../../../common/constants/roles";

// Importa hooks de permisos.
// usePermissions obtiene los permisos actuales.
// useSavePermissions guarda la nueva configuración de permisos.
import { usePermissions, useSavePermissions } from "../hooks/permissions-query";

// =====================================================
// INTERFACES Y TIPOS
// =====================================================

// Define la estructura de una sección del sílabo.
interface SyllabusSection {
  // Número de la sección.
  id: number;

  // Nombre visible de la sección.
  title: string;

  // Indica si la sección está habilitada para edición.
  isEnabled: boolean;

  // Indica si la sección tiene información adicional disponible.
  hasInfo: boolean;
}

// Define los tipos de acceso posibles para un docente.
type AccessType = "READ_ONLY" | "RESTRICTED_EDIT" | "FULL_EDIT";

// =====================================================
// SECCIONES INICIALES DEL SÍLABO
// =====================================================

// Lista base de secciones configurables del sílabo.
// Las secciones 1, 2 y 3 son secciones base.
// En edición restringida permanecen bloqueadas.
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

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

// Verifica si una sección pertenece al bloque base del sílabo.
// Las secciones 1, 2 y 3 no se habilitan en edición restringida.
function isBaseSection(sectionId: number) {
  return sectionId <= 3;
}

// Devuelve el texto visible del tipo de acceso.
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

// Devuelve la descripción explicativa del tipo de acceso seleccionado.
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

// Devuelve el ícono correspondiente al tipo de acceso.
// Solo lectura muestra candado.
// Edición restringida muestra edición.
// Edición completa muestra check.
function getAccessIcon(accessType: AccessType) {
  if (accessType === "READ_ONLY") {
    return <Lock size={18} />;
  }

  if (accessType === "RESTRICTED_EDIT") {
    return <Edit3 size={18} />;
  }

  return <CheckCircle2 size={18} />;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

// Componente encargado de gestionar los permisos de edición del sílabo.
export default function PermissionsManage() {
  // Hook para navegar entre páginas.
  const navigate = useNavigate();

  // Hook para leer parámetros recibidos por URL.
  const [searchParams] = useSearchParams();

  // =====================================================
  // PARÁMETROS DE URL
  // =====================================================

  // Nombre del docente recibido por URL.
  const teacherName = searchParams.get("teacherName") || "Docente";

  // Correo del docente recibido por URL.
  const teacherEmail = searchParams.get("teacherEmail") || "";

  // Nombre del curso o sílabo recibido por URL.
  const courseName = searchParams.get("courseName") || "Sílabo asignado";

  // Código del curso recibido por URL.
  const courseCode = searchParams.get("courseCode") || "";

  // =====================================================
  // SESIÓN Y CONTEXTO DEL COORDINADOR
  // =====================================================

  // Obtiene el usuario actual y el estado de carga de sesión.
  const { user, isLoading: sessionLoading } = useSession();

  // Obtiene el docente y sílabo seleccionados desde el contexto del coordinador.
  const { selectedDocenteId, selectedSilaboId } = useCoordinator();

  // =====================================================
  // CONSULTA Y GUARDADO DE PERMISOS
  // =====================================================

  // Consulta los permisos actuales del docente seleccionado.
  // permissions contiene las secciones que ya estaban habilitadas.
  // permissionsLoading indica si la consulta está cargando.
  const { data: permissions = [], isLoading: permissionsLoading } =
    usePermissions(selectedDocenteId);

  // Hook para guardar la nueva configuración de permisos.
  const savePermissionsMutation = useSavePermissions();

  // =====================================================
  // ESTADOS DEL FORMULARIO
  // =====================================================

  // Lista de secciones visibles en la pantalla.
  const [sections, setSections] =
    useState<SyllabusSection[]>(INITIAL_SECTIONS);

  // Tipo de acceso seleccionado.
  // Por defecto inicia como solo lectura.
  const [accessType, setAccessType] = useState<AccessType>("READ_ONLY");

  // =====================================================
  // VALIDACIÓN DE ROL
  // =====================================================

  // Valida que el usuario tenga rol de coordinadora académica.
  // Si no lo tiene, lo redirige al inicio.
  useEffect(() => {
    if (!sessionLoading && user) {
      const roleName = getRoleName(user.role);

      if (roleName !== "coordinadora_academica") {
        navigate("/");
      }
    }
  }, [user, sessionLoading, navigate]);

  // =====================================================
  // VALIDACIÓN DE CONTEXTO
  // =====================================================

  // Advierte en consola si no existe docente o sílabo seleccionado.
  // Esto ayuda a detectar errores de navegación o contexto.
  useEffect(() => {
    if (!selectedDocenteId || !selectedSilaboId) {
      console.warn("No se encontró información del docente o sílabo.");
    }
  }, [selectedDocenteId, selectedSilaboId]);

  // =====================================================
  // CARGAR PERMISOS EXISTENTES
  // =====================================================

  // Cuando terminan de cargar los permisos, actualiza las secciones.
  // También determina automáticamente el tipo de acceso actual:
  // - Todo habilitado: edición completa.
  // - Nada habilitado: solo lectura.
  // - Algunas secciones habilitadas: edición restringida.
  useEffect(() => {
    if (!permissionsLoading) {
      // Marca como habilitadas las secciones que ya existen en permisos.
      const updatedSections = INITIAL_SECTIONS.map((section) => ({
        ...section,
        isEnabled: permissions.some((p) => p.numeroSeccion === section.id),
      }));

      // Cuenta cuántas secciones están habilitadas.
      const enabledCount = updatedSections.filter(
        (section) => section.isEnabled,
      ).length;

      // Verifica si todas las secciones están habilitadas.
      const allEnabled = enabledCount === updatedSections.length;

      // Verifica si ninguna sección está habilitada.
      const noneEnabled = enabledCount === 0;

      // Si todas están habilitadas, se interpreta como edición completa.
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

      // Si ninguna está habilitada, se interpreta como solo lectura.
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

      // Si hay permisos parciales, se interpreta como edición restringida.
      // En este modo las secciones base 1, 2 y 3 quedan bloqueadas.
      setAccessType("RESTRICTED_EDIT");
      setSections(
        updatedSections.map((section) => ({
          ...section,
          isEnabled: isBaseSection(section.id) ? false : section.isEnabled,
        })),
      );
    }
  }, [permissions, permissionsLoading]);

  // =====================================================
  // CAMBIO DE TIPO DE ACCESO
  // =====================================================

  // Cambia el tipo de acceso y actualiza automáticamente las secciones.
  const handleAccessChange = (value: AccessType) => {
    // Guarda el nuevo tipo de acceso.
    setAccessType(value);

    // Si es solo lectura, deshabilita todas las secciones.
    if (value === "READ_ONLY") {
      setSections((prevSections) =>
        prevSections.map((section) => ({
          ...section,
          isEnabled: false,
        })),
      );
      return;
    }

    // Si es edición completa, habilita todas las secciones.
    if (value === "FULL_EDIT") {
      setSections((prevSections) =>
        prevSections.map((section) => ({
          ...section,
          isEnabled: true,
        })),
      );
      return;
    }

    // Si es edición restringida, mantiene las secciones seleccionadas,
    // pero bloquea las secciones base 1, 2 y 3.
    setSections((prevSections) =>
      prevSections.map((section) => ({
        ...section,
        isEnabled: isBaseSection(section.id) ? false : section.isEnabled,
      })),
    );
  };

  // =====================================================
  // ACTIVAR O DESACTIVAR SECCIONES
  // =====================================================

  // Cambia el estado de una sección específica.
  // Solo funciona cuando el tipo de acceso es edición restringida.
  const handleToggleSection = (id: number) => {
    // Si no es edición restringida, no permite cambiar secciones manualmente.
    if (accessType !== "RESTRICTED_EDIT") {
      return;
    }

    // Si la sección es base, no se puede activar ni desactivar.
    if (isBaseSection(id)) {
      return;
    }

    // Invierte el estado de la sección seleccionada.
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.id === id
          ? { ...section, isEnabled: !section.isEnabled }
          : section,
      ),
    );
  };

  // =====================================================
  // SECCIONES FINALES HABILITADAS
  // =====================================================

  // Obtiene la lista final de secciones que se guardarán.
  const getFinalEnabledSections = () => {
    // En solo lectura no se guarda ninguna sección habilitada.
    if (accessType === "READ_ONLY") {
      return [];
    }

    // En edición completa se guardan todas las secciones como habilitadas.
    if (accessType === "FULL_EDIT") {
      return sections.map((section) => ({
        ...section,
        isEnabled: true,
      }));
    }

    // En edición restringida solo se guardan las secciones habilitadas
    // que no pertenecen al bloque base.
    return sections.filter(
      (section) => section.isEnabled && !isBaseSection(section.id),
    );
  };

  // Secciones finales que se enviarán al backend.
  const finalEnabledSections = getFinalEnabledSections();

  // Texto visible del acceso seleccionado.
  const accessLabel = getAccessLabel(accessType);

  // Descripción visible del acceso seleccionado.
  const accessDescription = getAccessDescription(accessType);

  // =====================================================
  // GUARDAR CONFIGURACIÓN
  // =====================================================

  // Guarda los permisos configurados y luego redirige al envío de correo.
  const handleSave = async () => {
    // Valida que exista información del docente y sílabo.
    if (!selectedDocenteId || !selectedSilaboId) {
      alert("Error: No se encontró información del docente o sílabo");
      return;
    }

    // En edición restringida debe haber al menos una sección editable del 4 al 9.
    if (accessType === "RESTRICTED_EDIT" && finalEnabledSections.length === 0) {
      alert(
        "Para edición restringida debe seleccionar al menos una sección editable del 4 al 9.",
      );
      return;
    }

    // Construye el arreglo de permisos que se enviará al backend.
    // Solo se envía numeroSeccion porque es lo que espera el endpoint.
    const permissionsToSave = finalEnabledSections.map((section) => ({
      numeroSeccion: section.id,
    }));

    try {
      // Guarda los permisos en el backend.
      await savePermissionsMutation.mutateAsync({
        silaboId: selectedSilaboId,
        docenteId: selectedDocenteId,
        permisos: permissionsToSave,
      });

      // Construye los parámetros para redirigir al envío de correo.
      // La siguiente pantalla usará estos datos para generar el correo de habilitación.
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

      // Redirige a la pantalla de envío de correo.
      navigate(`/coordinator/send-email?${queryParams.toString()}`);
    } catch (error) {
      // Si falla el guardado, muestra error en consola y alerta al usuario.
      console.error("Error al guardar permisos:", error);
      alert("Error al guardar los permisos. Por favor, intente de nuevo.");
    }
  };

  // =====================================================
  // ESTADO DE CARGA
  // =====================================================

  // Mientras carga sesión o permisos, muestra un mensaje de espera.
  if (sessionLoading || permissionsLoading) {
    return (
      <div className="p-6 text-center text-gray-600">
        Cargando permisos...
      </div>
    );
  }

  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-8 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Encabezado principal de la pantalla. */}
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
          {/* =====================================================
              PANEL IZQUIERDO: FORMULARIO DE CONFIGURACIÓN
              ===================================================== */}

          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
            {/* Cabecera del formulario. */}
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
              {/* Información del sílabo asignado. */}
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

              {/* Selector de alcance de edición. */}
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

                {/* Descripción visual del alcance seleccionado. */}
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

              {/* Lista de secciones habilitables.
                  Solo se muestra cuando el acceso es edición restringida. */}
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
                      // Las secciones base no se pueden editar en modo restringido.
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

                            {/* Badge para indicar que una sección está bloqueada. */}
                            {disabled && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                                <Lock size={12} />
                                Bloqueado
                              </span>
                            )}

                            {/* Botón informativo para secciones con información adicional. */}
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

                          {/* Switch para activar o desactivar sección. */}
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

              {/* Botones inferiores del formulario. */}
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

          {/* =====================================================
              PANEL DERECHO: VISTA PREVIA DE CONFIGURACIÓN
              ===================================================== */}

          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
            <div className="bg-red-700 px-6 py-5 text-white">
              <h2 className="text-lg font-bold">Configuración activa</h2>

              <p className="mt-1 text-sm text-red-100">
                Vista previa de la configuración que se guardará.
              </p>
            </div>

            <div className="space-y-5 p-6">
              {/* Datos del docente. */}
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

              {/* Datos del sílabo. */}
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

              {/* Resumen del alcance seleccionado. */}
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

              {/* Vista previa de secciones habilitadas. */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-gray-400">
                  Secciones habilitadas
                </p>

                {/* Caso solo lectura. */}
                {accessType === "READ_ONLY" && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
                    No se habilitarán secciones para edición.
                  </div>
                )}

                {/* Caso edición restringida. */}
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

                {/* Caso edición completa. */}
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