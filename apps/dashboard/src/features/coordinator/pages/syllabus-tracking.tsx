import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Eye,
  FileText,
  Filter,
  Search,
  ClipboardList,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type RawSyllabus = Record<string, unknown>;

type TrackingStatus =
  | "ASIGNADO"
  | "PENDIENTE"
  | "EN_REVISIÓN"
  | "RECHAZADO"
  | "DESAPROBADO"
  | "OBSERVADO"
  | "APROBADO";

interface TrackingSyllabus {
  id: string;
  syllabusId: number;
  docenteId: number;
  courseName: string;
  courseCode: string;
  teacherName: string;
  academicPeriod: string;
  status: TrackingStatus;
  updatedDate: string;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function formatDate(value: string) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatStatus(status: string) {
  if (status === "EN_REVISIÓN") return "EN REVISIÓN";
  return status.replaceAll("_", " ");
}

function normalizeStatus(value: unknown): TrackingStatus {
  const status = String(value ?? "").trim().toUpperCase();

  if (status === "EN_REVISION" || status === "ANALIZANDO") {
    return "EN_REVISIÓN";
  }

  if (status === "RECHAZADO") {
    return "DESAPROBADO";
  }

  if (
    status === "ASIGNADO" ||
    status === "PENDIENTE" ||
    status === "EN_REVISIÓN" ||
    status === "DESAPROBADO" ||
    status === "OBSERVADO" ||
    status === "APROBADO"
  ) {
    return status;
  }

  return "PENDIENTE";
}

function getInitials(name: string) {
  if (!name) return "ND";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getStatusClasses(status: TrackingStatus) {
  switch (status) {
    case "ASIGNADO":
      return "bg-yellow-50 text-yellow-700 ring-yellow-200";
    case "PENDIENTE":
      return "bg-gray-50 text-gray-700 ring-gray-200";
    case "EN_REVISIÓN":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "DESAPROBADO":
    case "RECHAZADO":
    case "OBSERVADO":
      return "bg-red-50 text-red-700 ring-red-200";
    case "APROBADO":
      return "bg-green-50 text-green-700 ring-green-200";
    default:
      return "bg-gray-50 text-gray-700 ring-gray-200";
  }
}

function getActionLabel(status: TrackingStatus) {
  switch (status) {
    case "ASIGNADO":
      return "Ver asignación";
    case "PENDIENTE":
      return "Ver estado";
    case "EN_REVISIÓN":
      return "Ir a revisión";
    case "DESAPROBADO":
    case "RECHAZADO":
    case "OBSERVADO":
      return "Ver observaciones";
    case "APROBADO":
      return "Ir a PDF";
    default:
      return "Ver detalle";
  }
}

async function fetchAcademicPeriod(syllabusId: number) {
  if (!syllabusId) return "";

  try {
    const res = await fetch(
      `${
        import.meta.env.VITE_API_BASE_URL
      }/syllabus/${syllabusId}/datos-generales`,
    );

    if (!res.ok) {
      return "";
    }

    const json = await res.json();

    return (
      json.semestreAcademico ||
      json.semestre_academico ||
      json.periodoAcademico ||
      json.periodo_academico ||
      json.data?.semestreAcademico ||
      json.data?.semestre_academico ||
      json.data?.periodoAcademico ||
      json.data?.periodo_academico ||
      ""
    );
  } catch {
    return "";
  }
}

function mapRawSyllabus(item: RawSyllabus): TrackingSyllabus {
  const possibleId =
    item.id ??
    item._id ??
    item.idRevision ??
    item.syllabusId ??
    item.silaboId ??
    item.silabo_id ??
    item.silaboID ??
    "";

  const possibleSyllabusId =
    item.syllabusId ??
    item.silaboId ??
    item.silabo_id ??
    item.silaboID ??
    item.idSyllabus ??
    item.id ??
    0;

  return {
    id: String(possibleId ?? ""),
    syllabusId: Number(possibleSyllabusId) || 0,
    docenteId:
      Number(
        item.asignadoADocenteId ??
          item.asignado_a_docente_id ??
          item.docenteId ??
          item.docente_id ??
          0,
      ) || 0,
    courseName:
      (item.cursoNombre as string) ||
      (item.curso_nombre as string) ||
      (item.courseName as string) ||
      "Sin nombre",
    courseCode:
      (item.cursoCodigo as string) ||
      (item.curso_codigo as string) ||
      (item.courseCode as string) ||
      "N/A",
    teacherName:
      (item.nombreDocente as string) ||
      (item.docenteNombre as string) ||
      (item.docente_nombre as string) ||
      (item.docente as string) ||
      (item.correoDocente as string) ||
      (item.correo_docente as string) ||
      (item.correo as string) ||
      (item.teacherName as string) ||
      (item.teacherEmail as string) ||
      "No asignado",
    academicPeriod:
      (item.periodoAcademico as string) ||
      (item.periodo_academico as string) ||
      (item.semestreAcademico as string) ||
      (item.semestre_academico as string) ||
      (item.academicPeriod as string) ||
      (item.periodo as string) ||
      "",
    status: normalizeStatus(
      item.estadoRevision ?? item.estado_revision ?? item.status ?? item.estado,
    ),
    updatedDate:
      (item.fechaEnvio as string) ||
      (item.fecha_envio as string) ||
      (item.updatedAt as string) ||
      (item.updated_at as string) ||
      (item.createdAt as string) ||
      (item.created_at as string) ||
      new Date().toISOString(),
  };
}

export default function SyllabusTracking() {
  const navigate = useNavigate();

  const [items, setItems] = useState<TrackingSyllabus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTrackingItem, setSelectedTrackingItem] =
    useState<TrackingSyllabus | null>(null);

  useEffect(() => {
    const loadTracking = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/syllabus/revision`,
        );

        if (!res.ok) {
          throw new Error(await res.text());
        }

        const json = await res.json();
        const rawData = Array.isArray(json) ? json : json?.data ?? [];

        const mappedItems: TrackingSyllabus[] = rawData.map(mapRawSyllabus);

        const enrichedItems: TrackingSyllabus[] = await Promise.all(
          mappedItems.map(async (item: TrackingSyllabus) => {
            if (item.academicPeriod) {
              return item;
            }

            const academicPeriod = await fetchAcademicPeriod(item.syllabusId);

            return {
              ...item,
              academicPeriod: academicPeriod || "No informado",
            };
          }),
        );

        setItems(enrichedItems);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No se pudo cargar la bandeja de seguimiento",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadTracking();
  }, []);

  const statuses = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.status)));
  }, [items]);

  const periods = useMemo(() => {
    return Array.from(
      new Set(
        items
          .map((item) => item.academicPeriod)
          .filter(
            (period) => period && period !== "N/A" && period !== "No informado",
          ),
      ),
    );
  }, [items]);

  const summaryCounts = useMemo(() => {
    const total = items.length;

    const asignados = items.filter((item) => item.status === "ASIGNADO").length;

    const enRevision = items.filter(
      (item) => item.status === "EN_REVISIÓN",
    ).length;

    const desaprobados = items.filter(
      (item) =>
        item.status === "DESAPROBADO" ||
        item.status === "RECHAZADO" ||
        item.status === "OBSERVADO",
    ).length;

    const aprobados = items.filter((item) => item.status === "APROBADO").length;

    return {
      total,
      asignados,
      enRevision,
      desaprobados,
      aprobados,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);

    return items.filter((item) => {
      const searchText = normalizeText(
        `${item.courseName} ${item.courseCode} ${item.teacherName} ${item.academicPeriod}`,
      );

      const itemDate = item.updatedDate
        ? new Date(item.updatedDate).toISOString().slice(0, 10)
        : "";

      const matchesSearch =
        !normalizedSearch || searchText.includes(normalizedSearch);

      const matchesStatus =
        selectedStatus === "ALL" ||
        item.status === selectedStatus ||
        (selectedStatus === "DESAPROBADO" &&
          (item.status === "DESAPROBADO" ||
            item.status === "RECHAZADO" ||
            item.status === "OBSERVADO"));

      const matchesPeriod =
        selectedPeriod === "ALL" || item.academicPeriod === selectedPeriod;

      const matchesDate = !selectedDate || itemDate === selectedDate;

      return matchesSearch && matchesStatus && matchesPeriod && matchesDate;
    });
  }, [items, searchTerm, selectedStatus, selectedPeriod, selectedDate]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("ALL");
    setSelectedPeriod("ALL");
    setSelectedDate("");
  };

  const handleAction = (item: TrackingSyllabus) => {
    const routeId = item.id || String(item.syllabusId);

    const queryParams = new URLSearchParams({
      docenteId: String(item.docenteId),
      syllabusId: String(item.syllabusId),
      courseName: item.courseName,
      courseCode: item.courseCode,
      teacherName: item.teacherName,
      status: item.status,
    });

    if (item.status === "EN_REVISIÓN") {
      navigate(
        `/coordinator/review-syllabus/${routeId}?${queryParams.toString()}`,
      );
      return;
    }

    if (item.status === "APROBADO") {
      navigate(`/approved-syllabus?${queryParams.toString()}`);
      return;
    }

    setSelectedTrackingItem(item);
  };

  const hasFilters =
    searchTerm ||
    selectedStatus !== "ALL" ||
    selectedPeriod !== "ALL" ||
    selectedDate;

  return (
    <div className="min-h-screen bg-[#f7f7f8] px-6 py-8">
      <div className="mx-auto w-full max-w-[1180px]">
        <section className="mb-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700 ring-1 ring-red-200">
              <ClipboardList size={24} />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-950">
                Seguimiento de Sílabos
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Consulta el estado operativo de los sílabos y accede a la acción
                correspondiente.
              </p>

              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 size={16} className="text-red-700" />
                <span>{items.length} sílabos registrados en seguimiento.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <button
              type="button"
              onClick={() => setSelectedStatus("ALL")}
              className={`rounded-xl border p-5 text-left shadow-sm transition ${
                selectedStatus === "ALL"
                  ? "border-gray-400 bg-gray-100"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {summaryCounts.total}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus("ASIGNADO")}
              className={`rounded-xl border p-5 text-left shadow-sm transition ${
                selectedStatus === "ASIGNADO"
                  ? "border-yellow-400 bg-yellow-100"
                  : "border-yellow-200 bg-yellow-50 hover:border-yellow-300 hover:bg-yellow-100"
              }`}
            >
              <p className="text-sm font-medium text-yellow-700">Asignados</p>
              <p className="mt-2 text-3xl font-bold text-yellow-800">
                {summaryCounts.asignados}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus("EN_REVISIÓN")}
              className={`rounded-xl border p-5 text-left shadow-sm transition ${
                selectedStatus === "EN_REVISIÓN"
                  ? "border-blue-400 bg-blue-100"
                  : "border-blue-200 bg-blue-50 hover:border-blue-300 hover:bg-blue-100"
              }`}
            >
              <p className="text-sm font-medium text-blue-700">En Revisión</p>
              <p className="mt-2 text-3xl font-bold text-blue-800">
                {summaryCounts.enRevision}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus("DESAPROBADO")}
              className={`rounded-xl border p-5 text-left shadow-sm transition ${
                selectedStatus === "DESAPROBADO"
                  ? "border-red-400 bg-red-100"
                  : "border-red-200 bg-red-50 hover:border-red-300 hover:bg-red-100"
              }`}
            >
              <p className="text-sm font-medium text-red-700">Desaprobados</p>
              <p className="mt-2 text-3xl font-bold text-red-800">
                {summaryCounts.desaprobados}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus("APROBADO")}
              className={`rounded-xl border p-5 text-left shadow-sm transition ${
                selectedStatus === "APROBADO"
                  ? "border-green-400 bg-green-100"
                  : "border-green-200 bg-green-50 hover:border-green-300 hover:bg-green-100"
              }`}
            >
              <p className="text-sm font-medium text-green-700">Aprobados</p>
              <p className="mt-2 text-3xl font-bold text-green-800">
                {summaryCounts.aprobados}
              </p>
            </button>
          </div>
        </section>

        <section className="mb-5">
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_220px_220px_auto]">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />

              <input
                type="text"
                placeholder="Buscar por curso, código, docente o periodo..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
            >
              <option value="ALL">Todos los estados</option>

              {statuses.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>

            <select
              value={selectedPeriod}
              onChange={(event) => setSelectedPeriod(event.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
            >
              <option value="ALL">Todos los periodos</option>

              {periods.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>

            <div className="relative">
              <CalendarDays
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />

              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-800 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
              />
            </div>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasFilters}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Filter size={16} />
              Limpiar
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Mostrando{" "}
            <span className="font-semibold text-gray-900">
              {filteredItems.length}
            </span>{" "}
            de{" "}
            <span className="font-semibold text-gray-900">{items.length}</span>{" "}
            sílabos.
          </div>
        </section>

        {isLoading && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
            Cargando bandeja de seguimiento...
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-700">
              No se pudo cargar la bandeja de seguimiento.
            </p>
            <p className="mt-1 text-xs text-red-600">{errorMessage}</p>
          </div>
        )}

        {!isLoading && filteredItems.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white py-12 text-center text-sm text-gray-500 shadow-sm">
            No se encontraron sílabos que coincidan con los filtros.
          </div>
        )}

        {filteredItems.length > 0 && (
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-red-800 bg-red-700 px-5 py-4">
              <div className="flex flex-col gap-1 text-white">
                <h2 className="text-base font-semibold">
                  Bandeja de Seguimiento
                </h2>
                <p className="text-xs text-red-50">
                  Estados operativos y accesos disponibles según el flujo
                  académico.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse">
                <thead className="bg-gray-50">
                  <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-600">
                    <th className="px-5 py-3">Curso / Código</th>
                    <th className="px-5 py-3">Docente</th>
                    <th className="px-5 py-3">Periodo</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3">Fecha</th>
                    <th className="px-5 py-3 text-right">
                      Acción disponible
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredItems.map((item) => (
                    <tr
                      key={`${item.id}-${item.syllabusId}`}
                      className="transition hover:bg-red-50/40"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">
                          {item.courseName}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Código: {item.courseCode}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700">
                            {getInitials(item.teacherName)}
                          </div>
                          <p className="text-sm font-medium text-gray-800">
                            {item.teacherName}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-700">
                        {item.academicPeriod || "No informado"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusClasses(
                            item.status,
                          )}`}
                        >
                          {formatStatus(item.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-800">
                        {formatDate(item.updatedDate)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleAction(item)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800"
                        >
                          {item.status === "APROBADO" ? (
                            <FileText size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                          {getActionLabel(item.status)}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3 text-xs text-gray-600">
              <CheckCircle2 size={15} className="text-red-700" />
              <span>
                La bandeja solo permite consultar y redirigir; no modifica el
                estado del sílabo.
              </span>
            </div>
          </section>
        )}

        {selectedTrackingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Estado del Sílabo
                  </h2>
                  <p className="text-sm text-gray-500">
                    Seguimiento operativo del registro seleccionado.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTrackingItem(null)}
                  className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 px-6 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Curso
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {selectedTrackingItem.courseName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Código: {selectedTrackingItem.courseCode}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Docente responsable
                  </p>
                  <p className="mt-1 text-sm text-gray-800">
                    {selectedTrackingItem.teacherName}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Periodo académico
                    </p>
                    <p className="mt-1 text-sm text-gray-800">
                      {selectedTrackingItem.academicPeriod || "No informado"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Fecha
                    </p>
                    <p className="mt-1 text-sm text-gray-800">
                      {formatDate(selectedTrackingItem.updatedDate)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Estado actual
                  </p>
                  <span
                    className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusClasses(
                      selectedTrackingItem.status,
                    )}`}
                  >
                    {formatStatus(selectedTrackingItem.status)}
                  </span>
                </div>

                <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-800">
                    Acción disponible
                  </p>
                  <p className="mt-1 text-sm text-red-700">
                    {selectedTrackingItem.status === "PENDIENTE" &&
                      "El sílabo se encuentra registrado, pero aún no ha avanzado a revisión académica."}

                    {selectedTrackingItem.status === "ASIGNADO" &&
                      "El sílabo está asignado al docente. La acción correspondiente se realiza desde la vista de asignaciones o edición."}

                    {(selectedTrackingItem.status === "DESAPROBADO" ||
                      selectedTrackingItem.status === "RECHAZADO" ||
                      selectedTrackingItem.status === "OBSERVADO") &&
                      "El sílabo tiene observaciones o fue desaprobado. La corrección corresponde al flujo del docente."}

                    {selectedTrackingItem.status === "APROBADO" &&
                      "El sílabo fue aprobado. Puede continuar hacia la generación o consulta documental."}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setSelectedTrackingItem(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  Cerrar
                </button>

                {(selectedTrackingItem.status === "ASIGNADO" ||
                  selectedTrackingItem.status === "PENDIENTE" ||
                  selectedTrackingItem.status === "DESAPROBADO" ||
                  selectedTrackingItem.status === "RECHAZADO" ||
                  selectedTrackingItem.status === "OBSERVADO") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTrackingItem(null);
                      navigate("/mis-asignaciones");
                    }}
                    className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
                  >
                    Ir a mis asignaciones
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}