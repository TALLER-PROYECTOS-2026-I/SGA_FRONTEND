import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Step } from "./step";
import { CoordinatorCommentsBanner } from "./coordinator-comments-banner";
import { useSteps } from "../contexts/steps-context-provider";
import { useSyllabusContext } from "../contexts/syllabus-context";
import { usePermissionsContext } from "../hooks/use-permissions-context";
import { useSyllabusEditLock } from "../hooks/use-syllabus-edit-lock";
import { useReviewMode } from "../../coordinator/contexts/review-mode-context";
import {
  Plus,
  X,
  Pencil,
  BookOpen,
  Link,
  Library,
  Globe,
  Loader2,
  Info,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useFuentesQuery,
  useCreateFuente,
  useUpdateFuente,
  useDeleteFuente,
} from "../hooks/seventh-step-query";
import { useIsDraftCreateMode } from "../create-draft/is-draft-create";
import { useCreateDraft } from "../create-draft/create-draft-context";

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function parseValidYear(value: string | undefined, required = false) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    if (required) {
      throw new Error("Ingrese el año de publicación.");
    }

    return new Date().getFullYear();
  }

  const year = Number(raw);

  if (!Number.isInteger(year)) {
    throw new Error("Ingrese un año válido.");
  }

  if (year < 1900 || year > 2100) {
    throw new Error("El año debe estar entre 1900 y 2100.");
  }

  return year;
}

function normalizeFuenteTipo(tipo: unknown) {
  const value = String(tipo ?? "")
    .trim()
    .toUpperCase();

  if (value === "LIBRO") return "LIBRO";
  if (value === "ART") return "ART";
  if (value === "ARTICULO") return "ART";
  if (value === "OTRO") return "ART";
  if (value === "WEB") return "WEB";
  if (value === "RECURSO_ELECTRONICO") return "WEB";
  if (value === "RECURSO ELECTRONICO") return "WEB";

  return value;
}

interface Bibliography {
  id: number;
  tipo: "LIBRO" | "ART";
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

type EditForm = {
  kind: "biblio" | "electronic";
  tipo: "LIBRO" | "ART" | "WEB";
  authors: string;
  year: string;
  title: string;
  url?: string;
};

export default function SeventhStep() {
  const { nextStep } = useSteps();
  const { syllabusId } = useSyllabusContext();
  const { isDraftCreateMode } = useIsDraftCreateMode();
  const { draft, setSeventhStepData } = useCreateDraft();
  const nextLocalFuenteIdRef = useRef(-1);
  const hasHydratedDraftRef = useRef(false);
  const [searchParams] = useSearchParams();
  const {
    hasEditPermissionForSection,
    getCommentsForSection,
    isDisapprovedCorrection,
  } = usePermissionsContext();
  const coordinatorComments = getCommentsForSection(7);
  const { isReviewMode } = useReviewMode();

  const resolvedSyllabusId = useMemo(() => {
    const fromContext =
      syllabusId != null && Number(syllabusId) > 0 ? Number(syllabusId) : null;
    if (fromContext) return fromContext;

    const queryRaw = searchParams.get("syllabusId") ?? searchParams.get("id");
    const queryId = queryRaw ? Number(queryRaw) : NaN;
    if (Number.isFinite(queryId) && queryId > 0) return queryId;

    return null;
  }, [syllabusId, searchParams]);

  const { isLockedByState, isResolvingState } =
    useSyllabusEditLock(resolvedSyllabusId);

  const { data: fuentesFromApi, isLoading } = useFuentesQuery(
    isDraftCreateMode ? null : resolvedSyllabusId,
  );
  const createMutation = useCreateFuente();
  const updateMutation = useUpdateFuente();
  const deleteMutation = useDeleteFuente();

  const [editingFuenteId, setEditingFuenteId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  const [bibliographies, setBibliographies] = useState<Bibliography[]>([]);
  const [electronicResources, setElectronicResources] = useState<
    ElectronicResource[]
  >([]);

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

  const isMutating =
    !isDraftCreateMode &&
    (createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending);

  const canEdit =
    !isReviewMode &&
    hasEditPermissionForSection(7) &&
    !isLockedByState &&
    !isResolvingState;

  const inputsDisabled = !canEdit || isMutating;

  useEffect(() => {
    if (!isDraftCreateMode || hasHydratedDraftRef.current) return;

    if (draft.fuentes) {
      setBibliographies(draft.fuentes.bibliographies);
      setElectronicResources(draft.fuentes.electronicResources);
      hasHydratedDraftRef.current = true;
    }
  }, [isDraftCreateMode, draft.fuentes]);

  useEffect(() => {
    if (isDraftCreateMode) return;

    const rows = Array.isArray(fuentesFromApi) ? fuentesFromApi : [];

    const biblio: Bibliography[] = [];
    const electronic: ElectronicResource[] = [];

    rows.forEach((fuente) => {
      const tipo = normalizeFuenteTipo(fuente.tipo);
      const year =
        fuente.anio != null && !Number.isNaN(fuente.anio)
          ? String(fuente.anio)
          : "";

      if (tipo === "LIBRO" || tipo === "ART") {
        biblio.push({
          id: fuente.id,
          tipo: tipo as "LIBRO" | "ART",
          authors: fuente.autores,
          year,
          title: fuente.titulo,
        });
      } else if (tipo === "WEB") {
        electronic.push({
          id: fuente.id,
          source: fuente.autores,
          year,
          url: fuente.doiUrl || fuente.titulo,
        });
      }
    });

    setBibliographies(biblio);
    setElectronicResources(electronic);
  }, [fuentesFromApi, isDraftCreateMode]);

  const handleNextStep = () => {
    if (isDraftCreateMode && canEdit) {
      setSeventhStepData({
        bibliographies,
        electronicResources,
      });
    }

    nextStep();
  };

  const cancelEdit = () => {
    setEditingFuenteId(null);
    setEditForm(null);
  };

  const startEditBibliography = (biblio: Bibliography) => {
    setEditingFuenteId(biblio.id);
    setEditForm({
      kind: "biblio",
      tipo: biblio.tipo,
      authors: biblio.authors,
      year: biblio.year,
      title: biblio.title,
    });
  };

  const startEditElectronic = (resource: ElectronicResource) => {
    setEditingFuenteId(resource.id);
    setEditForm({
      kind: "electronic",
      tipo: "WEB",
      authors: resource.source,
      year: resource.year,
      title: resource.url,
      url: resource.url,
    });
  };

  const handleSaveEdit = async () => {
    if (!canEdit || !editingFuenteId || !editForm) return;

    if (isDraftCreateMode) {
      try {
        if (editForm.kind === "biblio") {
          if (
            !editForm.authors.trim() ||
            !editForm.year.trim() ||
            !editForm.title.trim()
          ) {
            toast.error(
              "Complete autor, año y título de la fuente bibliográfica.",
            );
            return;
          }

          parseValidYear(editForm.year, true);

          setBibliographies((prev) =>
            prev.map((item) =>
              item.id === editingFuenteId
                ? {
                    ...item,
                    tipo: editForm.tipo === "ART" ? "ART" : "LIBRO",
                    authors: editForm.authors.trim(),
                    year: editForm.year.trim(),
                    title: editForm.title.trim(),
                  }
                : item,
            ),
          );
        } else {
          const url = (editForm.url ?? editForm.title).trim();

          if (!editForm.authors.trim() || !url) {
            toast.error("Complete la fuente y la URL del recurso electrónico.");
            return;
          }

          if (!isValidUrl(url)) {
            toast.error("Ingrese una URL válida. Ejemplo: https://...");
            return;
          }

          parseValidYear(editForm.year, false);

          setElectronicResources((prev) =>
            prev.map((item) =>
              item.id === editingFuenteId
                ? {
                    ...item,
                    source: editForm.authors.trim(),
                    year: editForm.year.trim(),
                    url,
                  }
                : item,
            ),
          );
        }

        cancelEdit();
        toast.success("Fuente actualizada");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Error al actualizar la fuente",
        );
      }
      return;
    }

    if (!resolvedSyllabusId) return;

    try {
      if (editForm.kind === "biblio") {
        if (
          !editForm.authors.trim() ||
          !editForm.year.trim() ||
          !editForm.title.trim()
        ) {
          toast.error(
            "Complete autor, año y título de la fuente bibliográfica.",
          );
          return;
        }

        const anio = parseValidYear(editForm.year, true);

        await updateMutation.mutateAsync({
          silaboId: resolvedSyllabusId,
          fuenteId: editingFuenteId,
          fuente: {
            tipo: editForm.tipo === "ART" ? "ART" : "LIBRO",
            autores: editForm.authors.trim(),
            anio,
            titulo: editForm.title.trim(),
          },
        });
      } else {
        const url = (editForm.url ?? editForm.title).trim();

        if (!editForm.authors.trim() || !url) {
          toast.error("Complete la fuente y la URL del recurso electrónico.");
          return;
        }

        if (!isValidUrl(url)) {
          toast.error("Ingrese una URL válida. Ejemplo: https://...");
          return;
        }

        const anio = parseValidYear(editForm.year, false);

        await updateMutation.mutateAsync({
          silaboId: resolvedSyllabusId,
          fuenteId: editingFuenteId,
          fuente: {
            tipo: "WEB",
            autores: editForm.authors.trim(),
            anio,
            titulo: url,
            doiUrl: url,
          },
        });
      }

      cancelEdit();
      toast.success("Fuente actualizada");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al actualizar la fuente",
      );
    }
  };

  const handleAddBibliography = async () => {
    if (!canEdit) return;

    if (
      !newBiblio.authors?.trim() ||
      !newBiblio.year?.trim() ||
      !newBiblio.title?.trim()
    ) {
      toast.error("Complete autor, año y título de la fuente bibliográfica.");
      return;
    }

    try {
      const anio = parseValidYear(newBiblio.year, true);

      if (isDraftCreateMode) {
        const id = nextLocalFuenteIdRef.current;
        nextLocalFuenteIdRef.current -= 1;

        setBibliographies((prev) => [
          ...prev,
          {
            id,
            tipo: "LIBRO",
            authors: newBiblio.authors!.trim(),
            year: newBiblio.year!.trim(),
            title: newBiblio.title!.trim(),
          },
        ]);
        setNewBiblio({ authors: "", year: "", title: "" });
        toast.success("Bibliografía agregada");
        return;
      }

      if (!resolvedSyllabusId) return;

      await createMutation.mutateAsync({
        silaboId: resolvedSyllabusId,
        fuente: {
          tipo: "LIBRO",
          autores: newBiblio.authors.trim(),
          anio,
          titulo: newBiblio.title.trim(),
        },
      });

      setNewBiblio({ authors: "", year: "", title: "" });
      toast.success("Bibliografía agregada");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al agregar bibliografía",
      );
    }
  };

  const handleRemoveBibliography = async (id: number) => {
    if (!canEdit) return;

    const confirmed = window.confirm(
      "¿Deseas eliminar esta fuente de consulta?",
    );
    if (!confirmed) return;

    if (editingFuenteId === id) cancelEdit();

    if (isDraftCreateMode) {
      setBibliographies((prev) => prev.filter((item) => item.id !== id));
      toast.success("Bibliografía eliminada");
      return;
    }

    if (!resolvedSyllabusId) return;

    try {
      await deleteMutation.mutateAsync({
        silaboId: resolvedSyllabusId,
        fuenteId: id,
      });
      toast.success("Bibliografía eliminada");
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleAddElectronic = async () => {
    if (!canEdit) return;

    if (!newElectronic.source?.trim() || !newElectronic.url?.trim()) {
      toast.error("Complete la fuente y la URL del recurso electrónico.");
      return;
    }

    const url = newElectronic.url.trim();

    if (!isValidUrl(url)) {
      toast.error("Ingrese una URL válida. Ejemplo: https://...");
      return;
    }

    try {
      const anio = parseValidYear(newElectronic.year, false);

      if (isDraftCreateMode) {
        const id = nextLocalFuenteIdRef.current;
        nextLocalFuenteIdRef.current -= 1;

        setElectronicResources((prev) => [
          ...prev,
          {
            id,
            source: newElectronic.source!.trim(),
            year: newElectronic.year?.trim() || String(anio),
            url,
          },
        ]);
        setNewElectronic({ source: "", year: "", url: "" });
        toast.success("Recurso electrónico agregado");
        return;
      }

      if (!resolvedSyllabusId) return;

      await createMutation.mutateAsync({
        silaboId: resolvedSyllabusId,
        fuente: {
          tipo: "WEB",
          autores: newElectronic.source.trim(),
          anio,
          titulo: url,
          doiUrl: url,
        },
      });

      setNewElectronic({ source: "", year: "", url: "" });
      toast.success("Recurso electrónico agregado");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al agregar recurso",
      );
    }
  };

  const handleRemoveElectronic = async (id: number) => {
    if (!canEdit) return;

    const confirmed = window.confirm(
      "¿Deseas eliminar esta fuente de consulta?",
    );
    if (!confirmed) return;

    if (editingFuenteId === id) cancelEdit();

    if (isDraftCreateMode) {
      setElectronicResources((prev) => prev.filter((item) => item.id !== id));
      toast.success("Recurso eliminado");
      return;
    }

    if (!resolvedSyllabusId) return;

    try {
      await deleteMutation.mutateAsync({
        silaboId: resolvedSyllabusId,
        fuenteId: id,
      });
      toast.success("Recurso eliminado");
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const disabledInputClass =
    "disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-70";

  const inputClass = `w-full h-11 rounded-xl px-4 bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent ${disabledInputClass}`;

  if (!isDraftCreateMode && isLoading) {
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
          <CoordinatorCommentsBanner
            stepNumber={7}
            comments={coordinatorComments}
          />

          {!canEdit && (
            <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500 text-white flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>

              <div>
                <p className="text-sm font-bold text-yellow-800">
                  Modo solo lectura
                </p>

                <p className="text-sm text-yellow-700 mt-1">
                  {isDisapprovedCorrection
                    ? "Esta sección no tiene observaciones del coordinador, por eso permanece bloqueada."
                    : "No tienes permiso para editar esta sección. Puedes revisar las fuentes de consulta, pero no modificarlas."}
                </p>
              </div>
            </div>
          )}

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
                      {canEdit
                        ? "Completa el formulario inferior para agregar una."
                        : "Esta sección está disponible solo para lectura."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bibliographies.map((biblio, index) => (
                      <div
                        key={biblio.id}
                        className="rounded-2xl border border-gray-100 bg-gray-50 p-4 hover:bg-white hover:shadow-sm transition-all"
                      >
                        {editingFuenteId === biblio.id &&
                        editForm?.kind === "biblio" ? (
                          <div className="space-y-3">
                            <p className="text-sm font-semibold text-gray-700">
                              Editar bibliografía
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <input
                                type="text"
                                placeholder="Autores"
                                value={editForm.authors}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    authors: e.target.value,
                                  })
                                }
                                className={inputClass}
                                disabled={inputsDisabled}
                              />
                              <input
                                type="text"
                                placeholder="Año"
                                value={editForm.year}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    year: e.target.value,
                                  })
                                }
                                className={inputClass}
                                disabled={inputsDisabled}
                              />
                              <input
                                type="text"
                                placeholder="Título y detalles"
                                value={editForm.title}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    title: e.target.value,
                                  })
                                }
                                className={inputClass}
                                disabled={inputsDisabled}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleSaveEdit}
                                className="h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                                disabled={inputsDisabled}
                              >
                                Guardar cambios
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
                                disabled={inputsDisabled}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
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

                            <div className="flex gap-2 shrink-0">
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => startEditBibliography(biblio)}
                                  className="w-9 h-9 flex items-center justify-center text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  disabled={
                                    inputsDisabled || editingFuenteId !== null
                                  }
                                  title="Editar bibliografía"
                                >
                                  <Pencil size={16} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveBibliography(biblio.id)
                                }
                                className="w-9 h-9 flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                disabled={inputsDisabled}
                                title="Eliminar bibliografía"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          </div>
                        )}
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
                      disabled={inputsDisabled}
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
                      disabled={inputsDisabled}
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
                      disabled={inputsDisabled}
                    />

                    <button
                      type="button"
                      onClick={handleAddBibliography}
                      className="h-11 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={inputsDisabled}
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
                      {canEdit
                        ? "Completa el formulario inferior para agregar uno."
                        : "Esta sección está disponible solo para lectura."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {electronicResources.map((resource, index) => (
                      <div
                        key={resource.id}
                        className="rounded-2xl border border-gray-100 bg-gray-50 p-4 hover:bg-white hover:shadow-sm transition-all"
                      >
                        {editingFuenteId === resource.id &&
                        editForm?.kind === "electronic" ? (
                          <div className="space-y-3">
                            <p className="text-sm font-semibold text-gray-700">
                              Editar recurso electrónico
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                type="text"
                                placeholder="Fuente (Autor, año, título)"
                                value={editForm.authors}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    authors: e.target.value,
                                  })
                                }
                                className={inputClass}
                                disabled={inputsDisabled}
                              />
                              <input
                                type="text"
                                placeholder="URL"
                                value={editForm.url ?? editForm.title}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    url: e.target.value,
                                    title: e.target.value,
                                  })
                                }
                                className={inputClass}
                                disabled={inputsDisabled}
                              />
                              <input
                                type="text"
                                placeholder="Año (opcional)"
                                value={editForm.year}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    year: e.target.value,
                                  })
                                }
                                className={inputClass}
                                disabled={inputsDisabled}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleSaveEdit}
                                className="h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                                disabled={inputsDisabled}
                              >
                                Guardar cambios
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
                                disabled={inputsDisabled}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
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

                            <div className="flex gap-2 shrink-0">
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => startEditElectronic(resource)}
                                  className="w-9 h-9 flex items-center justify-center text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  disabled={
                                    inputsDisabled || editingFuenteId !== null
                                  }
                                  title="Editar recurso"
                                >
                                  <Pencil size={16} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveElectronic(resource.id)
                                }
                                className="w-9 h-9 flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                disabled={inputsDisabled}
                                title="Eliminar recurso"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          </div>
                        )}
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
                      disabled={inputsDisabled}
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
                      disabled={inputsDisabled}
                    />

                    <button
                      type="button"
                      onClick={handleAddElectronic}
                      className="h-11 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={inputsDisabled}
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
