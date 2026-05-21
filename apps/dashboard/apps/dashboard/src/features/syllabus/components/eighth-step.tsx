import { useState } from "react";
import { Step } from "./step";
import { useSyllabusContext } from "../contexts/syllabus-context";
import { useReviewMode } from "../../coordinator/contexts/review-mode-context";
import { useSubmitToAnalysis } from "../hooks/use-submit-to-analysis";
import { useSaveResultados } from "../hooks/eighth-step-query";
import {
  ChevronDown,
  GraduationCap,
  Info,
  AlertTriangle,
  Loader2,
  CheckCircle,
  FileText,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface StudentOutcome {
  id: number;
  code: string;
  description: string;
  level: "K" | "R" | "";
}

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
  const { isReviewMode } = useReviewMode();
  const navigate = useNavigate();

  const [outcomes, setOutcomes] =
    useState<StudentOutcome[]>(mockStudentOutcomes);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveResultados = useSaveResultados();
  const submitToAnalysis = useSubmitToAnalysis();

  const canEdit = !isReviewMode;

  const selectedK = outcomes.filter((outcome) => outcome.level === "K").length;
  const selectedR = outcomes.filter((outcome) => outcome.level === "R").length;
  const notApply = outcomes.filter((outcome) => outcome.level === "").length;

  const handleNextStep = async () => {
    if (!syllabusId) {
      toast.error("ID del sílabo no encontrado");
      return;
    }

    try {
      setIsSubmitting(true);

      if (canEdit) {
        console.log("💾 Guardando resultados del paso 8...", outcomes);

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
          isCreating: false,
        });

        toast.success("Datos guardados correctamente");
      } else {
        console.log(
          "ℹ️ Usuario sin permisos de edición en Step 8, omitiendo guardado",
        );
      }

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

      console.log("📤 Enviando sílabo a análisis...");

      await submitToAnalysis.mutateAsync({ syllabusId });

      toast.success("¡Sílabo enviado a revisión exitosamente!", {
        description: "El coordinador revisará tu sílabo pronto.",
      });

      setTimeout(() => {
        navigate("/my-syllabus");
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md">
              <span className="text-2xl font-bold">8</span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Aporte de la Asignatura
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Define el nivel de aporte de la asignatura al logro de los
                resultados del estudiante.
              </p>
            </div>

            <div className="ml-auto hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold">
              Resultados del estudiante
            </div>
          </div>
        </div>

        <div className="p-8">
          {!canEdit && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500 text-white flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>

                <div>
                  <p className="text-sm font-bold text-yellow-800">
                    Modo solo lectura
                  </p>
                  <p className="text-sm text-yellow-700 mt-1 leading-relaxed">
                    No tienes permisos para editar esta sección. Puedes revisar
                    el contenido y finalizar el proceso de envío.
                  </p>
                </div>
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
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    El aporte de la asignatura al logro de los Resultados del
                    Estudiante en la formación del graduado se establece en la
                    tabla siguiente.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Clave
                  </p>
                  <p className="text-xl font-bold text-gray-900">{selectedK}</p>
                </div>

                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Relacionado
                  </p>
                  <p className="text-xl font-bold text-gray-900">{selectedR}</p>
                </div>

                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    No aplica
                  </p>
                  <p className="text-xl font-bold text-gray-900">{notApply}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 bg-blue-50 rounded-2xl border border-blue-100 p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <GraduationCap size={18} />
              </div>

              <div>
                <h3 className="font-bold text-blue-900">Leyenda</h3>
                <div className="flex flex-wrap gap-3 mt-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-blue-100 text-sm text-blue-800">
                    <strong>K</strong> = Clave
                  </span>

                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-blue-100 text-sm text-blue-800">
                    <strong>R</strong> = Relacionado
                  </span>

                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-blue-100 text-sm text-blue-800">
                    <strong>-</strong> = No aplica
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center">
                  <FileText size={20} />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Tabla de resultados del estudiante
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Selecciona el nivel correspondiente para cada resultado.
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-700">
                    <th className="px-6 py-4 text-left font-bold w-[8%]">
                      #
                    </th>
                    <th className="px-6 py-4 text-left font-bold w-[72%]">
                      Descripción
                    </th>
                    <th className="px-6 py-4 text-center font-bold w-[20%]">
                      Nivel
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {outcomes.map((outcome) => (
                    <tr
                      key={outcome.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-5">
                        <div className="w-9 h-9 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold text-sm">
                          {outcome.id}
                        </div>
                      </td>

                      <td className="px-6 py-5 text-gray-700 leading-relaxed">
                        {outcome.description}
                      </td>

                      <td className="px-6 py-5">
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
                              className={`appearance-none h-10 min-w-[90px] rounded-xl px-4 pr-10 text-sm font-bold outline-none transition-all ${
                                canEdit
                                  ? "bg-gray-50 border border-gray-200 text-gray-700 cursor-pointer hover:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                  : "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              <option value="">-</option>
                              <option value="K">K</option>
                              <option value="R">R</option>
                            </select>

                            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
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

          <div className="mt-6 bg-gray-50 border border-gray-100 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-800 text-white flex items-center justify-center shrink-0">
                <CheckCircle size={18} />
              </div>

              <div>
                <h3 className="font-bold text-gray-900">
                  Antes de finalizar
                </h3>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  Verifica que los niveles seleccionados correspondan al aporte
                  real de la asignatura. Al continuar, el sílabo será enviado a
                  revisión.
                </p>
              </div>
            </div>
          </div>

          {isSubmitting && (
            <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin" />
                </div>

                <div>
                  <p className="text-sm font-bold text-blue-700">
                    Procesando...
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    Guardando datos y enviando a revisión.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isSubmitting && (
            <div className="mt-4 flex items-center justify-end">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-100 text-sm font-semibold">
                <Send size={17} />
                Enviando sílabo...
              </div>
            </div>
          )}
        </div>
      </div>
    </Step>
  );
}