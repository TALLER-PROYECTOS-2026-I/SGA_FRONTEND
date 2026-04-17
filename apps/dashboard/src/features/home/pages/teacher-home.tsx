import { ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ModuleCardProps {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}

function ModuleCard({ icon, title, onClick }: ModuleCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white hover:bg-gray-50 border-2 border-gray-300 rounded-lg p-8 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-4 aspect-square"
    >
      <div className="bg-red-600 text-white p-4 rounded-lg">{icon}</div>
      <span className="text-base font-semibold text-black text-center">
        {title}
      </span>
    </button>
  );
}

export default function TeacherHome() {
  const navigate = useNavigate();

  const modules = [
    {
      icon: <ClipboardList size={32} />,
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
          />
        ))}
      </div>
    </div>
  );
}
