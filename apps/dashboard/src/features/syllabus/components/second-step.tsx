import { useState, useMemo } from "react";
import { Step } from "./step";
import { useSteps } from "../contexts/steps-context-provider";
import { useSyllabusContext } from "../contexts/syllabus-context";
import {
  useGetConceptos,
  useCrearConcepto,
  useEliminarConcepto,
  useActualizarConcepto,
} from "../hooks/use-conceptos-query";

type ConceptoItem = {
  id: number;
  descripcion: string;
};

export default function SecondStep() {
  const { nextStep } = useSteps();
  const { syllabusId: contextSyllabusId } = useSyllabusContext();
  const syllabusId = contextSyllabusId || 2;

  const [semana, setSemana] = useState<number>(1);
  const [descripcion, setDescripcion] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const unidadId = useMemo(() => {
    if (semana >= 1 && semana <= 4) return 1;
    if (semana >= 5 && semana <= 8) return 2;
    if (semana >= 9 && semana <= 12) return 3;
    return 4;
  }, [semana]);

  const { data, isLoading } = useGetConceptos(syllabusId, unidadId, semana);

  const conceptos: ConceptoItem[] = Array.isArray(data)
    ? data
    : (data?.items ?? []);

  const { mutateAsync: crearConcepto, isPending: isCreating } =
    useCrearConcepto(syllabusId, unidadId, semana);
  const { mutateAsync: eliminarConcepto, isPending: isDeleting } =
    useEliminarConcepto(syllabusId, unidadId, semana);
  const { mutateAsync: actualizarConcepto, isPending: isUpdating } =
    useActualizarConcepto(syllabusId, unidadId, semana);

  const handleAdd = async () => {
    if (!descripcion.trim()) return;

    try {
      await crearConcepto(descripcion);
      setDescripcion("");
    } catch (error) {
      console.error("Error al crear concepto:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      window.confirm("¿Seguro que deseas eliminar este contenido conceptual?")
    ) {
      await eliminarConcepto(id);
    }
  };

  const startEditing = (item: ConceptoItem) => {
    setEditingId(item.id);
    setEditText(item.descripcion);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleSaveEdit = async (id: number) => {
    if (!editText.trim()) return;

    try {
      await actualizarConcepto({ contenidoId: id, descripcion: editText });
      setEditingId(null);
      setEditText("");
    } catch (error) {
      console.error("Error al actualizar:", error);
    }
  };

  return (
    <Step step={2} onNextStep={nextStep}>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#b91c1c] font-bold text-white">
            2
          </div>
          <h2 className="text-xl font-bold text-[#b91c1c]">
            Contenidos Conceptuales
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-10 p-8 md:grid-cols-2">
          <div>
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Seleccione una semana
              </label>
              <select
                className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:border-[#b91c1c] focus:ring-[#b91c1c]"
                value={semana}
                onChange={(e) => {
                  setSemana(Number(e.target.value));
                  setDescripcion("");
                  setEditingId(null);
                }}
              >
                {Array.from({ length: 16 }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s}>
                    Semana {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Contenidos Conceptuales
              </label>
              <div className="relative">
                <textarea
                  className="h-32 w-full resize-none rounded-md border border-gray-300 p-3 text-sm focus:border-[#b91c1c] focus:ring-[#b91c1c]"
                  maxLength={400}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Escriba el contenido de esta semana..."
                />
                <div className="absolute bottom-3 right-4 text-xs font-medium text-gray-400">
                  {descripcion.length}/400
                </div>

                <button
                  onClick={handleAdd}
                  disabled={!descripcion.trim() || isCreating}
                  className="absolute bottom-[-18px] right-[-15px] z-10 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#b91c1c] pb-1 text-2xl text-white shadow-lg transition-transform hover:scale-105 hover:bg-red-800 disabled:opacity-50"
                  title="Agregar contenido"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                Lista de Contenidos conceptuales
              </h3>
              <span className="rounded-full bg-[#2563eb] px-4 py-1 text-xs font-medium text-white">
                Semana {semana}
              </span>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <p className="py-4 text-center text-sm text-gray-500">
                  Cargando contenidos...
                </p>
              ) : conceptos.length === 0 ? (
                <p className="py-4 text-center text-sm italic text-gray-400">
                  No hay contenidos registrados en esta semana.
                </p>
              ) : (
                conceptos.map((item: ConceptoItem, index: number) => {
                  if (editingId === item.id) {
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 rounded-lg border-2 border-blue-500 bg-white p-3 shadow-sm transition-all"
                      >
                        <textarea
                          className="w-full resize-none rounded-md border-none p-0 text-sm leading-relaxed text-gray-700 focus:ring-0"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={2}
                          autoFocus
                        />
                        <div className="mt-1 flex justify-end gap-2">
                          <button
                            onClick={cancelEditing}
                            className="rounded-md bg-gray-200 px-4 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-300"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            disabled={isUpdating}
                            className="rounded-md bg-[#b91c1c] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-50"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className="group flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50/50 p-3 transition-colors hover:bg-blue-50"
                    >
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-xs font-medium text-white shadow-sm">
                        {index + 1}
                      </div>

                      <p className="flex-1 text-sm leading-relaxed text-gray-700">
                        {item.descripcion}
                      </p>

                      <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          className="p-1 text-blue-600 hover:text-blue-800"
                          onClick={() => startEditing(item)}
                          title="Editar"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                          </svg>
                        </button>

                        <button
                          className="p-1 text-red-600 hover:text-red-800"
                          onClick={() => handleDelete(item.id)}
                          disabled={isDeleting || editingId !== null}
                          title="Eliminar"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </Step>
  );
}
