import { useState } from "react";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { useCurriculumContext } from "../hooks/curriculum-context-query";
import type { CurriculumContextCourseRef } from "../hooks/curriculum-context-query";
import { downloadSyllabusPdf } from "../utils/syllabus-pdf-download";

type Props = {
  syllabusId?: number | null;
  courseName: string;
  disabled?: boolean;
};

type DownloadButtonProps = {
  silaboId: number;
  cursoCodigo?: string | null;
  downloadingId: number | null;
  onDownload: (silaboId: number, cursoCodigo?: string | null) => void;
};

function DownloadSyllabusButton({
  silaboId,
  cursoCodigo,
  downloadingId,
  onDownload,
}: DownloadButtonProps) {
  const isDownloading = downloadingId === silaboId;

  return (
    <button
      type="button"
      disabled={isDownloading}
      onClick={() => onDownload(silaboId, cursoCodigo)}
      className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-60"
    >
      {isDownloading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Download size={14} />
      )}
      {isDownloading ? "Descargando..." : "Descargar sílabo"}
    </button>
  );
}

function RelatedCourseCard({
  course,
  downloadingId,
  onDownload,
}: {
  course: CurriculumContextCourseRef;
  downloadingId: number | null;
  onDownload: (silaboId: number, cursoCodigo?: string | null) => void;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 space-y-2">
      <p className="text-sm font-semibold text-gray-800">{course.nombreMalla}</p>

      {course.cursoCodigo && (
        <p className="text-xs text-gray-500">Código: {course.cursoCodigo}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {course.disponible && course.silaboId ? (
          <DownloadSyllabusButton
            silaboId={course.silaboId}
            cursoCodigo={course.cursoCodigo}
            downloadingId={downloadingId}
            onDownload={onDownload}
          />
        ) : (
          <span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
            Sílabo no disponible
          </span>
        )}
      </div>
    </div>
  );
}

export function CurriculumContextInline({
  syllabusId = null,
  courseName,
}: Props) {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const { data, isLoading, isFetching, isError } = useCurriculumContext(
    syllabusId ?? null,
    courseName,
  );

  const onDownload = async (silaboId: number, cursoCodigo?: string | null) => {
    setDownloadingId(silaboId);
    try {
      await downloadSyllabusPdf(silaboId, { codigo: cursoCodigo });
    } catch {
      toast.error("No se pudo descargar el sílabo relacionado.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (!courseName?.trim() && !(syllabusId && syllabusId > 0)) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-500">
        Selecciona o escribe el nombre de la asignatura para ver sus requisitos
        curriculares.
      </div>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-700 flex items-center gap-2">
        <Loader2 size={18} className="animate-spin" />
        Cargando contexto curricular...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-700">
        No se pudo cargar el contexto curricular.
      </div>
    );
  }

  if (!data) {
    return null;
  }

  if (!data.hasCurriculumContext) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
        {data.message ??
          "No hay contexto curricular registrado para esta asignatura."}
      </div>
    );
  }

  const { actual, anteriores, posteriores } = data;

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
      <div className="mb-4">
        <h4 className="text-sm font-bold text-gray-900">Contexto curricular</h4>
        <p className="text-xs text-gray-500">
          Cursos previos, curso actual y cursos posteriores según la malla.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl bg-white border border-gray-100 p-3">
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">
            Cursos previos
          </p>

          {anteriores.length > 0 ? (
            <div className="space-y-2">
              {anteriores.map((item) => (
                <RelatedCourseCard
                  key={item.nombreMalla}
                  course={item}
                  downloadingId={downloadingId}
                  onDownload={onDownload}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Sin cursos previos registrados.
            </p>
          )}
        </div>

        <div className="rounded-xl bg-white border border-blue-200 p-3 shadow-sm">
          <p className="text-xs font-bold text-blue-600 uppercase mb-2">
            Curso actual
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 space-y-2">
            <p className="text-sm font-bold text-blue-900">{actual.cursoNombre}</p>

            {actual.cursoCodigo && (
              <p className="text-xs text-gray-600">Código: {actual.cursoCodigo}</p>
            )}

            {(actual.ciclo != null || actual.linea) && (
              <p className="text-xs text-gray-500">
                {actual.ciclo != null ? `Ciclo ${actual.ciclo}` : ""}
                {actual.ciclo != null && actual.linea ? " · " : ""}
                {actual.linea ?? ""}
              </p>
            )}

            {actual.disponible && actual.silaboId ? (
              <DownloadSyllabusButton
                silaboId={actual.silaboId}
                cursoCodigo={actual.cursoCodigo}
                downloadingId={downloadingId}
                onDownload={onDownload}
              />
            ) : (
              <span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                Sílabo no disponible
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white border border-gray-100 p-3">
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">
            Cursos posteriores
          </p>

          {posteriores.length > 0 ? (
            <div className="space-y-2">
              {posteriores.map((item) => (
                <RelatedCourseCard
                  key={item.nombreMalla}
                  course={item}
                  downloadingId={downloadingId}
                  onDownload={onDownload}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Sin cursos posteriores registrados.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
