import { useState } from "react";
import { Step } from "./step";
import { useSteps } from "../contexts/steps-context-provider";
import { useSyllabusContext } from "../contexts/syllabus-context";
import { useSaveDatosGenerales } from "../hooks/first-step-query";

export default function FirstStep() {
  const { nextStep } = useSteps();
  const { setCourseName } = useSyllabusContext();
  const { mutateAsync: saveDatosGenerales } = useSaveDatosGenerales();

  const [nombreAsignatura, setNombreAsignatura] = useState(
    "INGENIERIA DE SOFTWARE II COD: 09013707052",
  );

  type SaveDatosGeneralesInput = Parameters<typeof saveDatosGenerales>[0];
  type DatosGeneralesData = SaveDatosGeneralesInput["data"];

  const handleNext = async () => {
    try {
      const data: DatosGeneralesData = {
        nombreAsignatura,
        codigoAsignatura: "09013707052",
        ciclo: "7",
        requisitos: "Ingeniería de Requisitos",
        horasTeoria: 2,
        horasPractica: 2,
        creditosTotales: 2,
        modalidad: "Presencial",
      };

      const payload: SaveDatosGeneralesInput = {
        syllabusId: null,
        data,
        isCreating: true,
      };

      setCourseName(nombreAsignatura);
      await saveDatosGenerales(payload);
      nextStep();
    } catch (error) {
      console.error(
        "El backend rechazó los datos, pero forzaremos el paso 2:",
        error,
      );
      nextStep();
    }
  };

  return (
    <Step step={1} onNextStep={handleNext}>
      <div className="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#b91c1c] font-bold text-white">
            1
          </div>
          <h2 className="text-xl font-bold text-[#111827]">Datos Generales</h2>
        </div>

        <div className="px-8 pb-8">
          <div className="flex w-full items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-4">
            <input
              type="text"
              className="w-full bg-transparent font-medium text-gray-800 outline-none"
              value={nombreAsignatura}
              onChange={(e) => setNombreAsignatura(e.target.value)}
            />
            <svg
              className="h-5 w-5 cursor-pointer text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </div>
        </div>
      </div>
    </Step>
  );
}
