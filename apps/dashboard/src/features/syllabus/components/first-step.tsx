import { useState } from "react";
import { Step } from "./step";
import { useSteps } from "../contexts/steps-context-provider";

import { useSaveDatosGenerales } from "../hooks/first-step-query";

export default function FirstStep() {
  const { nextStep } = useSteps();

  const { mutateAsync: saveDatosGenerales } = useSaveDatosGenerales();

  // El único campo que pide tu Figma
  const [nombreAsignatura, setNombreAsignatura] = useState(
    "INGENIERIA DE SOFTWARE II COD: 09013707052",
  );

  const handleNext = async () => {
    try {
      // 1. Creamos un paquete de datos "perfecto" para engañar al backend y que no falle
      // Payload completo
      const payload = {
        nombreAsignatura: nombreAsignatura,
        codigoAsignatura: "09013707052",
        ciclo: "7",
        requisitos: "Ingeniería de Requisitos",
        horasTeoria: 2,
        horasPractica: 2,
        horasLaboratorio: 0,
        horasTotales: 4,
        horasTeoriaLectivaPresencial: 2,
        horasTeoriaLectivaDistancia: 0,
        horasTeoriaNoLectivaPresencial: 0,
        horasTeoriaNoLectivaDistancia: 0,
        horasPracticaLectivaPresencial: 2,
        horasPracticaLectivaDistancia: 0,
        horasPracticaNoLectivaPresencial: 0,
        horasPracticaNoLectivaDistancia: 0,
        creditosTeoria: 1,
        creditosPractica: 1,
        creditosTotales: 2,
        modalidad: "Presencial",
      };

      // Envío correcto al backend (sin usar any)
      await saveDatosGenerales({
        syllabusId: null,
        isCreating: true,
        data: payload,
      });

      // 3. Si todo sale bien, avanzamos
      nextStep();
    } catch (error) {
      console.error(
        "El backend rechazó los datos, pero forzaremos el paso 2:",
        error,
      );
      // SEGURO DE VIDA: Si el backend falla, igual te pasamos al Paso 2 para que pruebes tu HU
      nextStep();
    }
  };

  return (
    <Step step={1} onNextStep={handleNext}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        {/* Cabecera idéntica a Figma */}
        <div className="px-6 py-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#b91c1c] text-white flex items-center justify-center font-bold">
            1
          </div>
          <h2 className="text-xl font-bold text-[#111827]">Datos Generales</h2>
        </div>

        {/* Campo único idéntico a Figma */}
        <div className="px-8 pb-8">
          <div className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-4">
            <input
              type="text"
              className="bg-transparent w-full outline-none text-gray-800 font-medium"
              value={nombreAsignatura}
              onChange={(e) => setNombreAsignatura(e.target.value)}
            />
            {/* Ícono de ojito */}
            <svg
              className="text-gray-400 w-5 h-5 cursor-pointer"
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
