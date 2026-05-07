import { useState, useEffect, useRef } from "react";
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
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useApprovedSyllabi,
  type ApprovedSyllabus as ApprovedSyllabusType,
} from "../hooks/use-approved-syllabus";
import { pdf } from "@react-pdf/renderer";
import { syllabusPDFService } from "../../syllabus/services/syllabus-pdf-service";
import { SyllabusPDFDocument } from "../../syllabus/components/SyllabusPDFDocument";
import type { CompleteSyllabus } from "../../syllabus/types/complete-syllabus";
import { useToast } from "../../../common/hooks/use-toast";

function normalizeStatus(status?: string) {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace("EN_REVISION", "EN_REVISIÓN");
}

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

function getMissingSections(data: CompleteSyllabus) {
  const missing: string[] = [];

  if (!data.datosGenerales) {
    missing.push("Datos generales");
  }

  if (!data.datosGenerales?.nombreAsignatura) {
    missing.push("Nombre de asignatura");
  }

  if (!data.datosGenerales?.codigoAsignatura) {
    missing.push("Código de asignatura");
  }

  if (!data.sumilla) {
    missing.push("Sumilla");
  }

  if (!data.competenciasCurso || data.competenciasCurso.length === 0) {
    missing.push("Competencias");
  }

  if (!data.unidadesDidacticas || data.unidadesDidacticas.length === 0) {
    missing.push("Programación de contenidos");
  }

  if (
    !data.estrategiasMetodologicas ||
    data.estrategiasMetodologicas.length === 0
  ) {
    missing.push("Estrategias metodológicas");
  }

  if (!data.recursosDidacticos) {
    missing.push("Recursos didácticos");
  }

  if (!data.evaluacionAprendizaje) {
    missing.push("Evaluación del aprendizaje");
  }

  if (!data.fuentes || data.fuentes.length === 0) {
    missing.push("Fuentes de consulta");
  }

  if (
    !data.aportesResultadosPrograma ||
    data.aportesResultadosPrograma.length === 0
  ) {
    missing.push("Aportes y contribuciones");
  }

  return missing;
}

function buildFileName(syllabus?: ApprovedSyllabusType | null) {
  if (!syllabus) return "silabo-oficial-aprobado.pdf";

  const cleanCode = String(syllabus.codigo || "aprobado")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `silabo-oficial-${cleanCode}.pdf`;
}

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

export default function ApprovedSyllabus() {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const syllabusIdParam = searchParams.get("syllabusId");
  const courseNameParam = searchParams.get("courseName") || "";
  const courseCodeParam = searchParams.get("courseCode") || "";
  const teacherNameParam = searchParams.get("teacherName") || "";
  const statusParam = searchParams.get("status") || "";

  const [searchText, setSearchText] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedSyllabus, setSelectedSyllabus] =
    useState<ApprovedSyllabusType | null>(null);

  const [warningMessage, setWarningMessage] = useState("");

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isPreviewingPDF, setIsPreviewingPDF] = useState(false);

  const [generatedPdfData, setGeneratedPdfData] =
    useState<CompleteSyllabus | null>(null);
  const [isPdfGenerated, setIsPdfGenerated] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    data: syllabi = [],
    isLoading,
    isError,
    error,
  } = useApprovedSyllabi();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!syllabusIdParam) return;

    const syllabusId = Number(syllabusIdParam);

    if (!syllabusId || Number.isNaN(syllabusId)) return;

    const status = normalizeStatus(statusParam || "APROBADO");

    if (status !== "APROBADO") {
      toast.error(
        "No permitido",
        "Solo se puede generar PDF oficial de sílabos aprobados.",
      );
      return;
    }

    const selectedFromTracking = buildSelectedFromTracking({
      syllabusId,
      courseCodeParam,
      courseNameParam,
      teacherNameParam,
    });

    setSelectedSyllabus(selectedFromTracking);
    setSearchText(
      `${selectedFromTracking.codigo} - ${selectedFromTracking.asignatura}`,
    );
    setShowDropdown(false);
  }, [
    syllabusIdParam,
    courseCodeParam,
    courseNameParam,
    teacherNameParam,
    statusParam,
    toast,
  ]);

  const approvedSyllabi = syllabi.filter((syllabus) => {
    return normalizeStatus(syllabus.estadoRevision) === "APROBADO";
  });

  const filteredSyllabi = approvedSyllabi.filter((syllabus) => {
    const searchLower = searchText.toLowerCase();
    const matchesCodigo = syllabus.codigo?.toLowerCase().includes(searchLower);
    const matchesAsignatura = syllabus.asignatura
      ?.toLowerCase()
      .includes(searchLower);

    return matchesCodigo || matchesAsignatura;
  });

  const validateApprovedSyllabus = () => {
    if (!selectedSyllabus) {
      toast.error("Error", "Por favor selecciona un sílabo aprobado primero.");
      return false;
    }

    const status = normalizeStatus(selectedSyllabus.estadoRevision);

    if (status !== "APROBADO") {
      toast.error(
        "No permitido",
        "Solo se puede generar PDF oficial de sílabos aprobados.",
      );
      return false;
    }

    return true;
  };

  const loadCompleteSyllabus = async () => {
    if (!selectedSyllabus) {
      throw new Error("No hay sílabo seleccionado");
    }

    const data: CompleteSyllabus =
      await syllabusPDFService.fetchCompleteSyllabus(selectedSyllabus.id);

    const missingSections = getMissingSections(data);

    if (missingSections.length > 0) {
      const message = `El sílabo tiene información incompleta: ${missingSections.join(
        ", ",
      )}.`;

      setWarningMessage(message);
      toast.warning("Advertencia", message);
    } else {
      setWarningMessage("");
    }

    return data;
  };

  const handleSyllabusSelect = (syllabus: ApprovedSyllabusType) => {
    if (normalizeStatus(syllabus.estadoRevision) !== "APROBADO") {
      toast.error(
        "No permitido",
        "Solo se puede seleccionar sílabos aprobados para generar PDF oficial.",
      );
      return;
    }

    setSelectedSyllabus(syllabus);
    setSearchText(`${syllabus.codigo} - ${syllabus.asignatura}`);
    setShowDropdown(false);
    setWarningMessage("");
    setGeneratedPdfData(null);
    setIsPdfGenerated(false);
  };

  const handleClear = () => {
    setSelectedSyllabus(null);
    setSearchText("");
    setShowDropdown(false);
    setWarningMessage("");
    setGeneratedPdfData(null);
    setIsPdfGenerated(false);
  };

  const handleGenerateOfficialPDF = async () => {
    if (!validateApprovedSyllabus()) return;

    setIsGeneratingPDF(true);

    try {
      toast.info("Generando PDF oficial", "Validando información del sílabo...");

      const data = await loadCompleteSyllabus();

      setGeneratedPdfData(data);
      setIsPdfGenerated(true);

      toast.success(
        "PDF generado correctamente",
        "Ahora puedes visualizar o descargar el documento.",
      );
    } catch (err) {
      console.error("Error al generar PDF oficial:", err);
      toast.error(
        "Error",
        "Error al generar el PDF oficial. Por favor intenta nuevamente.",
      );
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePreviewPDF = async () => {
    if (!generatedPdfData) {
      toast.error(
        "PDF no generado",
        "Primero presiona el botón Generar PDF Oficial.",
      );
      return;
    }

    setIsPreviewingPDF(true);

    try {
      const blob = await pdf(
        <SyllabusPDFDocument data={generatedPdfData} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);

      window.open(url, "_blank");

      toast.success("Éxito", "Vista previa abierta en nueva pestaña");
    } catch (err) {
      console.error("Error al previsualizar PDF:", err);
      toast.error(
        "Error",
        "Error al generar la vista previa. Por favor intenta nuevamente.",
      );
    } finally {
      setIsPreviewingPDF(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!generatedPdfData) {
      toast.error(
        "PDF no generado",
        "Primero presiona el botón Generar PDF Oficial.",
      );
      return;
    }

    setIsDownloadingPDF(true);

    try {
      const blob = await pdf(
        <SyllabusPDFDocument data={generatedPdfData} />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = buildFileName(selectedSyllabus);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      toast.success("Éxito", "PDF oficial descargado correctamente");
    } catch (err) {
      console.error("Error al descargar PDF:", err);
      toast.error(
        "Error",
        "Error al descargar el PDF. Por favor intenta nuevamente.",
      );
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  if (isLoading && !syllabusIdParam) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-600">Cargando sílabos aprobados...</div>
      </div>
    );
  }

  if (isError && !syllabusIdParam) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-600">
          Error al cargar sílabos: {error?.message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f8] px-6 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <FileText className="h-5 w-5 text-red-700" />
            <h1 className="text-xl font-bold text-gray-900">
              CA1: Seleccionar Sílabo Aprobado
            </h1>
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Sílabo aprobado *
            </label>

            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3">
                <input
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

                {searchText && !syllabusIdParam && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-full p-1 transition hover:bg-gray-100"
                  >
                    <X className="text-gray-500" size={18} />
                  </button>
                )}
              </div>

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

              {showDropdown && searchText && filteredSyllabi.length === 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-300 bg-white p-4 shadow-lg">
                  <p className="text-center text-gray-500">
                    No se encontraron sílabos aprobados con ese criterio.
                  </p>
                </div>
              )}
            </div>
          </div>

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

        {warningMessage && (
          <section className="mt-5 flex gap-3 rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-yellow-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Advertencia de información</p>
              <p className="text-sm">{warningMessage}</p>
            </div>
          </section>
        )}

        {isPdfGenerated && generatedPdfData && (
          <section className="mt-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">
                CA3: PDF Generado Correctamente
              </h2>
            </div>

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