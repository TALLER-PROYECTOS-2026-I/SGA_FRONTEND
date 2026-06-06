import {
  useAssignments,
  type Assignment,
} from "../../assignments/hooks/assignments-query";
import { useState } from "react";
import {
  Eye,
  Search,
  ClipboardList,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";

type AssignmentStatus =
  | "APROBADO"
  | "ANALIZANDO"
  | "DESAPROBADO"
  | "ASIGNADO"
  | "NUEVO";

export default function CoordinatorAssignments() {
  const {
    data: assignments = [],
    isLoading,
    isError,
    error,
  } = useAssignments(null);

  const [searchTerm, setSearchTerm] = useState("");

  const statusConfig: Record<
    AssignmentStatus,
    { label: string; color: string; textColor: string; bgColor: string }
  > = {
    APROBADO: {
      label: "Aprobado",
      color: "bg-green-500",
      textColor: "text-green-700",
      bgColor: "bg-green-50",
    },
    ANALIZANDO: {
      label: "Pendiente",
      color: "bg-yellow-500",
      textColor: "text-yellow-700",
      bgColor: "bg-yellow-50",
    },
    DESAPROBADO: {
      label: "Desaprobado",
      color: "bg-red-500",
      textColor: "text-red-700",
      bgColor: "bg-red-50",
    },
    ASIGNADO: {
      label: "Asignado",
      color: "bg-blue-500",
      textColor: "text-blue-700",
      bgColor: "bg-blue-50",
    },
    NUEVO: {
      label: "Nuevo",
      color: "bg-purple-500",
      textColor: "text-purple-700",
      bgColor: "bg-purple-50",
    },
  };

  const filteredAssignments = assignments.filter((assignment: Assignment) => {
    const search = searchTerm.toLowerCase();

    return (
      assignment.cursoNombre?.toLowerCase().includes(search) ||
      assignment.cursoCodigo?.toLowerCase().includes(search) ||
      assignment.nombreDocente?.toLowerCase().includes(search)
    );
  });

  const totalAprobados = assignments.filter(
    (a: Assignment) => a.estadoRevision === "APROBADO",
  ).length;

  const totalPendientes = assignments.filter((a: Assignment) =>
    ["ASIGNADO", "ANALIZANDO", "NUEVO"].includes(a.estadoRevision),
  ).length;

  const totalDesaprobados = assignments.filter(
    (a: Assignment) => a.estadoRevision === "DESAPROBADO",
  ).length;

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-md px-8 py-6 flex items-center gap-3 text-gray-600">
          <Loader2 className="animate-spin text-red-600" size={22} />
          Cargando asignaciones...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-gray-50 flex items-center justify-center px-8">
        <div className="bg-white border border-red-100 rounded-2xl shadow-md px-8 py-6 text-red-600 max-w-xl text-center">
          Error: {error?.message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-7">
          <h1 className="text-3xl font-bold text-gray-900">Asignaciones</h1>
          <p className="text-sm text-gray-500 mt-1">
            Consulta las asignaciones registradas por curso, docente y estado.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md">
                <ClipboardList size={30} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Listado de Asignaciones
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Revisa las asignaciones activas y su estado de revisión.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-600 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium opacity-90">Total</p>
                  <h2 className="text-3xl font-bold mt-1">
                    {assignments.length}
                  </h2>
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
                  <p className="text-sm font-medium opacity-90">Pendientes</p>
                  <h2 className="text-3xl font-bold mt-1">{totalPendientes}</h2>
                </div>

                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Clock size={26} />
                </div>
              </div>

              <div className="bg-red-600 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium opacity-90">Desaprobados</p>
                  <h2 className="text-3xl font-bold mt-1">
                    {totalDesaprobados}
                  </h2>
                </div>

                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <XCircle size={26} />
                </div>
              </div>
            </section>

            <div className="relative mb-6">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />

              <input
                type="text"
                placeholder="Buscar por curso, código o docente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm text-sm text-gray-700 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-700">
                      <th className="px-6 py-4 text-left font-bold w-[16%]">
                        Código
                      </th>
                      <th className="px-6 py-4 text-left font-bold w-[34%]">
                        Curso
                      </th>
                      <th className="px-6 py-4 text-left font-bold w-[26%]">
                        Docente
                      </th>
                      <th className="px-6 py-4 text-left font-bold w-[16%]">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-center font-bold w-[8%]">
                        Acción
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAssignments.map(
                      (assignment: Assignment, index: number) => {
                        const cfg = statusConfig[
                          assignment.estadoRevision as AssignmentStatus
                        ] ?? {
                          label: assignment.estadoRevision,
                          color: "bg-gray-400",
                          textColor: "text-gray-700",
                          bgColor: "bg-gray-100",
                        };

                        return (
                          <tr
                            key={`${assignment.cursoCodigo}-${assignment.docenteId}-${index}`}
                            className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-5 font-semibold text-gray-800">
                              {assignment.cursoCodigo || "N/A"}
                            </td>

                            <td className="px-6 py-5">
                              <div className="font-bold text-gray-900">
                                {assignment.cursoNombre}
                              </div>
                            </td>

                            <td className="px-6 py-5 text-gray-700">
                              {assignment.nombreDocente || "No asignado"}
                            </td>

                            <td className="px-6 py-5">
                              <div className="inline-flex items-center gap-2">
                                <span
                                  className={`w-3 h-3 rounded-full ${cfg.color}`}
                                />
                                <span
                                  className={`px-3 py-1 rounded-lg text-xs font-semibold border ${cfg.bgColor} ${cfg.textColor}`}
                                >
                                  {cfg.label}
                                </span>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  className="w-9 h-9 flex items-center justify-center text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                                  title="Ver asignación"
                                >
                                  <Eye size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>

              {filteredAssignments.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search className="text-gray-400" size={30} />
                  </div>
                  <p className="text-gray-500">
                    No se encontraron asignaciones que coincidan con tu
                    búsqueda.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
