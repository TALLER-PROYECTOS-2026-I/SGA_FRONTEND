import { useState, useEffect, useRef } from "react";
import { useSteps } from "../contexts/steps-context-provider";
import { useSyllabusContext } from "../contexts/syllabus-context";
import { Step } from "./step";
import {
  X,
  Plus,
  Target,
  BookOpen,
  ListChecks,
  HeartHandshake,
  Loader2,
  Info,
} from "lucide-react";
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

type SectionKey = keyof FormData;

export default function ThirdStep() {
  const { nextStep } = useSteps();
  const { syllabusId, courseName } = useSyllabusContext();

  console.log("Syllabus ID in ThirdStep:", syllabusId, "Course:", courseName);

  const { data: thirdStepData, isLoading } = useThirdStepData(
    syllabusId ? Number(syllabusId) : null,
  );

  const updateCompetencias = useUpdateCompetencias();
  const updateComponentes = useUpdateComponentes();
  const updateActitudes = useUpdateActitudes();

  const createCompetencias = useSaveCompetencias();
  const createActitudes = useSaveActitudes();

  const [formData, setFormData] = useState<FormData>({
    competencias: [],
    componentes: [],
    contenidosActitudinales: [],
  });

  const originalDataRef = useRef<FormData>({
    competencias: [],
    componentes: [],
    contenidosActitudinales: [],
  });

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

  const addItem = (section: keyof FormData) => {
    const newId = `temp-${Date.now()}`;

    let defaultCode = "";

    if (section === "componentes") {
      const nextIndex = formData[section].length + 1;
      defaultCode = `g.${nextIndex}`;
    } else if (section === "contenidosActitudinales") {
      const nextIndex = formData[section].length;
      const letter = String.fromCharCode(65 + (nextIndex % 26));
      defaultCode = letter;
    } else {
      defaultCode = "A";
    }

    setFormData((prev) => ({
      ...prev,
      [section]: [...prev[section], { id: newId, text: "", code: defaultCode }],
    }));
  };

  const removeItem = (section: keyof FormData, id: string) => {
  const confirmed = window.confirm(
    "¿Seguro que deseas eliminar este registro?",
  );

  if (!confirmed) return;

  setFormData((prev) => ({
    ...prev,
    [section]: prev[section].filter((item) => item.id !== id),
  }));

  toast.success("Registro eliminado correctamente");
};

  const updateItem = (section: keyof FormData, id: string, text: string) => {
    setFormData((prev) => ({
      ...prev,
      [section]: prev[section].map((item) =>
        item.id === id ? { ...item, text } : item,
      ),
    }));
  };

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

  const isCreateOperation = (section: keyof FormData): boolean => {
    if (originalDataRef.current[section].length === 0) return true;

    const allTemporary = formData[section].every((item) =>
      item.id.startsWith("temp-"),
    );

    return allTemporary;
  };

  const wereAllItemsDeleted = (section: keyof FormData): boolean => {
    const hadOriginalData = originalDataRef.current[section].length > 0;
    const hasCurrentData = formData[section].length > 0;

    return hadOriginalData && !hasCurrentData;
  };

  const handleSubmit = async () => {
  if (!syllabusId) {
    toast.error("No se encontró el ID del sílabo");
    return;
  }

  const sections = Object.values(formData) as Array<
  Array<CompetenciaItem | ComponenteItem | ContenidoActitudinalItem>
  >;

  const hasEmptyFields = sections.some((items) =>
    items.some((item) => !item.text.trim() || !item.code.trim()),
  );

  if (hasEmptyFields) {
    toast.error("Completa todos los códigos y descripciones antes de continuar");
    return;
  }

  const numSyllabusId = Number(syllabusId);
  const promises: Promise<{ message?: string }>[] = [];
  let toastId: string | number | undefined;

    try {
      if (hasRealChanges("competencias")) {
        const isCreate = isCreateOperation("competencias");
        const allDeleted = wereAllItemsDeleted("competencias");

        console.log(
          `🔄 Competencias: ${
            allDeleted
              ? "PUT con items:[] (eliminar todos)"
              : isCreate
                ? "POST (crear)"
                : "PUT (sincronizar)"
          }`,
        );

        if (
          originalDataRef.current["competencias"].length === 0 &&
          formData.competencias.length === 0
        ) {
          console.log("⚠️ No hay competencias para crear ni sincronizar");
        } else {
          const competenciasPayload = {
            items: formData.competencias.map((item, index) => {
              const validCode =
                item.code && item.code.trim() !== ""
                  ? item.code.trim()
                  : String.fromCharCode(65 + (index % 26));

              const baseItem = {
                text: item.text,
                code: validCode,
                order: index + 1,
              };

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
            promises.push(
              updateCompetencias.mutateAsync({
                syllabusId: numSyllabusId,
                data: competenciasPayload,
              }),
            );
          }
        }
      }

      if (hasRealChanges("componentes")) {
        const allDeleted = wereAllItemsDeleted("componentes");

        console.log(
          `🔄 Componentes: ${
            allDeleted
              ? "PUT con items:[] (eliminar todos)"
              : "PUT (sincronizar)"
          }`,
        );

        if (
          originalDataRef.current["componentes"].length === 0 &&
          formData.componentes.length === 0
        ) {
          console.log("⚠️ No hay componentes para crear ni sincronizar");
        } else {
          const componentesPayload = {
            items: formData.componentes.map((item, index) => {
              const codePattern = /^[a-zA-Z]\.\d+$/;
              const validCode =
                item.code && codePattern.test(item.code.trim())
                  ? item.code.trim()
                  : `g.${index + 1}`;

              const baseItem = {
                text: item.text,
                code: validCode,
                order: index + 1,
              };

              if (!item.id.startsWith("temp-")) {
                return { ...baseItem, id: Number(item.id) };
              }

              return baseItem;
            }),
          };

          promises.push(
            updateComponentes.mutateAsync({
              syllabusId: numSyllabusId,
              data: componentesPayload,
            }),
          );
        }
      }

      if (hasRealChanges("contenidosActitudinales")) {
        const isCreate = isCreateOperation("contenidosActitudinales");
        const allDeleted = wereAllItemsDeleted("contenidosActitudinales");

        console.log(
          `🔄 Actitudes: ${
            allDeleted
              ? "PUT con items:[] (eliminar todos)"
              : isCreate
                ? "POST (crear)"
                : "PUT (sincronizar)"
          }`,
        );

        if (
          originalDataRef.current["contenidosActitudinales"].length === 0 &&
          formData.contenidosActitudinales.length === 0
        ) {
          console.log("⚠️ No hay actitudes para crear ni sincronizar");
        } else {
          const actitudesPayload = {
            items: formData.contenidosActitudinales.map((item, index) => {
              const codePattern = /^[a-zA-Z]$/;
              const validCode =
                item.code && codePattern.test(item.code.trim())
                  ? item.code.trim().toUpperCase()
                  : String.fromCharCode(65 + (index % 26));

              const baseItem = {
                text: item.text,
                code: validCode,
                order: index + 1,
              };

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
            promises.push(
              updateActitudes.mutateAsync({
                syllabusId: numSyllabusId,
                data: actitudesPayload,
              }),
            );
          }
        }
      }

      if (promises.length > 0) {
        toastId = toast.loading("Guardando cambios...");
        const results = await Promise.all(promises);

        toast.dismiss(toastId);

        results.forEach((result) => {
          console.log("✅ Resultado:", result);
          toast.success(result.message || "Cambios guardados correctamente");
        });

        originalDataRef.current = JSON.parse(JSON.stringify(formData));
      } else {
        console.log("ℹ️ No hay cambios para guardar");
        toast.info("No hay cambios para guardar");
      }

      nextStep();
    } catch (error) {
      if (toastId) {
        toast.dismiss(toastId);
      }

      console.error("❌ Error al guardar:", error);

      let errorMessage = "Error al guardar los cambios";

      if (error instanceof Error) {
        try {
          const errorObj = JSON.parse(error.message);
          errorMessage = errorObj.message || errorObj.error || error.message;
        } catch {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    }
  };

  const totalItems =
    formData.competencias.length +
    formData.componentes.length +
    formData.contenidosActitudinales.length;

  const textAreaClass =
    "w-full min-h-[90px] rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 resize-y outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent";

  const codeInputClass =
    "w-full h-11 rounded-xl px-3 bg-gray-50 border border-gray-200 text-sm text-gray-700 text-center font-semibold outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent";

  const renderEditableSection = ({
    section,
    title,
    description,
    icon,
    addLabel,
    placeholder,
  }: {
    section: SectionKey;
    title: string;
    description: string;
    icon: React.ReactNode;
    addLabel: string;
    placeholder: string;
  }) => {
    const items = formData[section];

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
                {icon}
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 mt-1">{description}</p>
              </div>
            </div>

            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold bg-white text-gray-700 border border-gray-100">
              {items.length} registro{items.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {items.length === 0 && (
            <div className="text-center py-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
              <p className="text-sm font-semibold text-gray-700">
                No hay registros agregados.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Usa el botón inferior para añadir uno nuevo.
              </p>
            </div>
          )}

          {items.map((item, index) => (
            <div
              key={item.id}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
            >
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="w-full lg:w-20">
                  <label className="block text-xs font-bold text-gray-500 mb-2">
                    Código
                  </label>
                  <input
                    type="text"
                    value={item.code}
                    onChange={(e) =>
                      updateItemCode(section, item.id, e.target.value)
                    }
                    className={codeInputClass}
                    placeholder="Código"
                    maxLength={10}
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={item.text}
                    onChange={(e) =>
                      updateItem(section, item.id, e.target.value)
                    }
                    className={textAreaClass}
                    rows={2}
                    placeholder={placeholder}
                  />
                </div>

                <div className="flex lg:items-end justify-end">
                  <button
                    type="button"
                    onClick={() => removeItem(section, item.id)}
                    className="w-10 h-10 flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                    disabled={
                      (section === "competencias" ||
                        section === "componentes") &&
                      items.length <= 1
                    }
                    title="Eliminar"
                  >
                    <X size={19} />
                  </button>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-400">
                Registro #{index + 1}
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => addItem(section)}
              className="h-11 px-5 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 text-red-700 hover:bg-red-100 transition-colors font-semibold text-sm"
            >
              <Plus size={18} />
              {addLabel}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Step step={3} onNextStep={handleSubmit}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md">
              <span className="text-2xl font-bold">3</span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Competencias y Componentes
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Define las competencias principales, componentes y contenidos
                actitudinales de la asignatura.
              </p>
            </div>

            <div className="ml-auto hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold">
              Desarrollo académico
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-7 rounded-2xl border border-gray-100 bg-gray-50 p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <BookOpen size={20} />
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">
                    Asignatura seleccionada
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {courseName || "Sin nombre de asignatura"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Total registros
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {totalItems}
                  </p>
                </div>

                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Competencias
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {formData.competencias.length}
                  </p>
                </div>

                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Componentes
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {formData.componentes.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Cargando datos...
            </div>
          )}

          <div className="mb-6 bg-blue-50 rounded-2xl border border-blue-100 p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Info size={18} />
              </div>

              <div>
                <h3 className="font-bold text-blue-900">Recomendación</h3>
                <p className="text-sm text-blue-700 leading-relaxed mt-1">
                  Completa cada registro con una descripción clara y un código
                  identificador. Los cambios se guardarán al pasar al siguiente
                  paso.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-7">
            {renderEditableSection({
              section: "competencias",
              title: "3.1 Competencia",
              description:
                "Describe las competencias principales que desarrollará el estudiante.",
              icon: <Target size={22} />,
              addLabel: "Agregar competencia",
              placeholder: "Ingrese la competencia...",
            })}

            {renderEditableSection({
              section: "componentes",
              title: "3.2 Componentes",
              description:
                "Registra los componentes asociados a las competencias de la asignatura.",
              icon: <ListChecks size={22} />,
              addLabel: "Agregar componente",
              placeholder: "Ingrese el componente...",
            })}

            {renderEditableSection({
              section: "contenidosActitudinales",
              title: "3.3 Contenidos actitudinales",
              description:
                "Incluye actitudes, valores o disposiciones esperadas en el proceso de aprendizaje.",
              icon: <HeartHandshake size={22} />,
              addLabel: "Agregar contenido actitudinal",
              placeholder: "Ingrese el contenido actitudinal...",
            })}
          </div>
        </div>
      </div>
    </Step>
  );
}