import { useState } from "react";
import { Step } from "./step";
import { useSyllabusContext } from "../contexts/syllabus-context";
import { usePermissionsContext } from "../hooks/use-permissions-context";
import { useSubmitToAnalysis } from "../hooks/use-submit-to-analysis";
import { useSaveResultados } from "../hooks/eighth-step-query";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Tipos
interface StudentOutcome {
  id: number;
  code: string;
  description: string;
  level: "K" | "R" | "";
}

// Data mockeada
const mockStudentOutcomes: StudentOutcome[] = [
  {
    id: 1,
    code: "K",
    description:
      "Analizar un sistema complejo de computación aplicar principios de computación y otras disciplinas relevantes",
    level: "",
  },
  {
    id: 2,
    code: "R",
    description: "Diseñar implementar y evaluar",
    level: "",
  },
  {
    id: 3,
    code: "",
    description: "Comunicación efectiva en una variedad",
    level: "",
  },
  {
    id: 4,
    code: "",
    description: "Reconoce la responsabilidad profesional",
    level: "",
  },
  {
    id: 5,
    code: "",
    description: "Trabajo de manera efectiva como miembro líder o un equipos",
    level: "",
  },
  {
    id: 6,
    code: "",
    description: "Brindar soporte a la entrega",
    level: "",
  },
  {
    id: 7,
    code: "",
    description: "Aprendizaje continuo",
    level: "",
  },
];

export default function EighthStep() {
  const { syllabusId } = useSyllabusContext();
  const { hasEditPermissionForSection } = usePermissionsContext();
  const navigate = useNavigate();

  const [outcomes, setOutcomes] =
    useState<StudentOutcome[]>(mockStudentOutcomes);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveResultados = useSaveResultados();
  const submitToAnalysis = useSubmitToAnalysis();

  // Verificar si tiene permisos para editar la sección 9 (Step 8)
  const canEdit = hasEditPermissionForSection(9);

  const handleNextStep = async () => {
    if (!syllabusId) {
      toast.error("ID del sílabo no encontrado");
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Guardar los datos del step 8 SOLO si tiene permisos de edición
      if (canEdit) {
        console.log("💾 Guardando resultados del paso 8...", outcomes);

        // Convertir outcomes a formato esperado por la API (usar "" en lugar de null)
        const resultadosData = {
          resultados: outcomes.map((outcome) => ({
            id: outcome.id,
            code: outcome.code,
            description: outcome.description,
            level: outcome.level || ("" as const),
          })),
        };

        await saveResultados.mutateAsync({
          syllabusId,
          data: resultadosData,
          isCreating: false, // TODO: Ajustar según lógica de creación
        });

        toast.success("Datos guardados correctamente");
      } else {
        console.log(
          "ℹ️ Usuario sin permisos de edición en Step 8, omitiendo guardado",
        );
      }

      // 2. Pedir confirmación para enviar a análisis
      const confirmed = window.confirm(
        "¿Estás seguro de que deseas enviar el sílabo a revisión?\n\n" +
          "Esta acción cambiará el estado del sílabo a 'ANALIZANDO' y " +
          "será enviado al coordinador para su revisión.",
      );

      if (!confirmed) {
        const message = canEdit
          ? "Envío cancelado. Los cambios fueron guardados."
          : "Envío cancelado.";
        toast.info(message);
        return;
      }

      // 3. Enviar a análisis (cambiar estado a ANALIZANDO)
      console.log("📤 Enviando sílabo a análisis...");

      await submitToAnalysis.mutateAsync({ syllabusId });

      toast.success("¡Sílabo enviado a revisión exitosamente!", {
        description: "El coordinador revisará tu sílabo pronto.",
      });

      // 4. Navegar a página de confirmación o lista
      // Esperar un momento para que el usuario vea el mensaje
      setTimeout(() => {
        navigate("/my-syllabus"); // O la ruta que corresponda
      }, 2000);
    } catch (error) {
      console.error("❌ Error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al procesar la solicitud";

      toast.error("Error al enviar sílabo", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLevelChange = (id: number, level: "K" | "R" | "") => {
    setOutcomes(
      outcomes.map((outcome) =>
        outcome.id === id ? { ...outcome, level } : outcome,
      ),
    );
  };

  return (
    <Step step={8} onNextStep={handleNextStep} hideControls={isSubmitting}>
      <div className="w-full max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">
          9. Aporte de la Asignatura al logro de resultados
        </h2>

        {/* Mensaje de solo lectura si no tiene permisos */}
        {!canEdit && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-yellow-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-yellow-800">
                  Modo solo lectura
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  No tienes permisos para editar esta sección. Puedes revisar el
                  contenido y finalizar el proceso de envío.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Descripción */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <p className="text-gray-700 leading-relaxed">
            El aporte de la asignatura al logro de los Resultados del Estudiante
            (Student Outcomes) en la formación del graduado en Ingeniería de
            Computación y Sistemas, se establece en la tabla siguiente:
          </p>
        </div>

        {/* Leyenda */}
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold">K =</span>
              <span>Clave</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">R =</span>
              <span>Relacionado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Recuadro vacío =</span>
              <span>No aplica</span>
            </div>
          </div>
        </div>

        {/* Tabla de Student Outcomes */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold w-12">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold w-32">
                    Nivel
                  </th>
                </tr>
              </thead>
              <tbody>
                {outcomes.map((outcome, index) => (
                  <tr
                    key={outcome.id}
                    className={`border-b border-gray-200 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {outcome.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {outcome.description}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <div className="relative">
                          <select
                            value={outcome.level}
                            onChange={(e) =>
                              handleLevelChange(
                                outcome.id,
                                e.target.value as "K" | "R" | "",
                              )
                            }
                            disabled={!canEdit}
                            className={`appearance-none border rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              canEdit
                                ? "bg-white border-gray-300 cursor-pointer hover:border-gray-400"
                                : "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-500"
                            }`}
                          >
                            <option value="">-</option>
                            <option value="K">K</option>
                            <option value="R">R</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 text-sm text-gray-600">
          <p>
            * Selecciona el nivel de aporte de la asignatura para cada resultado
            del estudiante.
          </p>
        </div>

        {/* Indicador de envío */}
        {isSubmitting && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <div>
                <p className="text-sm font-semibold text-blue-700">
                  Procesando...
                </p>
                <p className="text-xs text-blue-600">
                  Guardando datos y enviando a revisión
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Step>
  );
}
