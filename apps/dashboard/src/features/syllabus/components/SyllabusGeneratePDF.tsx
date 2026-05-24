import { useState } from "react";
import { toast } from "sonner";
import {
  Download,
  Eye,
  Loader2,
  FileText,
  BookOpen,
  Hash,
  CalendarDays,
  User,
  GraduationCap,
  RefreshCw,
} from "lucide-react";
import { PDFDownloadLink, PDFViewer, pdf } from "@react-pdf/renderer";
import { mockSyllabusData } from "../mocks/syllabus-mock-data";
import { SyllabusPDFDocument } from "./SyllabusPDFDocument";
import type { CompleteSyllabus } from "../types/complete-syllabus";

interface SyllabusGeneratePDFProps {
  /** Datos del sílabo a generar. Si no se proporciona, usa el mock por defecto */
  data?: CompleteSyllabus;
  /** Nombre del archivo PDF a descargar */
  fileName?: string;
  /** Mostrar vista previa del PDF */
  showPreview?: boolean;
}

/**
 * Componente optimizado para generar PDFs de alta calidad usando @react-pdf/renderer.
 * Genera PDFs nativos directamente desde los datos del sílabo.
 */
export function SyllabusGeneratePDF({
  data = mockSyllabusData,
  fileName,
  showPreview = false,
}: SyllabusGeneratePDFProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(showPreview);

  const pdfFileName =
    fileName ||
    `silabo-${data.datosGenerales.nombreAsignatura?.replace(/\s+/g, "-")}.pdf`;

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      toast.info("Generando PDF académico...");

      const blob = await pdf(<SyllabusPDFDocument data={data} />).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = pdfFileName;
      link.click();

      URL.revokeObjectURL(url);

      toast.success("PDF descargado exitosamente");
    } catch {
      toast.error("Error al generar el PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  const datos = data.datosGenerales;

  const infoCards = [
    {
      label: "Asignatura",
      value: datos.nombreAsignatura || "N/A",
      icon: BookOpen,
    },
    {
      label: "Código",
      value: datos.codigoAsignatura || "N/A",
      icon: Hash,
    },
    {
      label: "Semestre",
      value: datos.semestreAcademico || "N/A",
      icon: CalendarDays,
    },
    {
      label: "Docente",
      value: datos.docentes || "N/A",
      icon: User,
    },
    {
      label: "Créditos",
      value: datos.creditosTotales || "N/A",
      icon: GraduationCap,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
      <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md">
              <FileText size={30} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Generar PDF del Sílabo
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Descarga o previsualiza el documento académico generado desde
                los datos del sílabo.
              </p>

              <div className="mt-3 inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                Archivo: {pdfFileName}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="h-11 px-6 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center gap-2 font-semibold shadow-sm"
            >
              {isDownloading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Descargar PDF
                </>
              )}
            </button>

            <PDFDownloadLink
              document={<SyllabusPDFDocument data={data} />}
              fileName={pdfFileName}
              className="h-11 px-5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 font-semibold shadow-sm"
            >
              {({ loading }) =>
                loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Preparando...
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} />
                    Descarga alternativa
                  </>
                )
              }
            </PDFDownloadLink>

            <button
              type="button"
              onClick={() => setShowPDFPreview((prev) => !prev)}
              className="h-11 px-5 border border-blue-200 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-2 font-semibold shadow-sm"
            >
              <Eye size={18} />
              {showPDFPreview ? "Ocultar vista previa" : "Vista previa"}
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-7">
          {infoCards.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <Icon size={20} />
                  </div>

                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    {item.label}
                  </p>
                </div>

                <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                  {item.value}
                </p>
              </div>
            );
          })}
        </section>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>

            <div>
              <h3 className="font-bold text-blue-900">
                Documento académico
              </h3>

              <p className="text-sm text-blue-700 mt-1 leading-relaxed">
                El PDF se genera como documento nativo usando{" "}
                <code className="bg-white/70 px-2 py-1 rounded-lg text-xs font-bold">
                  @react-pdf/renderer
                </code>
                . La vista previa permite revisar el formato antes de descargar.
              </p>
            </div>
          </div>
        </div>

        {isDownloading && (
          <div className="mt-6 bg-red-50 border border-red-100 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center">
                <Loader2 size={20} className="animate-spin" />
              </div>

              <div>
                <p className="text-sm font-bold text-red-700">
                  Generando documento...
                </p>
                <p className="text-sm text-red-600 mt-1">
                  Preparando el PDF académico para descarga.
                </p>
              </div>
            </div>
          </div>
        )}

        {showPDFPreview && (
          <div className="mt-7 bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center">
                  <Eye size={20} />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Vista previa del PDF
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Revisa el documento antes de descargarlo.
                  </p>
                </div>
              </div>
            </div>

            <div className="h-[800px] bg-gray-100">
              <PDFViewer width="100%" height="100%">
                <SyllabusPDFDocument data={data} />
              </PDFViewer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}