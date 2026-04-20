import { useState, useMemo } from "react";
import { Step } from "./step";
import { useSteps } from "../contexts/steps-context-provider";
import { useSyllabusContext } from "../contexts/syllabus-context";
import {
  useGetConceptos,
  useCrearConcepto,
  useEliminarConcepto,
  useActualizarConcepto, // <-- Importamos el nuevo Hook
} from "../hooks/use-conceptos-query";

export default function SecondStep() {
  const { nextStep } = useSteps();
  const { syllabusId: contextSyllabusId } = useSyllabusContext();
  const syllabusId = contextSyllabusId || 2; 

  const [semana, setSemana] = useState<number>(1);
  const [descripcion, setDescripcion] = useState("");

  // ESTADOS PARA LA EDICIÓN INLINE
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const unidadId = useMemo(() => {
    if (semana >= 1 && semana <= 4) return 1;
    if (semana >= 5 && semana <= 8) return 2;
    if (semana >= 9 && semana <= 12) return 3;
    return 4;
  }, [semana]);

  const { data: conceptos = [], isLoading } = useGetConceptos(syllabusId, unidadId, semana);
  const { mutateAsync: crearConcepto, isPending: isCreating } = useCrearConcepto(syllabusId, unidadId, semana);
  const { mutateAsync: eliminarConcepto, isPending: isDeleting } = useEliminarConcepto(syllabusId, unidadId, semana);
  const { mutateAsync: actualizarConcepto, isPending: isUpdating } = useActualizarConcepto(syllabusId, unidadId, semana);

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
    if (window.confirm("¿Seguro que deseas eliminar este contenido conceptual?")) {
      await eliminarConcepto(id);
    }
  };

  // FUNCIONES DE EDICIÓN
  const startEditing = (item: any) => {
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
      setEditingId(null); // Cerramos el modo edición al terminar
    } catch (error) {
      console.error("Error al actualizar:", error);
    }

    setConceptosLocales((prev) => ({
      ...prev,
      [semana]: (prev[semana] ?? []).map((item) =>
        item.id === id ? { ...item, descripcion: editText.trim() } : item,
      ),
    }));

    setEditingId(null);
    setEditText("");
  };

  const handleWeekChange = (newWeek: number) => {
    setSemana(newWeek);
    setDescripcion("");
    setEditingId(null);
    setEditText("");
  };

  return (
    <Step step={2} onNextStep={nextStep}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#b91c1c] text-white flex items-center justify-center font-bold">
            2
          </div>
          <h2 className="text-xl font-bold text-[#b91c1c]">Contenidos Conceptuales</h2>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* COLUMNA IZQUIERDA */}
          <div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Seleccione una semana</label>
              <select
                className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-[#b91c1c] focus:border-[#b91c1c] text-sm"
                value={semana}
                onChange={(e) => {
                  setSemana(Number(e.target.value));
                  setDescripcion("");
                  setEditingId(null); // Cancelar edición si cambia de semana
                }}
              >
                {Array.from({ length: 16 }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s}>Semana {s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contenidos Conceptuales</label>
              <div className="relative">
                <textarea
                  className="w-full border border-gray-300 rounded-md p-3 h-32 resize-none focus:ring-[#b91c1c] focus:border-[#b91c1c] text-sm"
                  maxLength={400}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Escriba el contenido de esta semana..."
                />
                <div className="absolute bottom-3 right-4 text-xs text-gray-400 font-medium">
                  {descripcion.length}/400
                </div>
                
                <button
                  onClick={handleAdd}
                  disabled={!descripcion.trim() || isCreating}
                  className="absolute bottom-[-18px] right-[-15px] w-12 h-12 bg-[#b91c1c] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-800 disabled:opacity-50 text-2xl pb-1 cursor-pointer z-10 transition-transform hover:scale-105"
                  title="Agregar contenido"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Lista de Contenidos conceptuales</h3>
              <span className="bg-[#2563eb] text-white text-xs px-4 py-1 rounded-full font-medium">
                Semana {semana}
              </span>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <p className="text-gray-500 text-sm text-center py-4">Cargando contenidos...</p>
              ) : conceptos.length === 0 ? (
                <p className="text-gray-400 text-sm italic text-center py-4">No hay contenidos registrados en esta semana.</p>
              ) : (
                conceptos.map((item: any, index: number) => {
                  
                  // SI ESTAMOS EDITANDO ESTE ITEM, MOSTRAMOS LA CAJA DE EDICIÓN (Diseño Figma)
                  if (editingId === item.id) {
                    return (
                      <div key={item.id} className="flex flex-col border-2 border-blue-500 rounded-lg p-3 bg-white gap-3 shadow-sm transition-all">
                        <textarea
                          className="w-full border-none rounded-md p-0 text-sm text-gray-700 resize-none focus:ring-0 leading-relaxed"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={2}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-1">
                          <button 
                            onClick={cancelEditing} 
                            className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-300 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button 
                            onClick={() => handleSaveEdit(item.id)} 
                            disabled={isUpdating} 
                            className="px-4 py-1.5 bg-[#b91c1c] text-white rounded-md text-sm font-semibold hover:bg-red-800 disabled:opacity-50 transition-colors"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // SI NO LO ESTAMOS EDITANDO, MOSTRAMOS LA VISTA NORMAL
                  return (
                    <div key={item.id} className="flex border border-blue-200 rounded-md bg-blue-50/50 p-3 items-start gap-3 group transition-colors hover:bg-blue-50">
                      <div className="w-6 h-6 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-xs shrink-0 mt-0.5 font-medium shadow-sm">
                        {index + 1}
                      </div>
                      <p className="text-sm text-gray-700 flex-1 leading-relaxed">{item.descripcion}</p>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          className="text-blue-600 hover:text-blue-800 p-1" 
                          onClick={() => startEditing(item)}
                          title="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-800 p-1"
                          onClick={() => handleDelete(item.id)}
                          disabled={isDeleting || editingId !== null}
                          title="Eliminar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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