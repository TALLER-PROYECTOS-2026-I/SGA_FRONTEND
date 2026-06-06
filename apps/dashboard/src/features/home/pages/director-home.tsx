import {
  UserPlus,
  FileCheck,
  Hand,
  Users,
  ClipboardCheck,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DirectorHome() {
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
              Bienvenido, Director 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Sistema de Gestión Académica - USMP
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Administra asignaciones docentes y revisa los sílabos registrados.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-600 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
            <div>
              <p className="text-sm font-medium opacity-90">Gestión Docente</p>
              <h2 className="text-3xl font-bold mt-1">Asignar</h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Users size={26} />
            </div>
          </div>

          <div className="bg-green-600 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
            <div>
              <p className="text-sm font-medium opacity-90">
                Revisión de Sílabos
              </p>
              <h2 className="text-3xl font-bold mt-1">Validar</h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <ClipboardCheck size={26} />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => navigate("/syllabus-versions")}
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
                Versiones de Sílabos
              </h3>
              <p className="text-sm text-gray-500 mt-2 max-w-sm">
                Gestiona la asignación de docentes a cursos y sílabos.
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
                <FileCheck size={30} />
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
                Revisa y valida los sílabos enviados por los docentes.
              </p>
            </div>
          </button>
        </section>
      </div>
    </div>
  );
}
