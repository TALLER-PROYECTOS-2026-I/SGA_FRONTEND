import { useState, useEffect, useRef } from "react";
import { useSteps } from "../contexts/steps-context-provider";
import { useSyllabusContext } from "../contexts/syllabus-context";
import { Step } from "./step";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useThirdStepData,
  useUpdateCompetencias,
  useUpdateActitudes,
  useUpdateComponentes,
  useSaveCompetencias,
  useSaveActitudes,
} from "../hooks/third-step-query";

interface CompetenciaItem {
  id: string;
  text: string;
  code: string;
}

interface ComponenteItem {
  id: string;
  text: string;
  code: string;
}

interface ContenidoActitudinalItem {
  id: string;
  text: string;
  code: string;
}

interface FormData {
  competencias: CompetenciaItem[];
  componentes: ComponenteItem[];
  contenidosActitudinales: ContenidoActitudinalItem[];
}

export default function ThirdStep() {
  const { nextStep } = useSteps();
  const { syllabusId, courseName } = useSyllabusContext();
  console.log("Syllabus ID in ThirdStep:", syllabusId, "Course:", courseName);

  // Obtener datos del backend
  const { data: thirdStepData, isLoading } = useThirdStepData(
    syllabusId ? Number(syllabusId) : null,
  );

  // Hooks de mutación - UPDATE (PUT) - Para sincronización completa
  const updateCompetencias = useUpdateCompetencias();
  const updateComponentes = useUpdateComponentes();
  const updateActitudes = useUpdateActitudes();

  // Hooks de mutación - CREATE (POST) - Solo para primera creación
  const createCompetencias = useSaveCompetencias();
  const createActitudes = useSaveActitudes();

  const [formData, setFormData] = useState<FormData>({
    competencias: [],
    componentes: [],
    contenidosActitudinales: [],
  });

  // Guardar datos originales para detectar cambios
  const originalDataRef = useRef<FormData>({
    competencias: [],
    componentes: [],
    contenidosActitudinales: [],
  });

  // Cargar datos del backend cuando estén disponibles
  useEffect(() => {
    if (thirdStepData) {
      console.log("📊 Datos del backend recibidos:", thirdStepData);

      const mappedData = {
        competencias: thirdStepData.competenciasPrincipales.map((item) => ({
          id: String(item.id || `temp-${Date.now()}`),
          text: item.text,
          code: item.code || "",
        })),
        componentes: thirdStepData.componentes.map((item) => ({
          id: String(item.id || `temp-${Date.now()}`),
          text: item.text,
          code: item.code || "",
        })),
        contenidosActitudinales: thirdStepData.actitudinales.map((item) => ({
          id: String(item.id || `temp-${Date.now()}`),
          text: item.text,
          code: item.code || "",
        })),
      };

      console.log("✅ Datos mapeados para el formulario:", mappedData);
      setFormData(mappedData);
      originalDataRef.current = JSON.parse(JSON.stringify(mappedData));
    }
  }, [thirdStepData]);

  // Agregar item con ID temporal
  const addItem = (section: keyof FormData) => {
    const newId = `temp-${Date.now()}`;

    // Asignar código por defecto según la sección
    let defaultCode = "";
    if (section === "componentes") {
      // Para componentes, usar formato g.1, a.1, etc.
      const nextIndex = formData[section].length + 1;
      defaultCode = `g.${nextIndex}`;
    } else if (section === "contenidosActitudinales") {
      // Para actitudinales, usar una letra sola
      const nextIndex = formData[section].length;
      const letter = String.fromCharCode(65 + (nextIndex % 26)); // A, B, C...
      defaultCode = letter;
    } else {
      // Para competencias, permitir código vacío o asignar uno por defecto
      defaultCode = "A";
    }

    setFormData((prev) => ({
      ...prev,
      [section]: [...prev[section], { id: newId, text: "", code: defaultCode }],
    }));
  };

  // Eliminar item
  const removeItem = (section: keyof FormData, id: string) => {
    setFormData((prev) => ({
      ...prev,
      [section]: prev[section].filter((item) => item.id !== id),
    }));
  };

  // Actualizar texto del item
  const updateItem = (section: keyof FormData, id: string, text: string) => {
    setFormData((prev) => ({
      ...prev,
      [section]: prev[section].map((item) =>
        item.id === id ? { ...item, text } : item,
      ),
    }));
  };

  // Actualizar código del item
  const updateItemCode = (
    section: keyof FormData,
    id: string,
    code: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: prev[section].map((item) =>
        item.id === id ? { ...item, code } : item,
      ),
    }));
  };

  // Detectar cambios reales en el contenido
  const hasRealChanges = (section: keyof FormData): boolean => {
    const current = formData[section];
    const original = originalDataRef.current[section];

    if (current.length !== original.length) return true;

    for (let i = 0; i < current.length; i++) {
      const curr = current[i];
      const orig = original[i];

      if (curr.text !== orig?.text || curr.code !== orig?.code) {
        return true;
      }
    }

    return false;
  };

  // Determinar si es operación de creación (POST) o actualización (PUT)
  const isCreateOperation = (section: keyof FormData): boolean => {
    // Si no hay datos originales del backend
    if (originalDataRef.current[section].length === 0) return true;

    // Si todos los items son temporales (nuevos)
    const allTemporary = formData[section].every((item) =>
      item.id.startsWith("temp-"),
    );

    return allTemporary;
  };

  // Detectar si se eliminaron todos los items
  const wereAllItemsDeleted = (section: keyof FormData): boolean => {
    const hadOriginalData = originalDataRef.current[section].length > 0;
    const hasCurrentData = formData[section].length > 0;

    return hadOriginalData && !hasCurrentData;
  };

  // Manejar el envío del formulario
  const handleSubmit = async () => {
    if (!syllabusId) {
      toast.error("No se encontró el ID del sílabo");
      return;
    }

    const numSyllabusId = Number(syllabusId);
    const promises: Promise<{ message?: string }>[] = [];
    let toastId: string | number | undefined;

    try {
      // ========== 1. COMPETENCIAS ==========
      if (hasRealChanges("competencias")) {
        const isCreate = isCreateOperation("competencias");
        const allDeleted = wereAllItemsDeleted("competencias");

        console.log(
          `🔄 Competencias: ${allDeleted ? "PUT con items:[] (eliminar todos)" : isCreate ? "POST (crear)" : "PUT (sincronizar)"}`,
        );

        // Si NO hay datos originales Y NO hay items actuales -> no hacer nada (nunca se creó)
        if (
          originalDataRef.current["competencias"].length === 0 &&
          formData.competencias.length === 0
        ) {
          console.log("⚠️ No hay competencias para crear ni sincronizar");
        } else {
          const competenciasPayload = {
            items: formData.competencias.map((item, index) => {
              // Para competencias, permitir código vacío o validar formato
              // Si hay código, usarlo; si no, generar uno por defecto
              const validCode =
                item.code && item.code.trim() !== ""
                  ? item.code.trim()
                  : String.fromCharCode(65 + (index % 26)); // A, B, C... por defecto

              const baseItem = {
                text: item.text,
                code: validCode,
                order: index + 1,
              };

              // Incluir ID solo si no es temporal y estamos actualizando
              if (!isCreate && !item.id.startsWith("temp-")) {
                return { ...baseItem, id: Number(item.id) };
              }

              return baseItem;
            }),
          };

          if (isCreate) {
            promises.push(
              createCompetencias.mutateAsync({
                syllabusId: numSyllabusId,
                data: competenciasPayload,
              }),
            );
          } else {
            // Usar PUT para sincronizar (incluso con items:[] para eliminar todos)
            promises.push(
              updateCompetencias.mutateAsync({
                syllabusId: numSyllabusId,
                data: competenciasPayload,
              }),
            );
          }
        }
      }

      // ========== 2. COMPONENTES (siempre usar PUT) ==========
      if (hasRealChanges("componentes")) {
        const allDeleted = wereAllItemsDeleted("componentes");

        console.log(
          `🔄 Componentes: ${allDeleted ? "PUT con items:[] (eliminar todos)" : "PUT (sincronizar)"}`,
        );

        // Si NO hay datos originales Y NO hay items actuales -> no hacer nada
        if (
          originalDataRef.current["componentes"].length === 0 &&
          formData.componentes.length === 0
        ) {
          console.log("⚠️ No hay componentes para crear ni sincronizar");
        } else {
          const componentesPayload = {
            items: formData.componentes.map((item, index) => {
              // Validar o generar código en formato g.1, a.2, etc.
              const codePattern = /^[a-zA-Z]\.\d+$/;
              const validCode =
                item.code && codePattern.test(item.code.trim())
                  ? item.code.trim()
                  : `g.${index + 1}`; // Generar código por defecto si está vacío o inválido

              const baseItem = {
                text: item.text,
                code: validCode,
                order: index + 1,
              };

              // Incluir ID si no es temporal
              if (!item.id.startsWith("temp-")) {
                return { ...baseItem, id: Number(item.id) };
              }

              return baseItem;
            }),
          };

          // Siempre usar PUT para componentes (maneja crear, actualizar, eliminar)
          // Incluso con items:[] para eliminar todos
          promises.push(
            updateComponentes.mutateAsync({
              syllabusId: numSyllabusId,
              data: componentesPayload,
            }),
          );
        }
      }

      // ========== 3. ACTITUDES ==========
      if (hasRealChanges("contenidosActitudinales")) {
        const isCreate = isCreateOperation("contenidosActitudinales");
        const allDeleted = wereAllItemsDeleted("contenidosActitudinales");

        console.log(
          `🔄 Actitudes: ${allDeleted ? "PUT con items:[] (eliminar todos)" : isCreate ? "POST (crear)" : "PUT (sincronizar)"}`,
        );

        // Si NO hay datos originales Y NO hay items actuales -> no hacer nada
        if (
          originalDataRef.current["contenidosActitudinales"].length === 0 &&
          formData.contenidosActitudinales.length === 0
        ) {
          console.log("⚠️ No hay actitudes para crear ni sincronizar");
        } else {
          const actitudesPayload = {
            items: formData.contenidosActitudinales.map((item, index) => {
              // Validar que el código sea solo una letra (A-Z, a-z)
              const codePattern = /^[a-zA-Z]$/;
              const validCode =
                item.code && codePattern.test(item.code.trim())
                  ? item.code.trim().toUpperCase()
                  : String.fromCharCode(65 + (index % 26)); // A, B, C... por defecto

              const baseItem = {
                text: item.text,
                code: validCode,
                order: index + 1,
              };

              // Incluir ID solo si no es temporal y estamos actualizando
              if (!isCreate && !item.id.startsWith("temp-")) {
                return { ...baseItem, id: Number(item.id) };
              }

              return baseItem;
            }),
          };

          if (isCreate) {
            promises.push(
              createActitudes.mutateAsync({
                syllabusId: numSyllabusId,
                data: actitudesPayload,
              }),
            );
          } else {
            // Usar PUT para sincronizar (incluso con items:[] para eliminar todos)
            promises.push(
              updateActitudes.mutateAsync({
                syllabusId: numSyllabusId,
                data: actitudesPayload,
              }),
            );
          }
        }
      }

      // ========== EJECUTAR PETICIONES ==========
      if (promises.length > 0) {
        toastId = toast.loading("Guardando cambios...");
        const results = await Promise.all(promises);

        toast.dismiss(toastId);

        // Mostrar resultados
        results.forEach((result) => {
          console.log("✅ Resultado:", result);
          toast.success(result.message || "Cambios guardados correctamente");
        });

        // Actualizar referencia original después de guardar exitosamente
        originalDataRef.current = JSON.parse(JSON.stringify(formData));
      } else {
        console.log("ℹ️ No hay cambios para guardar");
        toast.info("No hay cambios para guardar");
      } // Avanzar al siguiente paso
      nextStep();
    } catch (error) {
      if (toastId) {
        toast.dismiss(toastId);
      }

      console.error("❌ Error al guardar:", error);

      // Extraer mensaje de error legible
      let errorMessage = "Error al guardar los cambios";

      if (error instanceof Error) {
        // Intentar parsear si el mensaje es JSON
        try {
          const errorObj = JSON.parse(error.message);
          errorMessage = errorObj.message || errorObj.error || error.message;
        } catch {
          // Si no es JSON, usar el mensaje tal cual
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    }
  };

  return (
    <Step step={3} onNextStep={handleSubmit}>
      <div className="w-full p-6">
        {/* Datos Generales (resumen) */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-lg font-bold text-black">1.</div>
            <h3 className="text-lg font-medium text-black">Datos Generales</h3>
            <div className="ml-2 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              i
            </div>
          </div>
          <div className="w-full h-12 rounded-md px-4 flex items-center text-lg bg-blue-50 border border-blue-100">
            {courseName || "TALLER DE PROYECTOS"}
          </div>
        </div>

        {/* Indicador de carga */}
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Cargando datos...</div>
          </div>
        )}

        {/* 3.1 Competencia */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 text-left">
            3.1 Competencia
          </h3>
          <div className="space-y-3">
            {formData.competencias.map((item) => (
              <div key={item.id}>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <textarea
                      value={item.text}
                      onChange={(e) =>
                        updateItem("competencias", item.id, e.target.value)
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Ingrese la competencia..."
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="text"
                      value={item.code}
                      onChange={(e) =>
                        updateItemCode("competencias", item.id, e.target.value)
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                      placeholder="Código"
                      maxLength={10}
                    />
                  </div>
                  <button
                    onClick={() => removeItem("competencias", item.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    disabled={formData.competencias.length <= 1}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => addItem("competencias")}
                className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Plus size={20} />
                Agregar competencia
              </button>
            </div>
          </div>
        </div>

        {/* 3.2 Componentes */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 text-left">
            3.2. Componentes
          </h3>
          <div className="space-y-3">
            {formData.componentes.map((item) => (
              <div key={item.id}>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <textarea
                      value={item.text}
                      onChange={(e) =>
                        updateItem("componentes", item.id, e.target.value)
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Ingrese el componente..."
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="text"
                      value={item.code}
                      onChange={(e) =>
                        updateItemCode("componentes", item.id, e.target.value)
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                      placeholder="Código"
                      maxLength={10}
                    />
                  </div>
                  <button
                    onClick={() => removeItem("componentes", item.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    disabled={formData.componentes.length <= 1}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => addItem("componentes")}
                className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Plus size={20} />
                Agregar componente
              </button>
            </div>
          </div>
        </div>

        {/* 3.3 Contenidos actitudinales */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 text-left">
            3.3. Contenidos actitudinales
          </h3>
          <div className="space-y-3">
            {formData.contenidosActitudinales.map((item) => (
              <div key={item.id}>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <textarea
                      value={item.text}
                      onChange={(e) =>
                        updateItem(
                          "contenidosActitudinales",
                          item.id,
                          e.target.value,
                        )
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Ingrese el contenido actitudinal..."
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="text"
                      value={item.code}
                      onChange={(e) =>
                        updateItemCode(
                          "contenidosActitudinales",
                          item.id,
                          e.target.value,
                        )
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                      placeholder="Código"
                      maxLength={10}
                    />
                  </div>
                  <button
                    onClick={() =>
                      removeItem("contenidosActitudinales", item.id)
                    }
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => addItem("contenidosActitudinales")}
                className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Plus size={20} />
                Agregar contenido actitudinal
              </button>
            </div>
          </div>
        </div>
      </div>
    </Step>
  );
}
