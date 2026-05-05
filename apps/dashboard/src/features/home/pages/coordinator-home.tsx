import { Key, Mail, FileSearch, List, Plus, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import React from "react";

interface ModuleCardProps {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}

interface Module {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}

function ModuleCard({ icon, title, onClick, disabled }: ModuleCardProps) {
  return (
    <button
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`border-2 rounded-lg p-8 transition-all duration-200 shadow-sm flex flex-col items-center justify-center gap-4 aspect-square
        ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-gray-200"
            : "bg-white hover:bg-gray-50 hover:shadow-md"
        }
      `}
    >
      <div
        className={`p-4 rounded-lg ${
          disabled ? "bg-gray-400 text-gray-200" : "bg-red-600 text-white"
        }`}
      >
        {icon}
      </div>

      <span className="text-base font-semibold text-black text-center">
        {title}
      </span>
    </button>
  );
}

export default function CoordinatorHome() {
  const navigate = useNavigate();

  const modules: Module[] = [
    {
      icon: <Key size={32} />,
      title: "Activar permisos",
      onClick: () => navigate("/coordinator/permissions"),
    },
    {
      icon: <Mail size={32} />,
      title: "Enviar correos",
      onClick: () => navigate("/coordinator/send-email"),
    },
    {
      icon: <FileSearch size={32} />,
      title: "Revisión Académica",
      onClick: () => navigate("/coordinator/review-syllabus"),
    },
    {
      icon: <List size={32} />,
      title: "Catálogo de Sumilla",
      onClick: () => navigate("/coordinator/syllabus-catalog"),
      disabled: false,
    },
    {
      icon: <Plus size={32} />,
      title: "Registrar nuevo Sílabo",
      onClick: () => navigate("/syllabus?mode=create"),
    },
    {
      icon: <Edit size={32} />,
      title: "Modificar Sílabo",
      onClick: () => navigate("/mis-asignaciones"),
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module, index) => (
          <ModuleCard
            key={index}
            icon={module.icon}
            title={module.title}
            onClick={module.onClick}
            disabled={module.disabled}
          />
        ))}
      </div>
    </div>
  );
}