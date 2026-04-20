import StepsProvider from "../contexts/steps-context";
import { SyllabusProvider } from "../contexts/syllabus-context";
import { PermissionsProvider } from "../contexts/permissions-context";
import { useSteps } from "../contexts/steps-context-provider";
import FirstStep from "../components/first-step";
import SecondStep from "../components/second-step";
import ThirdStep from "../components/third-step";
import FourthStep from "../components/fourth-step";
import FifthStep from "../components/fifth-step";
import SixthStep from "../components/sixth-step";
import SeventhStep from "../components/seventh-step";
import EighthStep from "../components/eighth-step";

// --- NUEVO: Componente Visual para el Encabezado y los Círculos ---
const StepperHeader = () => {
  const { currentStep } = useSteps();
  const totalSteps = 9; // Según Figma son 9 pasos principales
  
  return (
    <div className="mb-10">
      <h1 className="text-3xl font-bold text-[#0f172a] mb-2">Crear nuevo sílabo</h1>
      <p className="text-gray-500 mb-8">Complete todos los pasos para registrar el sílabo correctamente</p>
      
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          
          return (
            <div key={stepNumber} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300
                ${isCompleted ? 'bg-[#10b981] text-white shadow-sm' : ''}
                ${isActive ? 'bg-[#b91c1c] text-white shadow-md transform scale-110' : ''}
                ${!isCompleted && !isActive ? 'bg-gray-100 text-gray-400' : ''}
              `}>
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                ) : (
                  stepNumber
                )}
              </div>
              {/* Línea conectora (no renderizar después del último círculo) */}
              {stepNumber < totalSteps && (
                <div className={`h-1 w-12 mx-2 rounded transition-colors duration-300 ${isCompleted ? 'bg-[#10b981]' : 'bg-gray-200'}`}></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function SyllabusProcess() {
  // BYPASS DE SEGURIDAD: Forzamos a que todos los pasos estén permitidos 
  // para que puedas programar y probar tu Historia de Usuario libremente.
  const mockAllowedSteps = [1, 2, 3, 4, 5, 6, 7, 8]; 

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <SyllabusProvider>
        <PermissionsProvider
          hasEditPermissionForSection={() => true} // Simulamos que siempre tienes permiso
          allowedSteps={mockAllowedSteps}
        >
          <StepsProvider totalSteps={8} allowedSteps={mockAllowedSteps}>
            
            {/* 1. Renderizamos el Encabezado visual */}
            <StepperHeader />
            
            {/* 2. Renderizamos los Pasos. 
                Al quitar los condicionales restrictivos, nuestra lógica del archivo 'step.tsx' 
                se encargará de apilarlos perfectamente en cascada. */}
            <FirstStep />
            <SecondStep />
            <ThirdStep />
            <FourthStep />
            <FifthStep />
            <SixthStep />
            <SeventhStep />
            <EighthStep />
            
          </StepsProvider>
        </PermissionsProvider>
      </SyllabusProvider>
    </div>
  );
}