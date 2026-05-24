import { useState, useEffect } from "react";
import { Step } from "./step";
import { useSteps } from "../contexts/steps-context-provider";
import { useSyllabusContext } from "../contexts/syllabus-context";
import {
  Plus,
  X,
  BookOpen,
  Link,
  Library,
  Globe,
  Loader2,
  Info,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  useFuentesQuery,
  useCreateFuente,
  useDeleteFuente,
} from "../hooks/seventh-step-query";

interface Bibliography {
  id: number;
  authors: string;
  year: string;
  title: string;
}

interface ElectronicResource {
  id: number;
  source: string;
  year: string;
  url: string;
}

export default function SeventhStep() {
  const { nextStep } = useSteps();
  const { syllabusId } = useSyllabusContext();

  const { data: fuentesFromApi = [], isLoading } = useFuentesQuery(syllabusId);
  const createMutation = useCreateFuente();
  const deleteMutation = useDeleteFuente();

  const [bibliographies, setBibliographies] = useState<Bibliography[]>([]);
  const [electronicResources, setElectronicResources] = useState<
    ElectronicResource[]
  >([]);

  useEffect(() => {
    if (fuentesFromApi.length > 0) {
      const biblio: Bibliography[] = [];
      const electronic: ElectronicResource[] = [];

      fuentesFromApi.forEach((fuente) => {
        if (fuente.tipo === "LIBRO" || fuente.tipo === "ART") {
          biblio.push({
            id: fuente.id,
            authors: fuente.autores,
            year: fuente.anio.toString(),
            title: fuente.titulo,
          });
        } else if (fuente.tipo === "WEB") {
          electronic.push({
            id: fuente.id,
            source: fuente.autores,
            year: fuente.anio.toString(),
            url: fuente.doiUrl || fuente.titulo,
          });
        }
      });

      setBibliographies(biblio);
      setElectronicResources(electronic);
    }
  }, [fuentesFromApi]);

  const [newBiblio, setNewBiblio] = useState<Partial<Bibliography>>({
    authors: "",
    year: "",
    title: "",
  });

  const [newElectronic, setNewElectronic] = useState<
    Partial<ElectronicResource>
  >({
    source: "",
    year: "",
    url: "",
  });

  const handleNextStep = () => {
    console.log("Guardando bibliografías...", {
      bibliographies,
      electronicResources,
    });

    nextStep();
  };

  const handleAddBibliography = async () => {
    if (
      !syllabusId ||
      !newBiblio.authors ||
      !newBiblio.year ||
      !newBiblio.title
    ) {
      toast.error("Complete todos los campos");
      return;
    }

    try {
      const anio = parseInt(newBiblio.year);

      await createMutation.mutateAsync({
        silaboId: syllabusId,
        fuente: {
          tipo: "LIBRO",
          autores: newBiblio.authors,
          anio,
          titulo: newBiblio.title,
        },
      });

      setNewBiblio({ authors: "", year: "", title: "" });
      toast.success("Bibliografía agregada");
    } catch (error) {
      toast.error("Error al agregar bibliografía");
      console.log(error);
    }
  };

  const handleRemoveBibliography = async (id: number) => {
    if (!syllabusId) return;

    try {
      await deleteMutation.mutateAsync({ silaboId: syllabusId, fuenteId: id });
      toast.success("Bibliografía eliminada");
    } catch (error) {
      toast.error("Error al eliminar");
      console.log(error);
    }
  };

  const handleAddElectronic = async () => {
    if (!syllabusId || !newElectronic.source || !newElectronic.url) {
      toast.error("Complete los campos obligatorios");
      return;
    }

    try {
      const anio = newElectronic.year
        ? parseInt(newElectronic.year)
        : new Date().getFullYear();

      await createMutation.mutateAsync({
        silaboId: syllabusId,
        fuente: {
          tipo: "WEB",
          autores: newElectronic.source,
          anio,
          titulo: newElectronic.url,
          doiUrl: newElectronic.url,
        },
      });

      setNewElectronic({ source: "", year: "", url: "" });
      toast.success("Recurso electrónico agregado");
    } catch (error) {
      console.log(error);
      toast.error("Error al agregar recurso");
    }
  };

  const handleRemoveElectronic = async (id: number) => {
    if (!syllabusId) return;

    try {
      await deleteMutation.mutateAsync({ silaboId: syllabusId, fuenteId: id });
      toast.success("Recurso eliminado");
    } catch (error) {
      toast.error("Error al eliminar");
      console.log(error);
    }
  };

  const isMutating = createMutation.isPending || deleteMutation.isPending;

  const inputClass =
    "w-full h-11 rounded-xl px-4 bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent";

  if (isLoading) {
    return (
      <Step step={7} onNextStep={handleNextStep}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            Cargando fuentes de consulta...
          </div>
        </div>
      </Step>
    );
  }

  return (
    <Step step={7} onNextStep={handleNextStep}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md">
              <span className="text-2xl font-bold">7</span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Fuentes de Consulta
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Registra las referencias bibliográficas y recursos electrónicos
                del sílabo.
              </p>
            </div>

            <div className="ml-auto hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold">
              Referencias académicas
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-7 rounded-2xl border border-gray-100 bg-gray-50 p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Info size={20} />
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">
                    Información del paso
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Agrega libros, artículos y recursos web que respalden el
                    desarrollo de la asignatura.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Bibliográficas
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {bibliographies.length}
                  </p>
                </div>

                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Electrónicas
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {electronicResources.length}
                  </p>
                </div>

                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Total
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {bibliographies.length + electronicResources.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isMutating && (
            <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Procesando fuente de consulta...
            </div>
          )}

          <div className="space-y-7">
            <section className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
                      <Library size={22} />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        8.1 Bibliográficas
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Registra libros, artículos u otras referencias físicas o
                        académicas.
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold bg-white text-gray-700 border border-gray-100">
                    {bibliographies.length} registro
                    {bibliographies.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {bibliographies.length === 0 ? (
                  <div className="text-center py-10 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <BookOpen className="text-gray-400" size={26} />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">
                      No hay bibliografías registradas.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Completa el formulario inferior para agregar una.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bibliographies.map((biblio, index) => (
                      <div
                        key={biblio.id}
                        className="rounded-2xl border border-gray-100 bg-gray-50 p-4 hover:bg-white hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold text-sm shrink-0">
                              {index + 1}
                            </div>

                            <div className="space-y-2">
                              <p className="font-bold text-gray-900">
                                {biblio.title}
                              </p>

                              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                                <span className="inline-flex px-2 py-1 rounded-lg bg-white border border-gray-100">
                                  {biblio.authors}
                                </span>

                                <span className="inline-flex px-2 py-1 rounded-lg bg-white border border-gray-100">
                                  {biblio.year}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveBibliography(biblio.id)}
                            className="w-9 h-9 flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={deleteMutation.isPending}
                            title="Eliminar bibliografía"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_1.5fr_auto] gap-3">
                    <input
                      type="text"
                      placeholder="Autores"
                      value={newBiblio.authors}
                      onChange={(e) =>
                        setNewBiblio({
                          ...newBiblio,
                          authors: e.target.value,
                        })
                      }
                      className={inputClass}
                    />

                    <input
                      type="text"
                      placeholder="Año"
                      value={newBiblio.year}
                      onChange={(e) =>
                        setNewBiblio({
                          ...newBiblio,
                          year: e.target.value,
                        })
                      }
                      className={inputClass}
                    />

                    <input
                      type="text"
                      placeholder="Título y detalles"
                      value={newBiblio.title}
                      onChange={(e) =>
                        setNewBiblio({
                          ...newBiblio,
                          title: e.target.value,
                        })
                      }
                      className={inputClass}
                    />

                    <button
                      type="button"
                      onClick={handleAddBibliography}
                      className="h-11 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      disabled={createMutation.isPending}
                    >
                      <Plus size={18} />
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
                      <Globe size={22} />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        8.2 Electrónicas
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Registra enlaces web, repositorios, artículos digitales
                        o recursos en línea.
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold bg-white text-gray-700 border border-gray-100">
                    {electronicResources.length} registro
                    {electronicResources.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {electronicResources.length === 0 ? (
                  <div className="text-center py-10 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <FileText className="text-gray-400" size={26} />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">
                      No hay recursos electrónicos registrados.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Completa el formulario inferior para agregar uno.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {electronicResources.map((resource, index) => (
                      <div
                        key={resource.id}
                        className="rounded-2xl border border-gray-100 bg-gray-50 p-4 hover:bg-white hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold text-sm shrink-0">
                              {index + 1}
                            </div>

                            <div className="min-w-0">
                              <p className="font-bold text-gray-900">
                                {resource.source}
                              </p>

                              <div className="mt-2 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 break-all">
                                <Link size={15} className="shrink-0" />
                                <span>{resource.url}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveElectronic(resource.id)}
                            className="w-9 h-9 flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={deleteMutation.isPending}
                            title="Eliminar recurso"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_auto] gap-3">
                    <input
                      type="text"
                      placeholder="Fuente (Autor, año, título)"
                      value={newElectronic.source}
                      onChange={(e) =>
                        setNewElectronic({
                          ...newElectronic,
                          source: e.target.value,
                        })
                      }
                      className={inputClass}
                    />

                    <input
                      type="text"
                      placeholder="URL"
                      value={newElectronic.url}
                      onChange={(e) =>
                        setNewElectronic({
                          ...newElectronic,
                          url: e.target.value,
                        })
                      }
                      className={inputClass}
                    />

                    <button
                      type="button"
                      onClick={handleAddElectronic}
                      className="h-11 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      disabled={createMutation.isPending}
                    >
                      <Plus size={18} />
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Step>
  );
}