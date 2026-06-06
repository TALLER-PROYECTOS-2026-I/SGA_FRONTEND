import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Eye,
  Loader2,
  BookOpen,
  FileText,
  GraduationCap,
  X,
  AlertTriangle,
  Download,
  CheckSquare,
  Square,
} from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import {
  SumillasCatalogPDFDocument,
  type SumillaPDFItem,
} from "../components/SumillasCatalogPDFDocument";
import {
  authFetch,
  getApiBaseUrl,
  readApiErrorMessage,
} from "../../../common/utils/auth-fetch";

const EMPTY_SUMILLA = "Este sílabo aún no tiene sumilla registrada.";

interface SyllabusCatalogApiItem {
  id: number;
  syllabusId?: number;
  cursoCodigo: string | null;
  cursoNombre: string | null;
  ciclo: string | null;
  escuela: string | null;
  estadoRevision: string | null;
  creditos: number;
  sumilla: string | null;
  tieneSumilla: boolean;
  sumillaVersion: number | null;
  sumillaEsActual: boolean | null;
}

interface SyllabusCatalogItem {
  id: string;
  uniqueKey: string;
  courseName: string;
  courseCode: string;
  sumilla: string;
  credits: number;
  estadoRevision: string | null;
  ciclo: string | null;
  escuela: string | null;
}

async function fetchJson(url: string) {
  const response = await authFetch(url);

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response));
  }

  return response.json();
}

async function fetchSyllabusCatalog() {
  const json = await fetchJson(`${getApiBaseUrl()}/syllabus/catalog`);

  const data = Array.isArray(json)
    ? json
    : Array.isArray(json?.data)
      ? json.data
      : [];

  return data as SyllabusCatalogApiItem[];
}

async function fetchCompleteSyllabus(syllabusId: string | number) {
  const json = await fetchJson(
    `${getApiBaseUrl()}/syllabus/${syllabusId}/complete`,
  );

  return json?.data ?? json;
}

function getStatusLabel(status: string | null) {
  const value = String(status ?? "")
    .trim()
    .toUpperCase();

  if (value === "APROBADO") return "Aprobado";

  if (
    value === "ANALIZANDO" ||
    value === "EN_REVISION" ||
    value === "EN REVISIÓN" ||
    value === "PENDIENTE_REVISION" ||
    value === "PENDIENTE" ||
    value === "EN_PROCESO" ||
    value === "EN PROCESO"
  ) {
    return "En proceso";
  }

  if (value === "DESAPROBADO" || value === "RECHAZADO") {
    return "Pendiente";
  }

  if (value === "ASIGNADO") return "Asignado";
  if (value === "NUEVO") return "Nuevo";

  return "Sin estado";
}

function getStatusStyles(status: string | null) {
  const value = String(status ?? "")
    .trim()
    .toUpperCase();

  if (value === "APROBADO") {
    return "border-green-100 bg-green-50 text-green-700";
  }

  if (
    value === "ANALIZANDO" ||
    value === "EN_REVISION" ||
    value === "EN REVISIÓN" ||
    value === "PENDIENTE_REVISION" ||
    value === "PENDIENTE" ||
    value === "EN_PROCESO" ||
    value === "EN PROCESO"
  ) {
    return "border-yellow-100 bg-yellow-50 text-yellow-700";
  }

  if (value === "DESAPROBADO" || value === "RECHAZADO") {
    return "border-red-100 bg-red-50 text-red-700";
  }

  if (value === "ASIGNADO") {
    return "border-blue-100 bg-blue-50 text-blue-700";
  }

  if (value === "NUEVO") {
    return "border-purple-100 bg-purple-50 text-purple-700";
  }

  return "border-gray-100 bg-gray-50 text-gray-700";
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function textFrom(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function numberTextFrom(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return String(value).trim();
  }

  return String(numberValue);
}

function firstText(
  source: Record<string, unknown>,
  keys: string[],
  fallback = "",
): string {
  for (const key of keys) {
    const value = textFrom(source[key]);
    if (value) return value;
  }

  return fallback;
}

function firstNumberText(
  source: Record<string, unknown>,
  keys: string[],
  fallback = "",
): string {
  for (const key of keys) {
    const value = numberTextFrom(source[key]);
    if (value) return value;
  }

  return fallback;
}

function extractSumilla(value: unknown): string {
  if (!value) return "";

  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const result = extractSumilla(item);
      if (result) return result;
    }

    return "";
  }

  if (typeof value !== "object") return "";

  const objectValue = value as Record<string, unknown>;

  const direct =
    textFrom(objectValue.sumilla) ||
    textFrom(objectValue.contenido) ||
    textFrom(objectValue.content) ||
    textFrom(objectValue.descripcion) ||
    textFrom(objectValue.descripcionSumilla) ||
    textFrom(objectValue.contenidoSumilla) ||
    textFrom(objectValue.texto);

  if (direct) return direct;

  const nestedKeys = [
    "data",
    "content",
    "contents",
    "items",
    "result",
    "results",
    "payload",
    "sumilla",
  ];

  for (const key of nestedKeys) {
    const result = extractSumilla(objectValue[key]);
    if (result) return result;
  }

  return "";
}

function getDatosGenerales(complete: unknown): Record<string, unknown> {
  const completeObject = asObject(complete);

  return (
    asObject(completeObject.datosGenerales) ||
    asObject(completeObject.datos_generales) ||
    asObject(completeObject.generalData) ||
    {}
  );
}

function buildPDFItem(
  catalogItem: SyllabusCatalogItem,
  complete: unknown,
): SumillaPDFItem {
  const completeObject = asObject(complete);
  const datosGenerales = getDatosGenerales(complete);

  const sumillaFromComplete =
    extractSumilla(completeObject.sumilla) ||
    extractSumilla(completeObject.seccionSumilla) ||
    extractSumilla(completeObject.silaboSumilla) ||
    extractSumilla(completeObject);

  const title = firstText(
    datosGenerales,
    ["nombreAsignatura", "cursoNombre", "nombre", "asignatura", "courseName"],
    catalogItem.courseName,
  );

  const codigoAsignatura = firstText(
    datosGenerales,
    ["codigoAsignatura", "cursoCodigo", "codigo", "codigoCurso", "courseCode"],
    catalogItem.courseCode,
  );

  const ciclo = firstText(
    datosGenerales,
    ["ciclo", "cicloAcademico"],
    catalogItem.ciclo ?? "",
  );

  const escuelaProfesional = firstText(
    datosGenerales,
    ["escuelaProfesional", "escuela", "school"],
    catalogItem.escuela ?? "",
  );

  const programaAcademico = firstText(datosGenerales, [
    "programaAcademico",
    "programa",
    "program",
  ]);

  const departamentoAcademico = firstText(datosGenerales, [
    "departamentoAcademico",
    "departamento",
    "department",
  ]);

  const semestreAcademico = firstText(datosGenerales, [
    "semestreAcademico",
    "semestre",
    "periodo",
    "periodoAcademico",
  ]);

  const docente =
    firstText(datosGenerales, [
      "docente",
      "docentes",
      "nombreDocente",
      "teacherName",
    ]) || firstText(completeObject, ["docente", "docentes", "nombreDocente"]);

  const horasTeoria = firstNumberText(datosGenerales, [
    "horasTeoria",
    "horas_teoria",
    "teoriaHoras",
    "teoria",
    "horasTeoricas",
  ]);

  const horasPractica = firstNumberText(datosGenerales, [
    "horasPractica",
    "horas_practica",
    "practicaHoras",
    "practica",
    "horasPracticas",
  ]);

  const horasTotal =
    firstNumberText(datosGenerales, [
      "horasTotales",
      "totalHoras",
      "horas_total",
      "total_horas",
    ]) ||
    String((Number(horasTeoria) || 0) + (Number(horasPractica) || 0) || "");

  const creditosTeoria = firstNumberText(datosGenerales, [
    "creditosTeoria",
    "creditos_teoria",
    "teoriaCreditos",
  ]);

  const creditosPractica = firstNumberText(datosGenerales, [
    "creditosPractica",
    "creditos_practica",
    "practicaCreditos",
  ]);

  const creditosTotal =
    firstNumberText(datosGenerales, [
      "creditosTotales",
      "totalCreditos",
      "creditos_total",
      "total_creditos",
    ]) || String(catalogItem.credits || "");

  return {
    id: catalogItem.uniqueKey,
    title,
    tipoAsignatura: firstText(datosGenerales, [
      "tipoAsignatura",
      "tipo_asignatura",
    ]),
    tipoEstudios: firstText(datosGenerales, ["tipoEstudios", "tipo_estudios"]),
    modalidad: firstText(datosGenerales, [
      "modalidadAsignatura",
      "modalidad",
      "modalidadDeAsignatura",
    ]),
    codigoAsignatura,
    ciclo,
    requisitos: firstText(datosGenerales, [
      "requisitos",
      "requisito",
      "prerequisitos",
    ]),
    horasTeoria,
    horasPractica,
    horasTotal,
    creditosTeoria,
    creditosPractica,
    creditosTotal,
    departamentoAcademico,
    escuelaProfesional,
    programaAcademico,
    semestreAcademico,
    docente,
    estadoRevision: catalogItem.estadoRevision ?? "",
    sumilla: sumillaFromComplete || catalogItem.sumilla,
  };
}

export default function SyllabusCatalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [catalog, setCatalog] = useState<SyllabusCatalogItem[]>([]);
  const [selectedSyllabus, setSelectedSyllabus] =
    useState<SyllabusCatalogItem | null>(null);
  const [selectedSyllabusIds, setSelectedSyllabusIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [error, setError] = useState("");

  const loadCatalog = async () => {
    try {
      setIsLoading(true);
      setError("");

      const data = await fetchSyllabusCatalog();

      const items: SyllabusCatalogItem[] = data.map((item, index) => {
        const syllabusId = item.syllabusId ?? item.id;
        const courseCode = item.cursoCodigo ?? "Sin código";
        const courseName = item.cursoNombre ?? "Sin nombre";
        const sumilla = item.sumilla?.trim() || EMPTY_SUMILLA;

        return {
          id: String(syllabusId),
          uniqueKey: `${syllabusId}-${courseCode}-${index}`,
          courseName,
          courseCode,
          sumilla,
          credits: Number(item.creditos ?? 0),
          estadoRevision: item.estadoRevision ?? null,
          ciclo: item.ciclo ?? null,
          escuela: item.escuela ?? null,
        };
      });

      setCatalog(items);
      setSelectedSyllabusIds([]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error cargando catálogo de sumillas",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const filteredCatalog = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) return catalog;

    return catalog.filter(
      (item) =>
        item.courseName.toLowerCase().includes(search) ||
        item.courseCode.toLowerCase().includes(search) ||
        item.sumilla.toLowerCase().includes(search) ||
        String(item.estadoRevision ?? "")
          .toLowerCase()
          .includes(search),
    );
  }, [catalog, searchTerm]);

  const filteredIds = useMemo(
    () => filteredCatalog.map((item) => item.id),
    [filteredCatalog],
  );

  const selectedVisibleCount = filteredIds.filter((id) =>
    selectedSyllabusIds.includes(id),
  ).length;

  const allVisibleSelected =
    filteredIds.length > 0 && selectedVisibleCount === filteredIds.length;

  const hasSelectedSyllabi = selectedSyllabusIds.length > 0;

  const totalWithSumilla = catalog.filter(
    (item) => item.sumilla !== EMPTY_SUMILLA,
  ).length;

  const totalWithoutSumilla = catalog.length - totalWithSumilla;

  const toggleSyllabusSelection = (syllabusId: string) => {
    setSelectedSyllabusIds((prev) =>
      prev.includes(syllabusId)
        ? prev.filter((id) => id !== syllabusId)
        : [...prev, syllabusId],
    );
  };

  const toggleSelectVisible = () => {
    if (allVisibleSelected) {
      setSelectedSyllabusIds((prev) =>
        prev.filter((id) => !filteredIds.includes(id)),
      );
      return;
    }

    setSelectedSyllabusIds((prev) =>
      Array.from(new Set([...prev, ...filteredIds])),
    );
  };

  const exportCatalogItems = async (
    itemsToExport: SyllabusCatalogItem[],
    fileName: string,
  ) => {
    try {
      setIsExportingPdf(true);

      if (itemsToExport.length === 0) {
        throw new Error("No hay sílabos para exportar");
      }

      const completeItems = await Promise.all(
        itemsToExport.map(async (item) => {
          try {
            const complete = await fetchCompleteSyllabus(item.id);
            return buildPDFItem(item, complete);
          } catch {
            return buildPDFItem(item, {});
          }
        }),
      );

      const blob = await pdf(
        <SumillasCatalogPDFDocument items={completeItems} />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Error al exportar el PDF de sumillas",
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportAllPDF = async () => {
    await exportCatalogItems(catalog, "catalogo-de-sumillas-todos.pdf");
  };

  const handleExportSelectedPDF = async () => {
    const itemsToExport = catalog.filter((item) =>
      selectedSyllabusIds.includes(item.id),
    );

    if (itemsToExport.length === 0) {
      alert("Seleccione al menos un sílabo para exportar.");
      return;
    }

    await exportCatalogItems(
      itemsToExport,
      "catalogo-de-sumillas-seleccionados.pdf",
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-md px-8 py-6 flex items-center gap-3 text-gray-600">
          <Loader2 className="animate-spin text-red-600" size={22} />
          Cargando catálogo de sumillas...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-gray-50 flex items-center justify-center px-8">
        <div className="bg-white border border-red-100 rounded-2xl shadow-md px-8 py-6 text-red-600 max-w-xl text-center">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-6 py-8 overflow-x-hidden">
      <div className="w-full max-w-6xl mx-auto">
        <div className="mb-7">
          <h1 className="text-3xl font-bold text-gray-900">
            Catálogo de Sumilla
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Consulta las sumillas registradas por curso y código.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md">
                  <BookOpen size={30} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Sumillas Académicas
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Busca, selecciona y exporta el catálogo de sumillas.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap lg:justify-end">
                <button
                  type="button"
                  onClick={handleExportSelectedPDF}
                  disabled={isExportingPdf || !hasSelectedSyllabi}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 whitespace-nowrap"
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5" />
                      Exportar seleccionados ({selectedSyllabusIds.length})
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleExportAllPDF}
                  disabled={isExportingPdf || catalog.length === 0}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5" />
                      Exportar todos
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-600 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium opacity-90">
                    Sílabos registrados
                  </p>

                  <h2 className="text-3xl font-bold mt-1">{catalog.length}</h2>
                </div>

                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <FileText size={26} />
                </div>
              </div>

              <div className="bg-green-600 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium opacity-90">Con sumilla</p>

                  <h2 className="text-3xl font-bold mt-1">
                    {totalWithSumilla}
                  </h2>
                </div>

                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Search size={26} />
                </div>
              </div>

              <div className="bg-yellow-500 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium opacity-90">Sin sumilla</p>

                  <h2 className="text-3xl font-bold mt-1">
                    {totalWithoutSumilla}
                  </h2>
                </div>

                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <AlertTriangle size={26} />
                </div>
              </div>

              <div className="bg-red-600 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium opacity-90">Resultados</p>

                  <h2 className="text-3xl font-bold mt-1">
                    {filteredCatalog.length}
                  </h2>
                </div>

                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <GraduationCap size={26} />
                </div>
              </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />

                <input
                  type="text"
                  placeholder="Buscar por curso, código, estado o sumilla..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm text-sm text-gray-700 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-600">
                Seleccionados: {selectedSyllabusIds.length}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] table-fixed text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-700">
                      <th className="px-5 py-4 text-center font-bold w-[6%]">
                        <button
                          type="button"
                          onClick={toggleSelectVisible}
                          disabled={filteredCatalog.length === 0}
                          className="inline-flex items-center justify-center text-gray-600 hover:text-red-600 disabled:cursor-not-allowed disabled:text-gray-300"
                          title={
                            allVisibleSelected
                              ? "Quitar selección visible"
                              : "Seleccionar visibles"
                          }
                        >
                          {allVisibleSelected ? (
                            <CheckSquare size={20} />
                          ) : (
                            <Square size={20} />
                          )}
                        </button>
                      </th>

                      <th className="px-5 py-4 text-left font-bold w-[10%]">
                        Código
                      </th>

                      <th className="px-5 py-4 text-left font-bold w-[24%]">
                        Curso
                      </th>

                      <th className="px-5 py-4 text-center font-bold w-[8%]">
                        Créditos
                      </th>

                      <th className="px-5 py-4 text-center font-bold w-[12%]">
                        Estado
                      </th>

                      <th className="px-5 py-4 text-left font-bold w-[32%]">
                        Sumilla
                      </th>

                      <th className="px-5 py-4 text-center font-bold w-[8%]">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCatalog.map((item) => {
                      const hasSumilla = item.sumilla !== EMPTY_SUMILLA;
                      const isSelected = selectedSyllabusIds.includes(item.id);

                      return (
                        <tr
                          key={item.uniqueKey}
                          className={`h-[88px] border-b border-gray-100 last:border-b-0 transition-colors align-middle ${
                            isSelected ? "bg-red-50/40" : "hover:bg-gray-50"
                          }`}
                        >
                          <td className="px-5 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleSyllabusSelection(item.id)}
                              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                                isSelected
                                  ? "bg-red-600 text-white hover:bg-red-700"
                                  : "bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-600"
                              }`}
                              title={
                                isSelected
                                  ? "Quitar de exportación"
                                  : "Seleccionar para exportar"
                              }
                            >
                              {isSelected ? (
                                <CheckSquare size={18} />
                              ) : (
                                <Square size={18} />
                              )}
                            </button>
                          </td>

                          <td className="px-5 py-3 font-semibold text-gray-800">
                            <div className="line-clamp-1">
                              {item.courseCode}
                            </div>
                          </td>

                          <td className="px-5 py-3">
                            <div className="line-clamp-2 font-bold leading-snug text-gray-900">
                              {item.courseName}
                            </div>

                            {item.ciclo && (
                              <div className="mt-1 text-xs text-gray-500">
                                Ciclo: {item.ciclo}
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-3 text-center">
                            <span className="inline-flex items-center justify-center min-w-10 px-3 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                              {item.credits}
                            </span>
                          </td>

                          <td className="px-5 py-3 text-center">
                            <span
                              className={`inline-flex items-center rounded-lg border px-3 py-1 text-xs font-semibold ${getStatusStyles(
                                item.estadoRevision,
                              )}`}
                            >
                              {getStatusLabel(item.estadoRevision)}
                            </span>
                          </td>

                          <td
                            className={`px-5 py-3 ${
                              hasSumilla ? "text-gray-600" : "text-yellow-700"
                            }`}
                          >
                            <p className="line-clamp-2 leading-relaxed">
                              {item.sumilla}
                            </p>
                          </td>

                          <td className="px-5 py-3">
                            <div className="flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => setSelectedSyllabus(item)}
                                className="w-9 h-9 flex items-center justify-center text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                                title="Ver detalles"
                              >
                                <Eye size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredCatalog.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search className="text-gray-400" size={30} />
                  </div>

                  <p className="text-gray-500">
                    No se encontraron sílabos que coincidan con tu búsqueda.
                  </p>
                </div>
              )}
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Puedes exportar todo el catálogo o seleccionar sílabos específicos
              usando la casilla de la primera columna.
            </p>
          </div>
        </div>
      </div>

      {selectedSyllabus && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
            <div className="px-7 py-5 border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md">
                  <BookOpen size={24} />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedSyllabus.courseName}
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Código: {selectedSyllabus.courseCode} · Créditos:{" "}
                    {selectedSyllabus.credits}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Estado: {getStatusLabel(selectedSyllabus.estadoRevision)}
                  </p>

                  {selectedSyllabus.ciclo && (
                    <p className="text-xs text-gray-500 mt-1">
                      Ciclo: {selectedSyllabus.ciclo}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSyllabus(null)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-7 overflow-y-auto max-h-[60vh]">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Sumilla</h3>

              <p
                className={`leading-relaxed whitespace-pre-line ${
                  selectedSyllabus.sumilla === EMPTY_SUMILLA
                    ? "text-yellow-700"
                    : "text-gray-700"
                }`}
              >
                {selectedSyllabus.sumilla}
              </p>
            </div>

            <div className="px-7 py-5 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSyllabus(null)}
                className="h-11 px-6 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
