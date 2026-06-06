import {
  ClipboardList,
  CheckCircle,
  Clock,
  FileText,
  Hand,
  ArrowRight,
  Loader2,
  XCircle,
  LifeBuoy,
  Mail,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../auth/hooks/use-session";
import { useAssignments } from "../../assignments/hooks/assignments-query";
import { TeacherAssignedCoursesContext } from "../components/teacher-assigned-courses-context";

type NormalizedStatus = "APROBADO" | "DESAPROBADO" | "RECHAZADO" | "EN_PROCESO";

function getAssignmentEstadoRevision(assignment: unknown): string | null {
  if (!assignment || typeof assignment !== "object") {
    return null;
  }

  const record = assignment as Record<string, unknown>;
  const value = record.estadoRevision;

  return typeof value === "string" ? value : null;
}

function normalizeStatus(status?: string | null): NormalizedStatus {
  const value = String(status || "")
    .trim()
    .toUpperCase();

  if (value === "APROBADO") {
    return "APROBADO";
  }

  if (value === "DESAPROBADO") {
    return "DESAPROBADO";
  }

  if (value === "RECHAZADO") {
    return "RECHAZADO";
  }

  if (
    value === "ANALIZANDO" ||
    value === "EN_REVISION" ||
    value === "EN REVISIÓN" ||
    value === "PENDIENTE_REVISION" ||
    value === "PENDIENTE" ||
    value === "EN_PROCESO" ||
    value === "EN PROCESO" ||
    value === "ASIGNADO" ||
    value === "NUEVO" ||
    value === "BORRADOR"
  ) {
    return "EN_PROCESO";
  }

  return "EN_PROCESO";
}

export default function TeacherHome() {
  const navigate = useNavigate();
  const { user, isLoading: sessionLoading } = useSession();

  const docenteId = user?.id;

  const { data: assignments = [], isLoading } = useAssignments(docenteId);

  const totalActivos = assignments.length;

  const totalAprobados = assignments.filter((assignment) => {
    const status = normalizeStatus(getAssignmentEstadoRevision(assignment));
    return status === "APROBADO";
  }).length;

  const totalEnProceso = assignments.filter((assignment) => {
    const status = normalizeStatus(getAssignmentEstadoRevision(assignment));
    return status === "EN_PROCESO";
  }).length;

  const totalPendientes = assignments.filter((assignment) => {
    const status = normalizeStatus(getAssignmentEstadoRevision(assignment));
    return status === "DESAPROBADO" || status === "RECHAZADO";
  }).length;

  if (sessionLoading || isLoading) {
    return (
      <div className="p-8 flex items-center justify-center gap-2 text-gray-600">
        <Loader2 className="animate-spin" size={20} />
        Cargando dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Hand size={30} />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Bienvenido, {user?.name || "Docente"}! 👋
              </h1>

              <p className="text-gray-500 text-sm mt-1">
                Sistema de Gestión Académica - USMP
              </p>

              <p className="text-gray-400 text-xs mt-2">
                Gestiona tus sílabos asignados de forma rápida y eficiente.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-red-100 p-5">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <LifeBuoy size={22} />
              </div>

              <div className="min-w-0">
                <h2 className="text-base font-bold text-gray-900">
                  ¿Necesitas ayuda?
                </h2>

                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Si tienes problemas con el sistema, comunícate con soporte
                  técnico.
                </p>

                <a
                  href="mailto:servicedesk@usmp.pe"
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700 border border-red-100 hover:bg-red-100 transition-colors"
                >
                  <Mail size={16} />
                  servicedesk@usmp.pe
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-600 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
            <div>
              <p className="text-sm font-medium opacity-90">Sílabos Activos</p>
              <h2 className="text-3xl font-bold mt-1">{totalActivos}</h2>
            </div>

            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <FileText size={26} />
            </div>
          </div>

          <div className="bg-green-600 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
            <div>
              <p className="text-sm font-medium opacity-90">Aprobados</p>
              <h2 className="text-3xl font-bold mt-1">{totalAprobados}</h2>
            </div>

            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <CheckCircle size={26} />
            </div>
          </div>

          <div className="bg-yellow-500 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
            <div>
              <p className="text-sm font-medium opacity-90">En proceso</p>
              <h2 className="text-3xl font-bold mt-1">{totalEnProceso}</h2>
            </div>

            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Clock size={26} />
            </div>
          </div>

          <div className="bg-red-600 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
            <div>
              <p className="text-sm font-medium opacity-90">Pendientes</p>
              <h2 className="text-3xl font-bold mt-1">{totalPendientes}</h2>
            </div>

            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <XCircle size={26} />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => navigate("/mis-asignaciones")}
            className="group bg-white rounded-2xl shadow-md border border-gray-100 p-7 text-left hover:shadow-xl transition-all duration-200 min-h-[180px]"
          >
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md">
                <ClipboardList size={30} />
              </div>

              <div className="text-red-600 flex items-center gap-1 text-sm font-medium">
                Acceso rápido
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-900">
                Modificar Sílabo
              </h3>

              <p className="text-sm text-gray-500 mt-2 max-w-sm">
                Edita y actualiza los sílabos de tus asignaciones de manera
                rápida y eficiente.
              </p>
            </div>
          </button>
        </section>

        <TeacherAssignedCoursesContext assignments={assignments} />
      </div>
    </div>
  );
}
