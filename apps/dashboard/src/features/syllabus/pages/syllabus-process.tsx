import StepsProvider from "../contexts/steps-context";
import {
  SyllabusProvider,
  useSyllabusContext,
} from "../contexts/syllabus-context";
import { PermissionsProvider } from "../contexts/permissions-context";
import { usePermissions } from "../hooks/use-permissions";
import { useSession } from "../../auth";

import FirstStep from "../components/first-step";
import SecondStep from "../components/second-step";
import ThirdStep from "../components/third-step";
import FourthStep from "../components/fourth-step";
import FifthStep from "../components/fifth-step";
import SixthStep from "../components/sixth-step";
import SeventhStep from "../components/seventh-step";
import EighthStep from "../components/eighth-step";

const TOTAL_STEPS = 8;
const FULL_STEPS = [1, 2, 3, 4, 5, 6, 7, 8];

function SyllabusProcessContent() {
  const { user } = useSession();
  const { mode } = useSyllabusContext();
  const userId = user?.id ? Number(user.id) : null;

  const { allowedSteps, isLoading, error, hasEditPermissionForSection } =
    usePermissions(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando permisos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-600">
          <p className="text-xl mb-2">Error al cargar permisos</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  const finalAllowedSteps =
    mode === "create"
      ? FULL_STEPS
      : allowedSteps && allowedSteps.length > 0
        ? allowedSteps
        : FULL_STEPS;

  return (
    <PermissionsProvider
      hasEditPermissionForSection={hasEditPermissionForSection}
      allowedSteps={finalAllowedSteps}
    >
      <StepsProvider totalSteps={TOTAL_STEPS} allowedSteps={finalAllowedSteps}>
        {finalAllowedSteps.includes(1) && <FirstStep />}
        {finalAllowedSteps.includes(2) && <SecondStep />}
        {finalAllowedSteps.includes(3) && <ThirdStep />}
        {finalAllowedSteps.includes(4) && <FourthStep />}
        {finalAllowedSteps.includes(5) && <FifthStep />}
        {finalAllowedSteps.includes(6) && <SixthStep />}
        {finalAllowedSteps.includes(7) && <SeventhStep />}
        {finalAllowedSteps.includes(8) && <EighthStep />}
      </StepsProvider>
    </PermissionsProvider>
  );
}

export default function SyllabusProcess() {
  return (
    <SyllabusProvider>
      <SyllabusProcessContent />
    </SyllabusProvider>
  );
}
