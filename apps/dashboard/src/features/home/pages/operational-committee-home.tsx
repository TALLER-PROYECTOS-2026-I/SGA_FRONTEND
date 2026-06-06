import { ArrowRight, BookOpenCheck, Hand, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function OperationalCommitteeHome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-8 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <Hand size={30} />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Comité Curricular Operativo EPÍCS
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Gestión operativa de asignaciones docentes.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => navigate("/management")}
            className="group bg-white rounded-2xl shadow-md border border-gray-100 p-7 text-left hover:shadow-xl transition-all duration-200 min-h-[180px]"
          >
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md">
                <UserPlus size={30} />
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
                Asignar / Desasignar Docente
              </h3>
              <p className="text-sm text-gray-500 mt-2 max-w-sm">
                Gestiona docentes asignados a sílabos disponibles.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/silabus")}
            className="group bg-white rounded-2xl shadow-md border border-gray-100 p-7 text-left hover:shadow-xl transition-all duration-200 min-h-[180px]"
          >
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md">
                <BookOpenCheck size={30} />
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
              <h3 className="text-xl font-bold text-gray-900">Sílabos</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-sm">
                Consulta el estado de los sílabos registrados.
              </p>
            </div>
          </button>
        </section>
      </div>
    </div>
  );
}
