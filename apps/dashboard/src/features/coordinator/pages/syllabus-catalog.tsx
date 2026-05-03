import { useEffect, useMemo, useState } from "react";
import { Search, Eye, Loader2 } from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7071/api";

interface SyllabusCatalogItem {
  id: string;
  courseName: string;
  courseCode: string;
  sumilla: string;
  credits: number;
}

export default function SyllabusCatalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [catalog, setCatalog] = useState<SyllabusCatalogItem[]>([]);
  const [selectedSyllabus, setSelectedSyllabus] =
    useState<SyllabusCatalogItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setIsLoading(true);
        setError("");

        const res = await fetch(`${API_BASE}/syllabus/revision`);

        if (!res.ok) {
          throw new Error(await res.text());
        }

        const json = await res.json();
        const syllabuses = Array.isArray(json)
          ? json
          : Array.isArray(json.data)
            ? json.data
            : [];

        const items = await Promise.all(
          syllabuses.map(async (item: any) => {
            const syllabusId = item.syllabusId ?? item.silaboId ?? item.id;

            try {
              const completeRes = await fetch(
                `${API_BASE}/syllabus/${syllabusId}/complete`,
              );

              if (!completeRes.ok) {
                throw new Error("No se pudo cargar el sílabo completo");
              }

              const completeJson = await completeRes.json();
              const complete = completeJson.data ?? completeJson;

              const datos = complete.datosGenerales ?? {};
              const creditos =
                Number(datos.creditosTeoria ?? 0) +
                Number(datos.creditosPractica ?? 0);

              return {
                id: String(syllabusId),
                courseName:
                  datos.nombreAsignatura ??
                  item.cursoNombre ??
                  "Sin nombre",
                courseCode:
                  datos.codigoAsignatura ??
                  item.cursoCodigo ??
                  "Sin código",
                sumilla:
                  complete.sumilla ??
                  "Este sílabo aún no tiene sumilla registrada.",
                credits: creditos,
              };
            } catch {
              return {
                id: String(syllabusId),
                courseName: item.cursoNombre ?? "Sin nombre",
                courseCode: item.cursoCodigo ?? "Sin código",
                sumilla: "Este sílabo aún no tiene sumilla registrada.",
                credits: 0,
              };
            }
          }),
        );

        setCatalog(items);
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

    loadCatalog();
  }, []);

  const filteredCatalog = useMemo(() => {
    return catalog.filter(
      (item) =>
        item.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.courseCode.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [catalog, searchTerm]);

  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-600 flex items-center justify-center gap-2">
        <Loader2 className="animate-spin" size={20} />
        Cargando catálogo de sumillas...
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Catálogo de Sumilla
        </h1>

        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar por curso o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredCatalog.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {item.courseName}
                </h3>

                <p className="text-sm text-gray-600 mb-2">
                  Código: {item.courseCode} | Créditos: {item.credits}
                </p>

                <p className="text-sm text-gray-700 line-clamp-2">
                  {item.sumilla}
                </p>
              </div>

              <button
                onClick={() => setSelectedSyllabus(item)}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors ml-4"
                title="Ver detalles"
              >
                <Eye size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCatalog.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No se encontraron cursos que coincidan con tu búsqueda.
        </div>
      )}

      {selectedSyllabus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {selectedSyllabus.courseName}
              </h2>
              <p className="text-sm text-gray-600">
                Código: {selectedSyllabus.courseCode} | Créditos:{" "}
                {selectedSyllabus.credits}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Sumilla
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {selectedSyllabus.sumilla}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedSyllabus(null)}
                className="px-6 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
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