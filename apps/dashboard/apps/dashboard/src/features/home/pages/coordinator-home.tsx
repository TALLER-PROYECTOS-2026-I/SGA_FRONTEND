import {
  Key,
  Mail,
  CheckSquare,
  List,
  Plus,
  Edit,
  Hand,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import React from "react";

interface ModuleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}

interface Module {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}

function ModuleCard({
  icon,
  title,
  description,
  onClick,
  disabled,
}: ModuleCardProps) {
  return (
    <button
      type="button"
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`group bg-white rounded-2xl border border-gray-100 p-7 text-left shadow-md transition-all duration-200 min-h-[190px]
        ${
          disabled
            ? "opacity-60 cursor-not-allowed bg-gray-100"
            : "hover:shadow-xl hover:-translate-y-1"
        }
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-md ${
            disabled ? "bg-gray-400 text-white" : "bg-red-600 text-white"
          }`}
        >
          {icon}
        </div>

        {!disabled && (
          <div className="text-red-600 flex items-center gap-1 text-sm font-semibold">
            Acceso rápido
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </div>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          {description}
        </p>
      </div>
    </button>
  );
}

export default function CoordinatorHome() {
  const navigate = useNavigate();

  const modules: Module[] = [
    {
      icon: <Key size={30} />,
      title: "Activar permisos",
      description: "Gestiona accesos y permisos de usuarios del sistema.",
      onClick: () => navigate("/coordinator/permissions"),
    },
    {
      icon: <Mail size={30} />,
      title: "Enviar correos",
      description: "Envía notificaciones y comunicados académicos.",
      onClick: () => navigate("/coordinator/send-email"),
    },
    {
      icon: <CheckSquare size={30} />,
      title: "Seguimiento de Sílabo",
      description: "Revisa el estado y avance de los sílabos registrados.",
      onClick: () => navigate("/coordinator/review-syllabus"),
    },
    {
      icon: <List size={30} />,
      title: "Catálogo de Sumilla",
      description: "Consulta y administra el catálogo de sumillas.",
      onClick: () => navigate("/coordinator/syllabus-catalog"),
      disabled: false,
    },
    {
      icon: <Plus size={30} />,
      title: "Registrar nuevo Sílabo",
      description: "Crea un nuevo sílabo académico desde cero.",
      onClick: () => navigate("/syllabus?mode=create"),
    },
    {
      icon: <Edit size={30} />,
      title: "Modificar Sílabo",
      description: "Edita y actualiza los sílabos existentes.",
      onClick: () => navigate("/mis-asignaciones"),
    },
  ];

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-8 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <Hand size={30} />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bienvenido, Comité Curricular EPICS 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Sistema de Gestión Académica - USMP
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Administra permisos, correos, sumillas y sílabos desde un solo
              lugar.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-600 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
            <div>
              <p className="text-sm font-medium opacity-90">
                Gestión de permisos
              </p>
              <h2 className="text-2xl font-bold mt-1">Activar</h2>
            </div>

            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Key size={26} />
            </div>
          </div>

          <div className="bg-green-600 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
            <div>
              <p className="text-sm font-medium opacity-90">
                Seguimiento académico
              </p>
              <h2 className="text-2xl font-bold mt-1">Validar</h2>
            </div>

            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <CheckSquare size={26} />
            </div>
          </div>

          <div className="bg-red-600 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
            <div>
              <p className="text-sm font-medium opacity-90">
                Gestión de sílabos
              </p>
              <h2 className="text-2xl font-bold mt-1">Registrar</h2>
            </div>

            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Plus size={26} />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, index) => (
            <ModuleCard
              key={index}
              icon={module.icon}
              title={module.title}
              description={module.description}
              onClick={module.onClick}
              disabled={module.disabled}
            />
          ))}
        </section>
      </div>
    </div>
  );
}