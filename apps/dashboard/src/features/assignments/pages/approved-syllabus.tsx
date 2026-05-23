import { useState, useEffect, useRef } from "react";
import {
  Search,
  Download,
  X,
  Printer,
  FileCheck2,
  Calendar,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  FileText,
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

function SectionCheck({ ok, label }: { ok: boolean; label: string }) {
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

  const [approvalDate, setApprovalDate] = useState<string>("");
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
    const today = new Date().toISOString().split("T")[0];
    setApprovalDate(today);
  }, []);

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
    });

    setSelectedSyllabus(selectedFromTracking);
    setSearchText(
      `${selectedFromTracking.codigo} - ${selectedFromTracking.asignatura}`,
    );
    setShowDropdown(false);
  }, [syllabusIdParam, courseCodeParam, courseNameParam, statusParam, toast]);

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
      toast.info(
        "Generando PDF oficial",
        "Validando información del sílabo...",
      );

      const data = await loadCompleteSyllabus();

      setGeneratedPdfData(data);
      setIsPdfGenerated(true);

      toast.success(
        "PDF generado correctamente",
        "Ahora puedes visualizar o descargar el documento.",
      );
    } catch {
      toast.error(
        "Error",
        "Error al generar el PDF oficial. Por favor intenta nuevamente.",
      );
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const ensureGeneratedPdfData = async () => {
    if (generatedPdfData) return generatedPdfData;

    const data = await loadCompleteSyllabus();
    setGeneratedPdfData(data);
    setIsPdfGenerated(true);

    return data;
  };

  const handlePreviewPDF = async () => {
    if (!validateApprovedSyllabus()) return;

    setIsPreviewingPDF(true);

    try {
      toast.info("Generando impresión previa", "Abriendo PDF...");

      const data = await ensureGeneratedPdfData();

      const blob = await pdf(<SyllabusPDFDocument data={data} />).toBlob();
      const url = URL.createObjectURL(blob);

      window.open(url, "_blank");

      toast.success("Éxito", "Vista previa abierta en nueva pestaña");
    } catch {
      toast.error(
        "Error",
        "Error al generar la vista previa. Por favor intenta nuevamente.",
      );
    } finally {
      setIsPreviewingPDF(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!validateApprovedSyllabus()) return;

    setIsDownloadingPDF(true);

    try {
      toast.info("Generando PDF", "Descargando sílabo oficial...");

      const data = await ensureGeneratedPdfData();

      const blob = await pdf(<SyllabusPDFDocument data={data} />).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = buildFileName(selectedSyllabus);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      toast.success("Éxito", "PDF oficial descargado correctamente");
    } catch {
      toast.error(
        "Error",
        "Error al generar el PDF. Por favor intenta nuevamente.",
      );
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  if (isLoading && !syllabusIdParam) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-md px-8 py-6 text-gray-600 flex items-center gap-3">
          <Loader2 className="animate-spin text-red-600" size={22} />
          Cargando sílabos aprobados...
        </div>
      </div>
    );
  }

  if (isError && !syllabusIdParam) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-red-100 rounded-2xl shadow-md px-8 py-6 text-red-600">
          Error al cargar sílabos: {error?.message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-8 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Sílabos Aprobados
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Busca, revisa, genera y descarga sílabos aprobados en formato PDF
            oficial.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-red-50 to-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md">
                <FileCheck2 size={28} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Consulta de Sílabos
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Selecciona un sílabo aprobado para generar su PDF oficial.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Buscar sílabo por código o asignatura
              </label>

              <div className="relative" ref={dropdownRef}>
                <div className="flex items-center gap-3 h-13 border border-gray-200 rounded-xl px-4 bg-white shadow-sm focus-within:ring-2 focus-within:ring-red-500 focus-within:border-transparent">
                  <Search className="text-gray-400" size={20} />

                  <input
                    type="text"
                    value={searchText}
                    disabled={Boolean(syllabusIdParam)}
                    onChange={(e) => {
                      setSearchText(e.target.value);
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
                    className="flex-1 h-12 outline-none text-sm text-gray-700 placeholder:text-gray-400 disabled:text-gray-700"
                  />

                  {searchText && !syllabusIdParam && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="text-gray-500" size={18} />
                    </button>
                  )}
                </div>

                {showDropdown && searchText && filteredSyllabi.length > 0 && (
                  <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                    {filteredSyllabi.slice(0, 15).map((syllabus) => (
                      <button
                        type="button"
                        key={syllabus.id}
                        onClick={() => handleSyllabusSelect(syllabus)}
                        className="w-full px-4 py-4 text-left hover:bg-red-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-bold text-gray-900">
                              {syllabus.codigo}
                            </div>

                            <div className="text-sm text-gray-600 mt-1">
                              {syllabus.asignatura}
                            </div>
                          </div>

                          {syllabus.ciclo && (
                            <span className="shrink-0 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-full px-3 py-1">
                              Ciclo {syllabus.ciclo}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {showDropdown && searchText && filteredSyllabi.length === 0 && (
                  <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl p-5">
                    <p className="text-gray-500 text-center text-sm">
                      No se encontraron sílabos aprobados con ese criterio.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {selectedSyllabus && (
              <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3">
                      Sílabo seleccionado
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <p className="text-gray-600">
                        <span className="font-semibold text-gray-900">
                          Código:
                        </span>{" "}
                        {selectedSyllabus.codigo}
                      </p>

                      <p className="text-gray-600">
                        <span className="font-semibold text-gray-900">
                          Asignatura:
                        </span>{" "}
                        {selectedSyllabus.asignatura}
                      </p>

                      <p className="text-gray-600">
                        <span className="font-semibold text-gray-900">
                          Periodo:
                        </span>{" "}
                        {generatedPdfData?.datosGenerales?.semestreAcademico ||
                          "No informado"}
                      </p>

                      <p className="text-gray-600">
                        <span className="font-semibold text-gray-900">
                          Docente:
                        </span>{" "}
                        {teacherNameParam ||
                          generatedPdfData?.datosGenerales?.docentes ||
                          "No asignado"}
                      </p>

                      {selectedSyllabus.ciclo && (
                        <p className="text-gray-600">
                          <span className="font-semibold text-gray-900">
                            Ciclo:
                          </span>{" "}
                          {selectedSyllabus.ciclo}
                        </p>
                      )}

                      {selectedSyllabus.escuela && (
                        <p className="text-gray-600">
                          <span className="font-semibold text-gray-900">
                            Escuela:
                          </span>{" "}
                          {selectedSyllabus.escuela}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-green-700 bg-white border border-green-200">
                    Aprobado
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Fecha de aprobación
              </label>

              <div className="relative">
                <Calendar
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />

                <input
                  type="date"
                  value={approvalDate}
                  onChange={(e) => setApprovalDate(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 border border-gray-200 rounded-xl text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {warningMessage && (
              <div className="flex gap-3 rounded-2xl border border-yellow-300 bg-yellow-50 p-4 text-yellow-800">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

                <div>
                  <p className="font-semibold">Advertencia de información</p>
                  <p className="text-sm">{warningMessage}</p>
                </div>
              </div>
            )}

            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleGenerateOfficialPDF}
                disabled={!selectedSyllabus || isGeneratingPDF}
                className="h-12 px-8 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-sm"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    {isPdfGenerated
                      ? "Regenerar PDF Oficial"
                      : "Generar PDF Oficial"}
                  </>
                )}
              </button>
            </div>

            {!selectedSyllabus && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileCheck2 className="text-gray-400" size={30} />
                </div>

                <p className="text-sm text-gray-500">
                  Busca y selecciona un sílabo aprobado para poder generar su
                  PDF oficial.
                </p>
              </div>
            )}
          </div>
        </div>

        {isPdfGenerated && generatedPdfData && (
          <section className="mt-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">
                PDF generado correctamente
              </h2>
            </div>

            <div
              className={`rounded-2xl border p-5 ${
                warningMessage
                  ? "border-yellow-300 bg-yellow-50"
                  : "border-green-200 bg-green-50"
              }`}
            >
              <p
                className={`mb-4 flex items-center gap-2 text-sm font-semibold ${
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

              <div className="grid grid-cols-1 gap-x-10 gap-y-1 text-sm md:grid-cols-2">
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
                  ok={Boolean(
                    generatedPdfData.estrategiasMetodologicas?.length,
                  )}
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
                  ok={Boolean(
                    generatedPdfData.aportesResultadosPrograma?.length,
                  )}
                  label="IX. Aportes y Contribuciones"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isDownloadingPDF}
                className="h-11 min-w-[190px] px-6 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-sm"
              >
                {isDownloadingPDF ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Descargando...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Descargar PDF
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePreviewPDF}
                disabled={isPreviewingPDF}
                className="h-11 min-w-[160px] px-6 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-sm"
              >
                {isPreviewingPDF ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <Printer className="w-5 h-5" />
                    Imprimir
                  </>
                )}
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
