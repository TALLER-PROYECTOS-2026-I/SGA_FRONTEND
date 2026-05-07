// approved-syllabus.tsx
// Archivo encargado de seleccionar un sílabo aprobado y generar su PDF oficial.
// Permite buscar sílabos aprobados, validar su información, generar vista previa
// y descargar el documento PDF.

// =====================================================
// IMPORTS
// =====================================================

// Importa hooks de React.
// useState permite manejar estados internos del componente.
// useEffect permite ejecutar efectos secundarios.
// useRef permite referenciar elementos del DOM, como el dropdown.
import { useState, useEffect, useRef } from "react";

// Importa íconos desde lucide-react.
// Se usan para mejorar visualmente botones, advertencias y estados.
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Printer,
  Search,
  X,
  AlertTriangle,
} from "lucide-react";

// Importa hooks de React Router.
// useNavigate permite navegar entre páginas.
// useSearchParams permite leer parámetros de la URL.
import { useNavigate, useSearchParams } from "react-router-dom";

// Importa el hook para obtener sílabos aprobados.
// También importa el tipo ApprovedSyllabus para tipar los sílabos seleccionados.
import {
  useApprovedSyllabi,
  type ApprovedSyllabus as ApprovedSyllabusType,
} from "../hooks/use-approved-syllabus";

// Importa pdf desde React PDF.
// Sirve para convertir un componente PDF en un archivo Blob.
import { pdf } from "@react-pdf/renderer";

// Importa el servicio que obtiene la información completa del sílabo.
// Este servicio se usa antes de generar el PDF oficial.
import { syllabusPDFService } from "../../syllabus/services/syllabus-pdf-service";

// Importa el componente que representa el documento PDF del sílabo.
// Este componente se convierte luego en Blob para vista previa o descarga.
import { SyllabusPDFDocument } from "../../syllabus/components/SyllabusPDFDocument";

// Importa el tipo CompleteSyllabus.
// Sirve para tipar la información completa del sílabo usada en el PDF.
import type { CompleteSyllabus } from "../../syllabus/types/complete-syllabus";

// Importa el hook personalizado de notificaciones.
// Se usa para mostrar mensajes de éxito, error, advertencia e información.
import { useToast } from "../../../common/hooks/use-toast";

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

// Normaliza el estado del sílabo.
// Convierte el estado a mayúsculas, elimina espacios y corrige EN_REVISION a EN_REVISIÓN.
// Esto permite comparar estados aunque lleguen con formatos diferentes.
function normalizeStatus(status?: string) {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace("EN_REVISION", "EN_REVISIÓN");
}

// Construye un sílabo seleccionado usando datos que vienen desde la URL.
// Se usa cuando esta pantalla se abre desde el módulo de seguimiento.
// Si falta código o nombre del curso, coloca valores por defecto.
function buildSelectedFromTracking(params: {
  syllabusId: number;
  courseCodeParam: string;
  courseNameParam: string;
  teacherNameParam: string;
}): ApprovedSyllabusType {
  return {
    id: params.syllabusId,
    codigo: params.courseCodeParam || `SIL-${params.syllabusId}`,
    asignatura: params.courseNameParam || "Sílabo aprobado",
    ciclo: "",
    escuela: "",
    estadoRevision: "APROBADO",
  };
}

// Revisa qué secciones importantes faltan en la información completa del sílabo.
// Devuelve una lista de nombres de secciones incompletas.
// Esta validación no impide generar el PDF, pero muestra advertencia al usuario.
function getMissingSections(data: CompleteSyllabus) {
  // Arreglo donde se guardan los nombres de las secciones faltantes.
  const missing: string[] = [];

  // Verifica si existen datos generales.
  if (!data.datosGenerales) {
    missing.push("Datos generales");
  }

  // Verifica si existe el nombre de la asignatura.
  if (!data.datosGenerales?.nombreAsignatura) {
    missing.push("Nombre de asignatura");
  }

  // Verifica si existe el código de la asignatura.
  if (!data.datosGenerales?.codigoAsignatura) {
    missing.push("Código de asignatura");
  }

  // Verifica si existe la sumilla.
  if (!data.sumilla) {
    missing.push("Sumilla");
  }

  // Verifica si existen competencias del curso.
  if (!data.competenciasCurso || data.competenciasCurso.length === 0) {
    missing.push("Competencias");
  }

  // Verifica si existen unidades didácticas.
  if (!data.unidadesDidacticas || data.unidadesDidacticas.length === 0) {
    missing.push("Programación de contenidos");
  }

  // Verifica si existen estrategias metodológicas.
  if (
    !data.estrategiasMetodologicas ||
    data.estrategiasMetodologicas.length === 0
  ) {
    missing.push("Estrategias metodológicas");
  }

  // Verifica si existen recursos didácticos.
  if (!data.recursosDidacticos) {
    missing.push("Recursos didácticos");
  }

  // Verifica si existe información de evaluación.
  if (!data.evaluacionAprendizaje) {
    missing.push("Evaluación del aprendizaje");
  }

  // Verifica si existen fuentes de consulta.
  if (!data.fuentes || data.fuentes.length === 0) {
    missing.push("Fuentes de consulta");
  }

  // Verifica si existen aportes a resultados del programa.
  if (
    !data.aportesResultadosPrograma ||
    data.aportesResultadosPrograma.length === 0
  ) {
    missing.push("Aportes y contribuciones");
  }

  // Devuelve la lista de secciones faltantes.
  return missing;
}

// Construye el nombre del archivo PDF a descargar.
// Usa el código del sílabo seleccionado y lo limpia para que sea válido como nombre de archivo.
function buildFileName(syllabus?: ApprovedSyllabusType | null) {
  // Si no hay sílabo seleccionado, devuelve un nombre genérico.
  if (!syllabus) return "silabo-oficial-aprobado.pdf";

  // Limpia el código del sílabo:
  // lo convierte a minúsculas, reemplaza caracteres no válidos por guiones
  // y elimina guiones sobrantes al inicio o final.
  const cleanCode = String(syllabus.codigo || "aprobado")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Devuelve el nombre final del PDF.
  return `silabo-oficial-${cleanCode}.pdf`;
}

// =====================================================
// COMPONENTE AUXILIAR DE VERIFICACIÓN
// =====================================================

// Componente pequeño para mostrar si una sección del sílabo está completa o incompleta.
// Si ok es true muestra check verde.
// Si ok es false muestra equis roja.
function SectionCheck({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}) {
  return (
    <p className={ok ? "text-green-800" : "font-semibold text-red-700"}>
      {ok ? "✓" : "✕"} {label}
    </p>
  );
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

// Componente principal para seleccionar un sílabo aprobado,
// generar el PDF oficial, previsualizarlo y descargarlo.
export default function ApprovedSyllabus() {
  // Hook de notificaciones para mostrar mensajes al usuario.
  const toast = useToast();

  // Hook para navegar entre páginas.
  const navigate = useNavigate();

  // Hook para leer parámetros de la URL.
  const [searchParams] = useSearchParams();

  // =====================================================
  // PARÁMETROS DE URL
  // =====================================================

  // Id del sílabo recibido por URL.
  const syllabusIdParam = searchParams.get("syllabusId");

  // Nombre del curso recibido por URL.
  const courseNameParam = searchParams.get("courseName") || "";

  // Código del curso recibido por URL.
  const courseCodeParam = searchParams.get("courseCode") || "";

  // Nombre del docente recibido por URL.
  const teacherNameParam = searchParams.get("teacherName") || "";

  // Estado del sílabo recibido por URL.
  const statusParam = searchParams.get("status") || "";

  // =====================================================
  // ESTADOS DEL BUSCADOR Y SELECCIÓN
  // =====================================================

  // Texto que el usuario escribe para buscar un sílabo aprobado.
  const [searchText, setSearchText] = useState("");

  // Controla si el dropdown de resultados está visible.
  const [showDropdown, setShowDropdown] = useState(false);

  // Guarda el sílabo aprobado seleccionado.
  const [selectedSyllabus, setSelectedSyllabus] =
    useState<ApprovedSyllabusType | null>(null);

  // Mensaje de advertencia cuando el sílabo tiene información incompleta.
  const [warningMessage, setWarningMessage] = useState("");

  // =====================================================
  // ESTADOS DEL PDF
  // =====================================================

  // Indica si se está generando la información del PDF.
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Indica si se está descargando el PDF.
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Indica si se está abriendo la vista previa del PDF.
  const [isPreviewingPDF, setIsPreviewingPDF] = useState(false);

  // Guarda la información completa del sílabo usada para generar el PDF.
  const [generatedPdfData, setGeneratedPdfData] =
    useState<CompleteSyllabus | null>(null);

  // Indica si el PDF ya fue generado correctamente.
  const [isPdfGenerated, setIsPdfGenerated] = useState(false);

  // Referencia al contenedor del dropdown.
  // Se usa para detectar clics fuera del menú y cerrarlo.
  const dropdownRef = useRef<HTMLDivElement>(null);

  // =====================================================
  // CONSULTA DE SÍLABOS APROBADOS
  // =====================================================

  // Obtiene la lista de sílabos desde el hook useApprovedSyllabi.
  // data contiene los sílabos.
  // isLoading indica si se están cargando.
  // isError indica si ocurrió un error.
  // error contiene el detalle del error.
  const {
    data: syllabi = [],
    isLoading,
    isError,
    error,
  } = useApprovedSyllabi();

  // =====================================================
  // EFECTO PARA CERRAR DROPDOWN AL HACER CLIC FUERA
  // =====================================================

  // Registra un listener para detectar clics fuera del dropdown.
  // Si el usuario hace clic fuera, se cierra la lista de resultados.
  useEffect(() => {
    // Función que se ejecuta cuando el usuario hace clic en la página.
    const handleClickOutside = (event: MouseEvent) => {
      // Si existe el dropdown y el clic no ocurrió dentro de él,
      // se oculta el dropdown.
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    // Agrega el listener al documento.
    document.addEventListener("mousedown", handleClickOutside);

    // Limpia el listener cuando el componente se desmonta.
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // =====================================================
  // EFECTO PARA SELECCIONAR SÍLABO DESDE LA URL
  // =====================================================

  // Si la pantalla recibe syllabusId en la URL,
  // construye automáticamente un sílabo seleccionado.
  // Esto permite abrir esta pantalla desde seguimiento de sílabos.
  useEffect(() => {
    // Si no hay id en la URL, no hace nada.
    if (!syllabusIdParam) return;

    // Convierte el id de la URL a número.
    const syllabusId = Number(syllabusIdParam);

    // Si el id no es válido, no hace nada.
    if (!syllabusId || Number.isNaN(syllabusId)) return;

    // Normaliza el estado recibido.
    // Si no llega estado, se asume APROBADO.
    const status = normalizeStatus(statusParam || "APROBADO");

    // Si el sílabo no está aprobado, no permite generar PDF oficial.
    if (status !== "APROBADO") {
      toast.error(
        "No permitido",
        "Solo se puede generar PDF oficial de sílabos aprobados.",
      );
      return;
    }

    // Construye un objeto de sílabo seleccionado usando los parámetros de la URL.
    const selectedFromTracking = buildSelectedFromTracking({
      syllabusId,
      courseCodeParam,
      courseNameParam,
      teacherNameParam,
    });

    // Guarda el sílabo como seleccionado.
    setSelectedSyllabus(selectedFromTracking);

    // Muestra el código y nombre del sílabo en el buscador.
    setSearchText(
      `${selectedFromTracking.codigo} - ${selectedFromTracking.asignatura}`,
    );

    // Cierra el dropdown porque ya hay un sílabo seleccionado.
    setShowDropdown(false);
  }, [
    syllabusIdParam,
    courseCodeParam,
    courseNameParam,
    teacherNameParam,
    statusParam,
    toast,
  ]);

  // =====================================================
  // FILTROS DE SÍLABOS
  // =====================================================

  // Filtra la lista total y deja únicamente los sílabos aprobados.
  const approvedSyllabi = syllabi.filter((syllabus) => {
    return normalizeStatus(syllabus.estadoRevision) === "APROBADO";
  });

  // Filtra los sílabos aprobados según el texto escrito por el usuario.
  // Busca coincidencias por código o por nombre de asignatura.
  const filteredSyllabi = approvedSyllabi.filter((syllabus) => {
    // Convierte el texto de búsqueda a minúsculas para comparar sin distinguir mayúsculas.
    const searchLower = searchText.toLowerCase();

    // Verifica si el código del sílabo coincide con la búsqueda.
    const matchesCodigo = syllabus.codigo?.toLowerCase().includes(searchLower);

    // Verifica si el nombre de la asignatura coincide con la búsqueda.
    const matchesAsignatura = syllabus.asignatura
      ?.toLowerCase()
      .includes(searchLower);

    // Devuelve true si coincide por código o asignatura.
    return matchesCodigo || matchesAsignatura;
  });

  // =====================================================
  // VALIDACIÓN DEL SÍLABO SELECCIONADO
  // =====================================================

  // Valida que exista un sílabo seleccionado y que esté aprobado.
  // Devuelve true si se puede generar PDF oficial.
  // Devuelve false si falta selección o el estado no es APROBADO.
  const validateApprovedSyllabus = () => {
    // Si no hay sílabo seleccionado, muestra error y detiene el proceso.
    if (!selectedSyllabus) {
      toast.error("Error", "Por favor selecciona un sílabo aprobado primero.");
      return false;
    }

    // Normaliza el estado del sílabo seleccionado.
    const status = normalizeStatus(selectedSyllabus.estadoRevision);

    // Si el sílabo no está aprobado, no se permite generar el PDF oficial.
    if (status !== "APROBADO") {
      toast.error(
        "No permitido",
        "Solo se puede generar PDF oficial de sílabos aprobados.",
      );
      return false;
    }

    // Si pasa todas las validaciones, devuelve true.
    return true;
  };

  // =====================================================
  // CARGAR INFORMACIÓN COMPLETA DEL SÍLABO
  // =====================================================

  // Obtiene la información completa del sílabo seleccionado.
  // También revisa si faltan secciones importantes y genera advertencias.
  const loadCompleteSyllabus = async () => {
    // Si no hay sílabo seleccionado, lanza error.
    if (!selectedSyllabus) {
      throw new Error("No hay sílabo seleccionado");
    }

    // Consulta la información completa del sílabo usando el servicio PDF.
    const data: CompleteSyllabus =
      await syllabusPDFService.fetchCompleteSyllabus(selectedSyllabus.id);

    // Obtiene la lista de secciones faltantes.
    const missingSections = getMissingSections(data);

    // Si faltan secciones, muestra advertencia y guarda el mensaje.
    if (missingSections.length > 0) {
      const message = `El sílabo tiene información incompleta: ${missingSections.join(
        ", ",
      )}.`;

      setWarningMessage(message);
      toast.warning("Advertencia", message);
    } else {
      // Si no faltan secciones, limpia cualquier advertencia anterior.
      setWarningMessage("");
    }

    // Devuelve la información completa del sílabo.
    return data;
  };

  // =====================================================
  // SELECCIÓN Y LIMPIEZA
  // =====================================================

  // Maneja la selección de un sílabo desde el dropdown.
  // Solo permite seleccionar sílabos aprobados.
  const handleSyllabusSelect = (syllabus: ApprovedSyllabusType) => {
    // Si el sílabo no está aprobado, muestra error y no lo selecciona.
    if (normalizeStatus(syllabus.estadoRevision) !== "APROBADO") {
      toast.error(
        "No permitido",
        "Solo se puede seleccionar sílabos aprobados para generar PDF oficial.",
      );
      return;
    }

    // Guarda el sílabo seleccionado.
    setSelectedSyllabus(syllabus);

    // Muestra código y nombre del sílabo en el input de búsqueda.
    setSearchText(`${syllabus.codigo} - ${syllabus.asignatura}`);

    // Cierra el dropdown.
    setShowDropdown(false);

    // Limpia advertencias y datos PDF anteriores.
    setWarningMessage("");
    setGeneratedPdfData(null);
    setIsPdfGenerated(false);
  };

  // Limpia la selección del sílabo y reinicia el estado del PDF.
  const handleClear = () => {
    setSelectedSyllabus(null);
    setSearchText("");
    setShowDropdown(false);
    setWarningMessage("");
    setGeneratedPdfData(null);
    setIsPdfGenerated(false);
  };

  // =====================================================
  // GENERAR PDF OFICIAL
  // =====================================================

  // Genera el PDF oficial en memoria.
  // Primero valida que el sílabo esté aprobado, luego carga la información completa.
  const handleGenerateOfficialPDF = async () => {
    // Si la validación falla, detiene el proceso.
    if (!validateApprovedSyllabus()) return;

    // Activa estado de carga del botón.
    setIsGeneratingPDF(true);

    try {
      // Informa al usuario que el PDF se está generando.
      toast.info("Generando PDF oficial", "Validando información del sílabo...");

      // Carga la información completa del sílabo.
      const data = await loadCompleteSyllabus();

      // Guarda los datos del PDF y marca el PDF como generado.
      setGeneratedPdfData(data);
      setIsPdfGenerated(true);

      // Muestra mensaje de éxito.
      toast.success(
        "PDF generado correctamente",
        "Ahora puedes visualizar o descargar el documento.",
      );
    } catch (err) {
      // Registra el error en consola y muestra mensaje al usuario.
      console.error("Error al generar PDF oficial:", err);
      toast.error(
        "Error",
        "Error al generar el PDF oficial. Por favor intenta nuevamente.",
      );
    } finally {
      // Desactiva el estado de carga aunque haya éxito o error.
      setIsGeneratingPDF(false);
    }
  };

  // =====================================================
  // VISTA PREVIA DEL PDF
  // =====================================================

  // Genera una vista previa del PDF en una nueva pestaña.
  const handlePreviewPDF = async () => {
    // Si el PDF no fue generado, pide generarlo primero.
    if (!generatedPdfData) {
      toast.error(
        "PDF no generado",
        "Primero presiona el botón Generar PDF Oficial.",
      );
      return;
    }

    // Activa estado de carga para la vista previa.
    setIsPreviewingPDF(true);

    try {
      // Convierte el componente SyllabusPDFDocument en un Blob PDF.
      const blob = await pdf(
        <SyllabusPDFDocument data={generatedPdfData} />,
      ).toBlob();

      // Crea una URL temporal para abrir el PDF en el navegador.
      const url = URL.createObjectURL(blob);

      // Abre el PDF en una nueva pestaña.
      window.open(url, "_blank");

      // Muestra mensaje de éxito.
      toast.success("Éxito", "Vista previa abierta en nueva pestaña");
    } catch (err) {
      // Registra error y avisa al usuario.
      console.error("Error al previsualizar PDF:", err);
      toast.error(
        "Error",
        "Error al generar la vista previa. Por favor intenta nuevamente.",
      );
    } finally {
      // Desactiva estado de carga.
      setIsPreviewingPDF(false);
    }
  };

  // =====================================================
  // DESCARGA DEL PDF
  // =====================================================

  // Descarga el PDF oficial generado.
  const handleDownloadPDF = async () => {
    // Si el PDF no fue generado, pide generarlo primero.
    if (!generatedPdfData) {
      toast.error(
        "PDF no generado",
        "Primero presiona el botón Generar PDF Oficial.",
      );
      return;
    }

    // Activa estado de descarga.
    setIsDownloadingPDF(true);

    try {
      // Convierte el componente SyllabusPDFDocument en un Blob PDF.
      const blob = await pdf(
        <SyllabusPDFDocument data={generatedPdfData} />,
      ).toBlob();

      // Crea una URL temporal para descargar el archivo.
      const url = URL.createObjectURL(blob);

      // Crea un enlace temporal para disparar la descarga.
      const link = document.createElement("a");

      // Asigna la URL del PDF al enlace.
      link.href = url;

      // Define el nombre del archivo descargado.
      link.download = buildFileName(selectedSyllabus);

      // Agrega el enlace al documento para poder hacer clic programáticamente.
      document.body.appendChild(link);

      // Ejecuta la descarga.
      link.click();

      // Elimina el enlace temporal del documento.
      document.body.removeChild(link);

      // Libera la URL temporal para evitar consumo innecesario de memoria.
      URL.revokeObjectURL(url);

      // Muestra mensaje de éxito.
      toast.success("Éxito", "PDF oficial descargado correctamente");
    } catch (err) {
      // Registra error y muestra mensaje al usuario.
      console.error("Error al descargar PDF:", err);
      toast.error(
        "Error",
        "Error al descargar el PDF. Por favor intenta nuevamente.",
      );
    } finally {
      // Desactiva estado de descarga.
      setIsDownloadingPDF(false);
    }
  };

  // =====================================================
  // ESTADO DE CARGA
  // =====================================================

  // Si se están cargando sílabos y no viene un syllabusId por URL,
  // muestra una pantalla de carga.
  if (isLoading && !syllabusIdParam) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-600">Cargando sílabos aprobados...</div>
      </div>
    );
  }

  // =====================================================
  // ESTADO DE ERROR
  // =====================================================

  // Si ocurre error cargando sílabos y no viene un syllabusId por URL,
  // muestra el mensaje de error.
  if (isError && !syllabusIdParam) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-600">
          Error al cargar sílabos: {error?.message}
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================

  return (
    <div className="min-h-screen bg-[#f7f7f8] px-6 py-8">
      <div className="mx-auto w-full max-w-4xl">
        {/* Sección principal para buscar y seleccionar un sílabo aprobado. */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <FileText className="h-5 w-5 text-red-700" />
            <h1 className="text-xl font-bold text-gray-900">
              CA1: Seleccionar Sílabo Aprobado
            </h1>
          </div>

          {/* Campo de búsqueda de sílabo aprobado. */}
          <div className="mb-5">
            <label
              htmlFor="approved-syllabus-search"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Sílabo aprobado *
            </label>

            {/* Contenedor relativo para posicionar el dropdown. */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3">
                <input
                  id="approved-syllabus-search"
                  type="text"
                  value={searchText}
                  disabled={Boolean(syllabusIdParam)}
                  onChange={(event) => {
                    setSearchText(event.target.value);
                    setSelectedSyllabus(null);
                    setGeneratedPdfData(null);
                    setIsPdfGenerated(false);
                    setWarningMessage("");
                    setShowDropdown(true);
                  }}
                  onFocus={() => {
                    if (!syllabusIdParam) {
                      setShowDropdown(true);
                    }
                  }}
                  placeholder="Buscar por código o nombre de asignatura..."
                  className="flex-1 bg-transparent text-sm text-gray-700 outline-none disabled:text-gray-700"
                />

                <Search className="text-gray-400" size={19} />

                {/* Botón para limpiar búsqueda y selección. */}
                {searchText && !syllabusIdParam && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-full p-1 transition hover:bg-gray-100"
                    aria-label="Limpiar búsqueda de sílabo aprobado"
                  >
                    <X className="text-gray-500" size={18} />
                  </button>
                )}
              </div>

              {/* Dropdown con sílabos aprobados encontrados. */}
              {showDropdown && searchText && filteredSyllabi.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                  {filteredSyllabi.slice(0, 15).map((syllabus) => (
                    <button
                      key={syllabus.id}
                      type="button"
                      onClick={() => handleSyllabusSelect(syllabus)}
                      className="w-full border-b border-gray-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-red-50"
                    >
                      <div className="font-medium text-gray-900">
                        {syllabus.codigo}
                      </div>
                      <div className="text-sm text-gray-600">
                        {syllabus.asignatura}
                      </div>
                      {syllabus.ciclo && (
                        <div className="mt-1 text-xs text-gray-500">
                          Ciclo: {syllabus.ciclo}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Mensaje cuando no hay resultados para la búsqueda. */}
              {showDropdown && searchText && filteredSyllabi.length === 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-300 bg-white p-4 shadow-lg">
                  <p className="text-center text-gray-500">
                    No se encontraron sílabos aprobados con ese criterio.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Resumen del sílabo seleccionado. */}
          {selectedSyllabus && (
            <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="mb-3 text-sm font-semibold text-green-800">
                Sílabo seleccionado:
              </p>

              <div className="grid grid-cols-1 gap-2 text-sm text-green-900 md:grid-cols-2">
                <p>
                  <span className="font-semibold">Código:</span>{" "}
                  {selectedSyllabus.codigo}
                </p>

                <p>
                  <span className="font-semibold">Periodo:</span>{" "}
                  {generatedPdfData?.datosGenerales?.semestreAcademico ||
                    "No informado"}
                </p>

                <p className="md:col-span-2">
                  <span className="font-semibold">Asignatura:</span>{" "}
                  {selectedSyllabus.asignatura}
                </p>

                <p className="md:col-span-2">
                  <span className="font-semibold">Docente:</span>{" "}
                  {teacherNameParam ||
                    generatedPdfData?.datosGenerales?.docentes ||
                    "No asignado"}
                </p>
              </div>
            </div>
          )}

          {/* Botón para generar el PDF oficial. */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleGenerateOfficialPDF}
              disabled={!selectedSyllabus || isGeneratingPDF}
              className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              <FileText size={18} />
              {isGeneratingPDF
                ? "Generando PDF..."
                : "CA2: Generar PDF Oficial"}
            </button>
          </div>
        </section>

        {/* Advertencia cuando el sílabo tiene información incompleta. */}
        {warningMessage && (
          <section className="mt-5 flex gap-3 rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-yellow-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Advertencia de información</p>
              <p className="text-sm">{warningMessage}</p>
            </div>
          </section>
        )}

        {/* Sección que aparece cuando el PDF fue generado correctamente. */}
        {isPdfGenerated && generatedPdfData && (
          <section className="mt-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">
                CA3: PDF Generado Correctamente
              </h2>
            </div>

            {/* Verificación visual de las secciones del sílabo. */}
            <div
              className={`rounded-lg border p-4 ${
                warningMessage
                  ? "border-yellow-300 bg-yellow-50"
                  : "border-green-200 bg-green-50"
              }`}
            >
              <p
                className={`mb-2 flex items-center gap-2 text-sm font-semibold ${
                  warningMessage ? "text-yellow-800" : "text-green-800"
                }`}
              >
                {warningMessage ? (
                  <AlertTriangle size={16} />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                El PDF oficial fue generado. Verificación de secciones:
              </p>

              <div className="grid grid-cols-1 gap-1 text-sm md:grid-cols-2">
                <SectionCheck
                  ok={Boolean(generatedPdfData.datosGenerales)}
                  label="I. Datos Generales"
                />

                <SectionCheck
                  ok={Boolean(generatedPdfData.sumilla)}
                  label="II. Sumilla"
                />

                <SectionCheck
                  ok={Boolean(generatedPdfData.competenciasCurso?.length)}
                  label="III. Competencias"
                />

                <SectionCheck
                  ok={Boolean(generatedPdfData.unidadesDidacticas?.length)}
                  label="IV. Programación de Contenidos"
                />

                <SectionCheck
                  ok={Boolean(generatedPdfData.estrategiasMetodologicas?.length)}
                  label="V. Estrategias Metodológicas"
                />

                <SectionCheck
                  ok={Boolean(generatedPdfData.recursosDidacticos)}
                  label="VI. Recursos Didácticos"
                />

                <SectionCheck
                  ok={Boolean(generatedPdfData.evaluacionAprendizaje)}
                  label="VII. Sistema de Evaluación"
                />

                <SectionCheck
                  ok={Boolean(generatedPdfData.fuentes?.length)}
                  label="VIII. Fuentes de Información"
                />

                <SectionCheck
                  ok={Boolean(generatedPdfData.aportesResultadosPrograma?.length)}
                  label="IX. Aportes y Contribuciones"
                />
              </div>
            </div>

            {/* Botones para previsualizar o descargar el PDF. */}
            <div className="mt-6 flex justify-center gap-4">
              <button
                type="button"
                onClick={handlePreviewPDF}
                disabled={isPreviewingPDF}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                <Printer size={18} />
                {isPreviewingPDF ? "Abriendo..." : "Vista Previa"}
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isDownloadingPDF}
                className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                <Download size={18} />
                {isDownloadingPDF ? "Descargando..." : "Descargar PDF"}
              </button>
            </div>
          </section>
        )}

        {/* Botón para volver a la pantalla anterior y texto de regla de negocio. */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            <ArrowLeft size={16} />
            Volver
          </button>

          <p className="text-xs text-gray-500">
            RN6: El estado del sílabo permanece como APROBADO.
          </p>
        </div>
      </div>
    </div>
  );
}