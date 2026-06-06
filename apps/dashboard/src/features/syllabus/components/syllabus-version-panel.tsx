import { Clock3, Eye, Loader2, UserRound } from "lucide-react";
import type {
  SyllabusVersionItem,
  VersionedSyllabusCourse,
} from "../hooks/syllabus-versions-query";

interface SyllabusVersionPanelProps {
  course?: VersionedSyllabusCourse | null;
  versions: SyllabusVersionItem[];
  selectedVersionId?: number | null;
  isLoading?: boolean;
  onSelectVersion: (version: SyllabusVersionItem) => void;
}

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleString();
}

function formatUser(version: SyllabusVersionItem) {
  return (
    version.modifiedBy?.nombre ||
    version.modifiedBy?.correo ||
    "Usuario no registrado"
  );
}

export function SyllabusVersionPanel({
  course,
  versions,
  selectedVersionId,
  isLoading,
  onSelectVersion,
}: SyllabusVersionPanelProps) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white shadow-md overflow-hidden">
      <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
            <Clock3 size={19} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Historial de versiones</h2>
            <p className="text-sm text-gray-500">
              {course?.cursoNombre || "Selecciona un curso"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {!course && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center text-sm font-semibold text-gray-600">
            Selecciona un sílabo para ver su historial.
          </div>
        )}

        {course && isLoading && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            Cargando historial...
          </div>
        )}

        {course && !isLoading && versions.length === 0 && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center text-sm font-semibold text-gray-600">
            Este sílabo no tiene versiones guardadas.
          </div>
        )}

        <div className="space-y-3">
          {versions.map((version) => {
            const selected = selectedVersionId === version.versionId;

            return (
              <article
                key={version.versionId}
                className={`rounded-xl border px-4 py-4 ${
                  selected
                    ? "border-red-200 bg-red-50"
                    : "border-gray-100 bg-gray-50"
                }`}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-white border border-gray-100 px-2.5 py-1 text-xs font-bold text-red-700">
                        Versión {version.versionNumber}
                      </span>
                      <span className="rounded-lg bg-white border border-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">
                        {version.status || "Sin estado"}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <Clock3 size={15} />
                        {formatDate(version.modifiedAt)}
                      </p>
                      <p className="flex items-center gap-2">
                        <UserRound size={15} />
                        {formatUser(version)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectVersion(version)}
                    className="h-10 rounded-xl bg-red-600 px-4 text-sm font-bold text-white flex items-center justify-center gap-2 hover:bg-red-700"
                  >
                    <Eye size={17} />
                    Ver versión
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
