// syllabus-generate-pdf-backend.tsx
// Archivo encargado de cargar la información completa de un sílabo desde el backend
// y generar un PDF oficial descargable usando React PDF.
// También valida si el sílabo tiene secciones incompletas antes de descargar.

// =====================================================
// IMPORTS
// =====================================================

// Importa hooks de React.
// useState permite manejar estados internos.
// useEffect permite ejecutar acciones al cargar el componente.
// useCallback memoriza funciones para evitar recrearlas innecesariamente.
import { useState, useEffect, useCallback } from "react";

// Importa pdf desde React PDF.
// Sirve para convertir un componente PDF en un archivo Blob descargable.
import { pdf } from "@react-pdf/renderer";

// Importa íconos desde lucide-react.
// AlertTriangle muestra advertencias o errores.
// CheckCircle2 indica información correcta o validada.
// Download se usa en el botón de descarga.
// RefreshCcw se usa en el botón para recargar información.
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCcw,
} from "lucide-react";

// Importa el componente que representa el documento PDF del sílabo.
// Este componente recibe la información completa del sílabo y arma el PDF.
import { SyllabusPDFDocument } from "./SyllabusPDFDocument";

// Importa el servicio encargado de obtener la información completa del sílabo.
// Este servicio consulta el backend usando el syllabusId.
import { syllabusPDFService } from "../services/syllabus-pdf-service";

// Importa el tipo CompleteSyllabus.
// Sirve para tipar la información completa que se usará para generar el PDF.
import type { CompleteSyllabus } from "../types/complete-syllabus";

// =====================================================
// PROPS DEL COMPONENTE
// =====================================================

// Define las propiedades que recibe SyllabusGeneratePDFBackend.
interface SyllabusGeneratePDFBackendProps {
  // Id del sílabo que se consultará en el backend.
  // Es opcional porque el componente tiene un valor por defecto.
  syllabusId?: number;

  // Nombre del archivo PDF que se descargará.
  // Es opcional porque también tiene un valor por defecto.
  fileName?: string;
}

// =====================================================
// FUNCIÓN PARA VALIDAR SECCIONES FALTANTES
// =====================================================

// Revisa qué secciones importantes faltan en el sílabo.
// Devuelve una lista con los nombres de las secciones incompletas.
// Esta validación sirve para mostrar una advertencia antes de descargar el PDF.
function getMissingSections(data: CompleteSyllabus) {
  // Arreglo donde se guardan las secciones que faltan.
  const missing: string[] = [];

  // Valida si existen los datos generales.
  if (!data.datosGenerales) {
    missing.push("Datos generales");
  }

  // Valida si existe el nombre de la asignatura.
  if (!data.datosGenerales?.nombreAsignatura) {
    missing.push("Nombre de asignatura");
  }

  // Valida si existe el código de la asignatura.
  if (!data.datosGenerales?.codigoAsignatura) {
    missing.push("Código de asignatura");
  }

  // Valida si existe la sumilla.
  if (!data.sumilla) {
    missing.push("Sumilla");
  }

  // Valida si existen competencias del curso.
  if (!data.competenciasCurso || data.competenciasCurso.length === 0) {
    missing.push("Competencias");
  }

  // Valida si existen unidades didácticas o programación de contenidos.
  if (!data.unidadesDidacticas || data.unidadesDidacticas.length === 0) {
    missing.push("Programación de contenidos");
  }

  // Valida si existe información de evaluación del aprendizaje.
  if (!data.evaluacionAprendizaje) {
    missing.push("Evaluación del aprendizaje");
  }

  // Valida si existen fuentes de consulta.
  if (!data.fuentes || data.fuentes.length === 0) {
    missing.push("Fuentes de consulta");
  }

  // Devuelve la lista final de secciones faltantes.
  return missing;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

// Componente encargado de cargar la información del sílabo,
// mostrar un resumen y permitir descargar el PDF oficial.
export function SyllabusGeneratePDFBackend({
  // Id del sílabo a consultar.
  // Si no se recibe, se usa 1 como valor por defecto.
  syllabusId = 1,

  // Nombre del archivo PDF.
  // Si no se recibe, se usa "silabo-oficial.pdf".
  fileName = "silabo-oficial.pdf",
}: SyllabusGeneratePDFBackendProps) {
  // =====================================================
  // ESTADOS DEL COMPONENTE
  // =====================================================

  // Guarda la información completa del sílabo obtenida desde el backend.
  const [syllabusData, setSyllabusData] = useState<CompleteSyllabus | null>(
    null,
  );

  // Indica si se está cargando la información del sílabo.
  const [isLoading, setIsLoading] = useState(false);

  // Guarda el mensaje de error si falla la carga del sílabo.
  const [error, setError] = useState<string | null>(null);

  // Indica si se está generando el PDF para descarga.
  const [isGenerating, setIsGenerating] = useState(false);

  // =====================================================
  // CARGAR INFORMACIÓN DEL SÍLABO
  // =====================================================

  // Función que consulta la información completa del sílabo desde el backend.
  // useCallback evita que la función se recree en cada render,
  // excepto cuando cambia syllabusId.
  const loadSyllabusData = useCallback(async () => {
    // Activa el estado de carga.
    setIsLoading(true);

    // Limpia errores anteriores.
    setError(null);

    try {
      // Consulta la información completa del sílabo usando el servicio.
      const data = await syllabusPDFService.fetchCompleteSyllabus(syllabusId);

      // Guarda los datos obtenidos en el estado.
      setSyllabusData(data);
    } catch (err) {
      // Si ocurre un error, obtiene un mensaje legible.
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Error al cargar la información del sílabo";

      // Guarda el mensaje de error para mostrarlo en pantalla.
      setError(errorMsg);
    } finally {
      // Desactiva el estado de carga.
      setIsLoading(false);
    }
  }, [syllabusId]);

  // =====================================================
  // EFECTO DE CARGA INICIAL
  // =====================================================

  // Carga la información del sílabo cuando el componente se monta
  // o cuando cambia la función loadSyllabusData.
  useEffect(() => {
    loadSyllabusData();
  }, [loadSyllabusData]);

  // =====================================================
  // DESCARGAR PDF
  // =====================================================

  // Genera y descarga directamente el PDF oficial del sílabo.
  const handleDownloadDirect = async () => {
    // Si no hay datos del sílabo, no se puede generar el PDF.
    if (!syllabusData) {
      alert("No hay información disponible para generar el PDF.");
      return;
    }

    // Activa el estado de generación del PDF.
    setIsGenerating(true);

    try {
      // Convierte el componente SyllabusPDFDocument en un Blob PDF.
      const blob = await pdf(
        <SyllabusPDFDocument data={syllabusData} />,
      ).toBlob();

      // Crea una URL temporal para el Blob generado.
      const url = URL.createObjectURL(blob);

      // Crea un enlace temporal para ejecutar la descarga.
      const link = document.createElement("a");

      // Asigna la URL del PDF al enlace.
      link.href = url;

      // Asigna el nombre del archivo que se descargará.
      link.download = fileName;

      // Ejecuta el clic del enlace para iniciar la descarga.
      link.click();

      // Libera la URL temporal para evitar consumo innecesario de memoria.
      URL.revokeObjectURL(url);
    } catch (err) {
      // Muestra el error en consola para depuración.
      console.error("Error al generar PDF:", err);

      // Muestra una alerta al usuario con el error.
      alert(
        "Error al generar PDF: " + (err instanceof Error ? err.message : ""),
      );
    } finally {
      // Desactiva el estado de generación del PDF.
      setIsGenerating(false);
    }
  };

  // =====================================================
  // ESTADO DE CARGA
  // =====================================================

  // Si se está cargando o todavía no existen datos, muestra un loader.
  if (isLoading || !syllabusData) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-red-600"></div>
          <p className="font-medium text-gray-700">
            Cargando información del sílabo aprobado...
          </p>
          <p className="mt-1 text-sm text-gray-500">Sílabo ID: {syllabusId}</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ESTADO DE ERROR
  // =====================================================

  // Si ocurrió un error al cargar la información, muestra un mensaje
  // y permite reintentar la consulta.
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-6 w-6 text-red-600" />

          <div>
            <h3 className="text-lg font-semibold text-red-800">
              Error al cargar información
            </h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>

            <button
              type="button"
              onClick={loadSyllabusData}
              className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // VALIDACIÓN DE DATOS DISPONIBLES
  // =====================================================

  // Si no existen datos generales, no se puede mostrar el resumen ni generar PDF correctamente.
  if (!syllabusData || !syllabusData.datosGenerales) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
        No hay datos disponibles para generar el PDF oficial.
      </div>
    );
  }

  // Obtiene las secciones faltantes del sílabo.
  const missingSections = getMissingSections(syllabusData);

  // Indica si existen secciones incompletas.
  const hasMissingSections = missingSections.length > 0;

  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================

  return (
    <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow-sm">
      {/* Encabezado principal del módulo. */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          PDF oficial del sílabo aprobado
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Información consolidada obtenida desde el backend para la generación
          del documento oficial.
        </p>
      </div>

      {/* Tarjeta con información resumida del sílabo. */}
      <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-5">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-red-800">
          <CheckCircle2 className="h-5 w-5" />
          Información del sílabo
        </h3>

        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          {/* Nombre de la asignatura. */}
          <div>
            <span className="font-semibold text-gray-700">Asignatura:</span>
            <p className="text-gray-900">
              {syllabusData.datosGenerales.nombreAsignatura || "N/A"}
            </p>
          </div>

          {/* Código de la asignatura. */}
          <div>
            <span className="font-semibold text-gray-700">Código:</span>
            <p className="text-gray-900">
              {syllabusData.datosGenerales.codigoAsignatura || "N/A"}
            </p>
          </div>

          {/* Semestre académico. */}
          <div>
            <span className="font-semibold text-gray-700">Semestre:</span>
            <p className="text-gray-900">
              {syllabusData.datosGenerales.semestreAcademico || "N/A"}
            </p>
          </div>

          {/* Docente o docentes asignados. */}
          <div>
            <span className="font-semibold text-gray-700">Docente:</span>
            <p className="text-gray-900">
              {syllabusData.datosGenerales.docentes || "N/A"}
            </p>
          </div>

          {/* Créditos del curso. */}
          <div>
            <span className="font-semibold text-gray-700">Créditos:</span>
            <p className="text-gray-900">
              Teoría: {syllabusData.datosGenerales.creditosTeoria || 0} |
              Práctica: {syllabusData.datosGenerales.creditosPractica || 0} |
              Total: {syllabusData.datosGenerales.creditosTotales || 0}
            </p>
          </div>

          {/* Cantidad de unidades didácticas. */}
          <div>
            <span className="font-semibold text-gray-700">
              Unidades didácticas:
            </span>
            <p className="text-gray-900">
              {syllabusData.unidadesDidacticas?.length || 0} unidades
            </p>
          </div>

          {/* Cantidad de competencias. */}
          <div>
            <span className="font-semibold text-gray-700">Competencias:</span>
            <p className="text-gray-900">
              {syllabusData.competenciasCurso?.length || 0} competencias
            </p>
          </div>

          {/* Cantidad de fuentes de consulta. */}
          <div>
            <span className="font-semibold text-gray-700">
              Fuentes de consulta:
            </span>
            <p className="text-gray-900">
              {syllabusData.fuentes?.length || 0} fuentes
            </p>
          </div>
        </div>
      </div>

      {/* Advertencia si el sílabo tiene secciones incompletas. */}
      {hasMissingSections && (
        <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-700" />

            <div>
              <p className="font-semibold text-yellow-800">
                Advertencia de información incompleta
              </p>
              <p className="mt-1 text-sm text-yellow-700">
                El sílabo aprobado tiene secciones incompletas:{" "}
                {missingSections.join(", ")}. Puede verificarse antes de usar el
                documento como versión oficial.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción para descargar o recargar la información. */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          onClick={handleDownloadDirect}
          disabled={isGenerating}
          className={`flex-1 rounded-lg px-6 py-3 font-semibold text-white transition-all ${
            isGenerating
              ? "cursor-not-allowed bg-gray-400"
              : "bg-red-600 hover:bg-red-700 hover:shadow-lg"
          }`}
        >
          {isGenerating ? (
            // Estado visual mientras se está generando el PDF.
            <span className="flex items-center justify-center">
              <span className="mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></span>
              Generando PDF oficial...
            </span>
          ) : (
            // Estado normal del botón de descarga.
            <span className="flex items-center justify-center gap-2">
              <Download className="h-5 w-5" />
              Descargar PDF oficial
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={loadSyllabusData}
          className="rounded-lg bg-gray-200 px-6 py-3 font-semibold text-gray-800 transition hover:bg-gray-300"
        >
          <span className="flex items-center justify-center gap-2">
            <RefreshCcw className="h-5 w-5" />
            Recargar información
          </span>
        </button>
      </div>

      {/* Nota final indicando que generar el PDF no modifica datos del sílabo. */}
      <div className="mt-6 border-t border-gray-200 pt-4">
        <p className="text-xs text-gray-500">
          La generación del PDF utiliza únicamente información consultada desde
          el backend y no modifica el estado académico del sílabo.
        </p>
      </div>
    </div>
  );
}