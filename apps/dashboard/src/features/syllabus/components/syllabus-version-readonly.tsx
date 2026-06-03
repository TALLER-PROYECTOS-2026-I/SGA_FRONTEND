import type { ReactNode } from "react";
import {
  BookOpen,
  FileText,
  GraduationCap,
  Layers,
  Loader2,
  X,
} from "lucide-react";
import type { SyllabusVersionSnapshot } from "../hooks/syllabus-versions-query";

interface SyllabusVersionReadonlyProps {
  version?: SyllabusVersionSnapshot | null;
  isLoading?: boolean;
  onClose?: () => void;
}

type SnapshotRecord = Record<string, unknown>;

type SnapshotUnit = {
  id?: string | number | null;
  numero?: string | number | null;
  titulo?: string | null;
  nombre?: string | null;
  descripcion?: string | null;
};

function isRecord(value: unknown): value is SnapshotRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readStringField(
  record: SnapshotRecord,
  key: string,
): string | number | null {
  const value = record[key];

  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  return null;
}

function getSnapshot(version?: SyllabusVersionSnapshot | null): SnapshotRecord {
  const snapshot = version?.snapshot;

  if (!isRecord(snapshot)) {
    return {};
  }

  return snapshot;
}

function readText(value: unknown, fallback = "No registrado") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function getDatosGenerales(snapshot: SnapshotRecord): SnapshotRecord {
  const datosGenerales = snapshot.datosGenerales;

  if (!isRecord(datosGenerales)) {
    return {};
  }

  return datosGenerales;
}

function getCourseName(snapshot: SnapshotRecord) {
  const datos = getDatosGenerales(snapshot);

  return readText(
    readStringField(datos, "nombreAsignatura") ??
      readStringField(datos, "cursoNombre") ??
      readStringField(datos, "asignatura") ??
      readStringField(snapshot, "cursoNombre"),
    "Sílabo sin nombre",
  );
}

function getCourseCode(snapshot: SnapshotRecord) {
  const datos = getDatosGenerales(snapshot);

  return readText(
    readStringField(datos, "codigoAsignatura") ??
      readStringField(datos, "cursoCodigo") ??
      readStringField(snapshot, "cursoCodigo"),
    "-",
  );
}

function getStatus(version?: SyllabusVersionSnapshot | null) {
  return readText(version?.status, "Sin estado");
}

function getSumilla(snapshot: SnapshotRecord) {
  return readText(
    readStringField(snapshot, "sumilla") ??
      readStringField(snapshot, "silaboSumilla") ??
      readStringField(snapshot, "descripcionSumilla"),
    "No hay sumilla registrada para esta versión.",
  );
}

function getCompetencias(snapshot: SnapshotRecord): string[] {
  const value = snapshot.competenciasCurso;

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string" || typeof item === "number") {
        return String(item);
      }

      if (isRecord(item)) {
        return readText(
          readStringField(item, "descripcion") ??
            readStringField(item, "text") ??
            readStringField(item, "nombre"),
          "",
        );
      }

      return "";
    })
    .map((item) => item.trim())
    .filter(Boolean);
}

function getUnidades(snapshot: SnapshotRecord): SnapshotUnit[] {
  const value = snapshot.unidadesDidacticas;

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((item) => ({
      id: readStringField(item, "id"),
      numero: readStringField(item, "numero"),
      titulo:
        typeof item.titulo === "string"
          ? item.titulo
          : null,
      nombre:
        typeof item.nombre === "string"
          ? item.nombre
          : null,
      descripcion:
        typeof item.descripcion === "string"
          ? item.descripcion
          : null,
    }));
}

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return date.toLocaleString();
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs font-bold uppercase text-gray-400">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-gray-900">
        {readText(value)}
      </p>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
          {icon}
        </div>

        <h3 className="min-w-0 break-words text-base font-black text-gray-900">
          {title}
        </h3>
      </div>

      <div className="min-w-0 p-5">{children}</div>
    </section>
  );
}

export function SyllabusVersionReadonly({
  version,
  isLoading = false,
  onClose,
}: SyllabusVersionReadonlyProps) {
  const snapshot = getSnapshot(version);
  const datos = getDatosGenerales(snapshot);
  const competencias = getCompetencias(snapshot);
  const unidades = getUnidades(snapshot);

  if (!version && !isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/45 px-4 py-6">
      <div className="flex max-h-[92vh] w-full max-w-5xl min-w-0 flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-white px-6 py-5">
          <div className="min-w-0">
            <p className="text-sm font-black text-red-700">
              {version
                ? `Versión ${version.versionNumber}`
                : "Cargando versión"}
            </p>

            <h2 className="mt-1 break-words text-2xl font-black text-gray-900">
              {isLoading ? "Cargando sílabo..." : getCourseName(snapshot)}
            </h2>

            <p className="mt-1 break-words text-sm text-gray-500">
              {getCourseCode(snapshot)} · {getStatus(version)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-6">
          {isLoading && (
            <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
              <Loader2 size={18} className="animate-spin" />
              Cargando versión seleccionada...
            </div>
          )}

          {!isLoading && version && (
            <div className="min-w-0 space-y-5">
              <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                <InfoBox
                  label="Escuela"
                  value={
                    readStringField(datos, "escuelaProfesional") ??
                    readStringField(datos, "escuela")
                  }
                />

                <InfoBox
                  label="Programa"
                  value={
                    readStringField(datos, "programaAcademico") ??
                    readStringField(datos, "programa")
                  }
                />

                <InfoBox
                  label="Ciclo"
                  value={readStringField(datos, "ciclo")}
                />

                <InfoBox
                  label="Última modificación"
                  value={formatDate(version.modifiedAt)}
                />

                <InfoBox label="Estado" value={version.status} />

                <InfoBox
                  label="Docente"
                  value={
                    readStringField(datos, "docentes") ??
                    readStringField(datos, "docente") ??
                    "No registrado"
                  }
                />
              </div>

              <SectionCard icon={<BookOpen size={20} />} title="Sumilla">
                <p className="max-w-full whitespace-pre-wrap break-words text-sm leading-7 text-gray-700">
                  {getSumilla(snapshot)}
                </p>
              </SectionCard>

              <SectionCard
                icon={<GraduationCap size={20} />}
                title="Competencias y componentes"
              >
                {competencias.length > 0 ? (
                  <div className="space-y-3">
                    {competencias.map((competencia, index) => (
                      <div
                        key={`${competencia}-${index}`}
                        className="min-w-0 rounded-xl border border-gray-100 bg-gray-50 p-4"
                      >
                        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                          {competencia}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No hay competencias registradas en esta versión.
                  </p>
                )}
              </SectionCard>

              <SectionCard
                icon={<Layers size={20} />}
                title="Unidades temáticas"
              >
                {unidades.length > 0 ? (
                  <div className="space-y-3">
                    {unidades.map((unidad, index) => (
                      <div
                        key={unidad.id ?? index}
                        className="min-w-0 rounded-xl border border-gray-100 bg-gray-50 p-4"
                      >
                        <p className="text-sm font-bold text-gray-900">
                          Unidad {unidad.numero ?? index + 1}
                        </p>

                        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                          {readText(
                            unidad.titulo ??
                              unidad.nombre ??
                              unidad.descripcion,
                            "Unidad sin descripción",
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No hay unidades registradas en esta versión.
                  </p>
                )}
              </SectionCard>

              <SectionCard
                icon={<FileText size={20} />}
                title="Resumen técnico"
              >
                <pre className="max-h-72 max-w-full overflow-auto whitespace-pre-wrap break-words rounded-xl bg-gray-950 p-4 text-xs leading-5 text-gray-100">
                  {JSON.stringify(snapshot, null, 2)}
                </pre>
              </SectionCard>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl bg-gray-900 px-6 text-sm font-bold text-white shadow-sm hover:bg-black"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}