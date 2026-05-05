import { useState, useEffect, useRef } from "react";
import { Search, Download, X, Printer } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  useApprovedSyllabi,
  type ApprovedSyllabus as ApprovedSyllabusType,
} from "../hooks/use-approved-syllabus";
import { pdf } from "@react-pdf/renderer";
import { syllabusPDFService } from "../../syllabus/services/syllabus-pdf-service";
import { SyllabusPDFDocument } from "../../syllabus/components/SyllabusPDFDocument";
import type { CompleteSyllabus } from "../../syllabus/types/complete-syllabus";
import { useToast } from "../../../common/hooks/use-toast";

export default function ApprovedSyllabus() {
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const syllabusIdParam = searchParams.get("syllabusId");
  const courseNameParam = searchParams.get("courseName") || "";
  const courseCodeParam = searchParams.get("courseCode") || "";
  const teacherNameParam = searchParams.get("teacherName") || "";

  const [searchText, setSearchText] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedSyllabus, setSelectedSyllabus] =
    useState<ApprovedSyllabusType | null>(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isPreviewingPDF, setIsPreviewingPDF] = useState(false);
  const [approvalDate, setApprovalDate] = useState<string>("");

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

    const selectedFromTracking: ApprovedSyllabusType = {
      id: syllabusId,
      codigo: courseCodeParam || `SIL-${syllabusId}`,
      asignatura: courseNameParam || "Sílabo aprobado",
      ciclo: "",
      escuela: "",
      estadoRevision: "APROBADO",
    };

    setSelectedSyllabus(selectedFromTracking);
    setSearchText(
      `${selectedFromTracking.codigo} - ${selectedFromTracking.asignatura}`,
    );
    setShowDropdown(false);
  }, [syllabusIdParam, courseCodeParam, courseNameParam, teacherNameParam]);

  const filteredSyllabi = syllabi.filter((syllabus) => {
    const searchLower = searchText.toLowerCase();
    const matchesCodigo = syllabus.codigo?.toLowerCase().includes(searchLower);
    const matchesAsignatura = syllabus.asignatura
      ?.toLowerCase()
      .includes(searchLower);

    return matchesCodigo || matchesAsignatura;
  });

  const handleSyllabusSelect = (syllabus: ApprovedSyllabusType) => {
    setSelectedSyllabus(syllabus);
    setSearchText(`${syllabus.codigo} - ${syllabus.asignatura}`);
    setShowDropdown(false);
  };

  const handleClear = () => {
    setSelectedSyllabus(null);
    setSearchText("");
    setShowDropdown(false);
  };

  const handlePreviewPDF = async () => {
    if (!selectedSyllabus) {
      toast.error("Error", "Por favor selecciona un sílabo primero");
      return;
    }

    setIsPreviewingPDF(true);

    try {
      toast.info("Generando impresión previa", "Abriendo PDF...");

      const data: CompleteSyllabus =
        await syllabusPDFService.fetchCompleteSyllabus(selectedSyllabus.id);

      const blob = await pdf(<SyllabusPDFDocument data={data} />).toBlob();
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
    if (!selectedSyllabus) {
      toast.error("Error", "Por favor selecciona un sílabo primero");
      return;
    }

    setIsDownloadingPDF(true);

    try {
      toast.info("Generando PDF", "Descargando sílabo...");

      const data: CompleteSyllabus =
        await syllabusPDFService.fetchCompleteSyllabus(selectedSyllabus.id);

      const blob = await pdf(<SyllabusPDFDocument data={data} />).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `silabo-${selectedSyllabus.codigo}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      toast.success("Éxito", "PDF descargado correctamente");
    } catch (err) {
      console.error("Error al descargar PDF:", err);
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
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando sílabos aprobados...</div>
      </div>
    );
  }

  if (isError && !syllabusIdParam) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">
          Error al cargar sílabos: {error?.message}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-red-600 p-8">
        <div className="mb-6 border-b-2 border-red-600 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Sílabo Aprobados
          </h1>
        </div>

        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-800 mb-2">
            1. Buscar Sílabo por Código o Asignatura
          </label>

          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-3 bg-white">
              <input
                type="text"
                value={searchText}
                disabled={Boolean(syllabusIdParam)}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setSelectedSyllabus(null);
                  setShowDropdown(true);
                }}
                onFocus={() => {
                  if (!syllabusIdParam) {
                    setShowDropdown(true);
                  }
                }}
                placeholder="Buscar por código o nombre de asignatura..."
                className="flex-1 outline-none text-gray-700 disabled:bg-white disabled:text-gray-700"
              />

              <Search className="text-gray-400" size={20} />

              {searchText && !syllabusIdParam && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="text-gray-500" size={20} />
                </button>
              )}
            </div>

            {showDropdown && searchText && filteredSyllabi.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                {filteredSyllabi.slice(0, 15).map((syllabus) => (
                  <button
                    key={syllabus.id}
                    type="button"
                    onClick={() => handleSyllabusSelect(syllabus)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">
                      {syllabus.codigo}
                    </div>
                    <div className="text-sm text-gray-600">
                      {syllabus.asignatura}
                    </div>
                    {syllabus.ciclo && (
                      <div className="text-xs text-gray-500 mt-1">
                        Ciclo: {syllabus.ciclo}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {showDropdown && searchText && filteredSyllabi.length === 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                <p className="text-gray-500 text-center">
                  No se encontraron sílabos con ese criterio
                </p>
              </div>
            )}
          </div>
        </div>

        {selectedSyllabus && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-100">
            <h3 className="font-semibold text-red-800 mb-2">
              Sílabo seleccionado
            </h3>

            <div className="space-y-1 text-sm text-gray-700">
              <p>
                <span className="font-medium">Código:</span>{" "}
                {selectedSyllabus.codigo}
              </p>
              <p>
                <span className="font-medium">Asignatura:</span>{" "}
                {selectedSyllabus.asignatura}
              </p>
              {selectedSyllabus.ciclo && (
                <p>
                  <span className="font-medium">Ciclo:</span>{" "}
                  {selectedSyllabus.ciclo}
                </p>
              )}
              {selectedSyllabus.escuela && (
                <p>
                  <span className="font-medium">Escuela:</span>{" "}
                  {selectedSyllabus.escuela}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-800 mb-2">
            2. Fecha de Aprobación
          </label>

          <input
            type="date"
            value={approvalDate}
            onChange={(e) => setApprovalDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex justify-center gap-4 mb-6">
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={!selectedSyllabus || isDownloadingPDF}
            className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
          >
            <Download className="w-5 h-5" />
            {isDownloadingPDF ? "Descargando..." : "Descargar"}
          </button>

          <button
            type="button"
            onClick={handlePreviewPDF}
            disabled={!selectedSyllabus || isPreviewingPDF}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
          >
            <Printer className="w-5 h-5" />
            {isPreviewingPDF ? "Cargando..." : "Imprimir"}
          </button>
        </div>

        {!selectedSyllabus && (
          <div className="text-center py-8 text-gray-500">
            <p>
              Busca y selecciona un sílabo para poder descargarlo en formato PDF
            </p>
          </div>
        )}
      </div>
    </div>
  );
}