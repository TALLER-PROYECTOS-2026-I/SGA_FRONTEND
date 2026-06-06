import { Download, Eye, Loader2, FileText } from "lucide-react";
import { useSyllabusPDF } from "../hooks/use-syllabus-pdf";
import { toast } from "sonner";

interface DownloadPDFButtonProps {
  syllabusId: number;
  variant?: "primary" | "secondary" | "outline";
  showPreview?: boolean;
  className?: string;
}

export function DownloadPDFButton({
  syllabusId,
  variant = "primary",
  showPreview = false,
  className = "",
}: DownloadPDFButtonProps) {
  const { generatePDF, previewPDF, isGenerating } = useSyllabusPDF({
    onSuccess: () => {
      toast.success("PDF generado exitosamente", {
        description: "El archivo se ha descargado correctamente.",
      });
    },
    onError: (err) => {
      toast.error("Error al generar PDF", {
        description: err.message,
      });
    },
  });

  const handleDownload = () => {
    generatePDF(syllabusId);
  };

  const handlePreview = () => {
    previewPDF(syllabusId);
  };

  const baseClasses =
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60";

  const variantClasses = {
    primary:
      "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
    secondary:
      "bg-gray-900 text-white shadow-sm hover:bg-gray-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2",
    outline:
      "border border-red-200 bg-white text-red-700 hover:bg-red-50 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleDownload}
        disabled={isGenerating}
        className={buttonClasses}
        title="Descargar PDF del sílabo"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Generando PDF...</span>
          </>
        ) : (
          <>
            <Download className="h-5 w-5" />
            <span>Descargar PDF</span>
          </>
        )}
      </button>

      {showPreview && (
        <button
          type="button"
          onClick={handlePreview}
          disabled={isGenerating}
          className={`${baseClasses} border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          title="Previsualizar PDF"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Cargando...</span>
            </>
          ) : (
            <>
              <Eye className="h-5 w-5" />
              <span>Vista previa</span>
            </>
          )}
        </button>
      )}

      {isGenerating && (
        <div className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 text-sm text-gray-600">
          <FileText className="h-4 w-4 text-gray-400" />
          Preparando documento académico
        </div>
      )}
    </div>
  );
}
