import { useState } from "react";
import { Step } from "./step";
import { useSteps } from "../contexts/steps-context-provider";

export default function ThirdStep() {
  const { nextStep } = useSteps();
  
  // Un pequeño estado visual para que parezca que funciona al hacer clic
  const [selectedFormula, setSelectedFormula] = useState<number | null>(1);

  const formulas = [
    {
      id: 1,
      name: "Promedio Simple",
      desc: "Promedio aritmético de todas las evaluaciones",
      code: "PF = (E1 + E2 + E3 + ... + En) / n",
    },
    {
      id: 2,
      name: "Promedio Ponderado",
      desc: "Evaluaciones con diferentes pesos porcentuales",
      code: "PF = (E1*30%) + (E2*30%) + (E3*40%)",
    },
    {
      id: 3,
      name: "Continua con Examen Final",
      desc: "Evaluación continua más examen final",
      code: "PF = (PC*60%) + (EF*40%)",
    },
    {
      id: 4,
      name: "Por Unidades",
      desc: "Promedio de unidades del curso",
      code: "PF = (U1 + U2 + U3 + U4) / 4",
    },
  ];

  return (
    <Step step={3} onNextStep={nextStep}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        
        {/* Cabecera del Paso 3 */}
        <div className="px-6 py-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#b91c1c] text-white flex items-center justify-center font-bold shadow-sm">
            3
          </div>
          <h2 className="text-xl font-bold text-[#111827]">
            Fórmulas de Calificación
          </h2>
        </div>

        <div className="px-8 pb-8">
          <p className="text-gray-500 mb-6 text-sm">
            Seleccione la fórmula de calificación que se ajuste mejor a su curso
          </p>

          {/* Grid de Fórmulas (Idéntico al Figma) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {formulas.map((f) => (
              <div
                key={f.id}
                onClick={() => setSelectedFormula(f.id)}
                className={`border rounded-lg p-5 cursor-pointer transition-all ${
                  selectedFormula === f.id
                    ? "border-blue-500 bg-blue-50/20 shadow-sm"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-[#0f172a] text-base">
                    {f.name}
                  </h3>
                  {/* Radio Button Visual */}
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedFormula === f.id
                        ? "border-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedFormula === f.id && (
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-4">{f.desc}</p>
                <div className="bg-white border border-gray-100 rounded text-center py-2 px-3 shadow-inner">
                  <code className="text-xs font-mono text-blue-600 font-semibold tracking-wide">
                    {f.code}
                  </code>
                </div>
              </div>
            ))}
          </div>

          {/* Caja de Alerta (Comité Académico) */}
          <div className="bg-[#eff6ff] border border-blue-100 rounded-lg p-5 flex items-start gap-4">
            <div className="text-blue-600 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#1e3a8a] mb-1">
                ¿Ninguna fórmula te convence?
              </h4>
              <p className="text-xs text-blue-800/80 mb-4">
                Puedes contactar con el comité académico para replantear una nueva fórmula de calificación adaptada a tus necesidades.
              </p>
              <button className="bg-[#2563eb] text-white text-xs font-semibold px-4 py-2 rounded-md hover:bg-blue-700 transition-colors shadow-sm">
                Contactar Comité Académico
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </Step>
  );
}