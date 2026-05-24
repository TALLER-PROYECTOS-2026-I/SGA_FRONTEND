import { useMemo } from "react";
import StepsProvider from "../contexts/steps-context";
import {
  SyllabusProvider,
  useSyllabusContext,
} from "../contexts/syllabus-context";
import { CreateDraftProvider } from "../create-draft/create-draft-context";
import { PermissionsProvider } from "../contexts/permissions-context";
import { usePermissions } from "../hooks/use-permissions";
import { useRejectedSections } from "../hooks/use-rejected-sections";
import { useSyllabusEditLock } from "../hooks/use-syllabus-edit-lock";
import { useSyllabusGeneral } from "../hooks/first-step-query";
import { useSession } from "../../auth/hooks/use-session";
import { useSearchParams } from "react-router-dom";
import {
  isDraftCreate,
  resolveSyllabusIdFromSources,
} from "../create-draft/is-draft-create";

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
const PRIVILEGED_STAFF_ROLE_IDS = new Set([2, 3, 4]);

function isPrivilegedStaffRole(role: unknown) {
  const roleId = Number(role);
  return PRIVILEGED_STAFF_ROLE_IDS.has(roleId);
}

function normalizeEstadoRevision(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

function SyllabusProcessContent() {
  const { user, isLoading: isSessionLoading } = useSession();
  const { mode, syllabusId } = useSyllabusContext();
  const [searchParams] = useSearchParams();

  const stepsMountKey = useMemo(() => {
    if (mode !== "create") {
      return `edit-${syllabusId ?? "none"}`;
    }

    const resolvedSyllabusId = resolveSyllabusIdFromSources(
      syllabusId,
      searchParams,
    );

    if (!isDraftCreate({ mode, resolvedSyllabusId })) {
      return "create-with-id";
    }

    return searchParams.get("resumeDraft") === "true"
      ? "create-resume"
      : "create-fresh";
  }, [mode, syllabusId, searchParams]);

  const userId = user?.id ? Number(user.id) : null;
  const currentSyllabusId = syllabusId ? Number(syllabusId) : null;

  const { allowedSteps, isLoading, error } = usePermissions(userId);

  const { estadoRevision } = useSyllabusEditLock(currentSyllabusId);
  const { data: generalData, isLoading: isGeneralLoading } = useSyllabusGeneral(
    mode !== "create" ? currentSyllabusId : null,
  );
  const {
    rejectedSteps,
    commentsByStep,
    isLoading: isRejectedSectionsLoading,
  } = useRejectedSections(currentSyllabusId);

  const isDisapproved =
    normalizeEstadoRevision(estadoRevision) === "DESAPROBADO";

  const estadoKey = normalizeEstadoRevision(
    estadoRevision ?? generalData?.estadoRevision,
  );

  const isUnassignedBorrador =
    mode !== "create" &&
    Boolean(currentSyllabusId) &&
    estadoKey === "BORRADOR" &&
    !String(generalData?.docentes ?? "").trim();

  const canPrivilegedEditUnassigned =
    isPrivilegedStaffRole(user?.role) && isUnassignedBorrador;

  const showRejectedSectionsLoading =
    Boolean(currentSyllabusId) && isRejectedSectionsLoading;

  const showPrivilegedBorradorLoading =
    Boolean(currentSyllabusId) &&
    mode !== "create" &&
    isPrivilegedStaffRole(user?.role) &&
    estadoKey === "BORRADOR" &&
    isGeneralLoading;

  if (
    isSessionLoading ||
    isLoading ||
    showRejectedSectionsLoading ||
    showPrivilegedBorradorLoading
  ) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando permisos...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center text-red-600">
          <p className="text-xl font-bold mb-2">Sesión no válida</p>
          <p className="text-sm">
            No se pudo identificar el usuario actual para cargar permisos.
          </p>
        </div>
      </div>
    );
  }

  if (error && mode !== "create") {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center text-red-600">
          <p className="text-xl font-bold mb-2">Error al cargar permisos</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  const visibleSteps = FULL_STEPS;

  const isFullEditState =
    estadoKey === "ASIGNADO" ||
    estadoKey === "BORRADOR" ||
    estadoKey === "EN_EDICION";

  const editableSteps =
    mode === "create"
      ? FULL_STEPS
      : isDisapproved
        ? allowedSteps
        : isFullEditState || canPrivilegedEditUnassigned
          ? FULL_STEPS
          : allowedSteps;

  const canEditUiStep = (uiStep: number) => {
    if (mode === "create") return true;

    return editableSteps.includes(uiStep);
  };

  return (
    <PermissionsProvider
      hasEditPermissionForSection={canEditUiStep}
      allowedSteps={visibleSteps}
      commentsByStep={isDisapproved ? commentsByStep : {}}
      isDisapprovedCorrection={isDisapproved}
      rejectedUiSteps={isDisapproved ? rejectedSteps : []}
    >
      <StepsProvider
        key={stepsMountKey}
        totalSteps={TOTAL_STEPS}
        allowedSteps={visibleSteps}
      >
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
  );
}

export default function SyllabusProcess() {
  return (
    <SyllabusProvider>
      <CreateDraftProvider>
        <SyllabusProcessContent />
      </CreateDraftProvider>
    </SyllabusProvider>
  );
}
