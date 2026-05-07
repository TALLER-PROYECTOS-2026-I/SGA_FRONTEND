// coordinator-home.tsx
// Archivo encargado de mostrar el panel principal del coordinador.
// Desde esta pantalla se accede a los módulos principales como permisos,
// correos, revisión académica, seguimiento de sílabos, catálogo y gestión de sílabos.

// =====================================================
// IMPORTS
// =====================================================

// Importa íconos desde lucide-react.
// Cada ícono se usa para representar visualmente un módulo del panel.
import {
  // Ícono usado para el módulo de activar permisos.
  Key,

  // Ícono usado para el módulo de enviar correos.
  Mail,

  // Ícono usado para el módulo de revisión académica.
  FileSearch,

  // Ícono usado para el módulo de seguimiento de sílabos.
  ClipboardList,

  // Ícono usado para el módulo de catálogo de sumillas.
  List,

  // Ícono usado para el módulo de registrar nuevo sílabo.
  Plus,

  // Ícono usado para el módulo de modificar sílabo.
  Edit,
} from "lucide-react";

// Importa useNavigate desde React Router.
// Sirve para redirigir al usuario a otras rutas al hacer clic en un módulo.
import { useNavigate } from "react-router-dom";

// Importa React.
// Se usa principalmente para tipar icon como React.ReactNode.
import React from "react";

// =====================================================
// INTERFACES
// =====================================================

// Define las props que recibe el componente ModuleCard.
interface ModuleCardProps {
  // Ícono que se mostrará en la tarjeta.
  icon: React.ReactNode;

  // Título visible del módulo.
  title: string;

  // Función que se ejecuta al hacer clic en la tarjeta.
  onClick: () => void;

  // Indica si la tarjeta estará deshabilitada.
  disabled?: boolean;
}

// Define la estructura de cada módulo del panel.
interface Module {
  // Ícono del módulo.
  icon: React.ReactNode;

  // Nombre del módulo.
  title: string;

  // Acción de navegación o ejecución del módulo.
  onClick: () => void;

  // Indica si el módulo está deshabilitado.
  disabled?: boolean;
}

// =====================================================
// COMPONENTE DE TARJETA DE MÓDULO
// =====================================================

// Componente reutilizable para mostrar una tarjeta del panel.
// Recibe un ícono, título, acción de clic y estado deshabilitado.
function ModuleCard({ icon, title, onClick, disabled }: ModuleCardProps) {
  return (
    <button
      type="button"
      // Si la tarjeta no está deshabilitada, ejecuta onClick.
      // Si está deshabilitada, no ejecuta ninguna acción.
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
      {/* Contenedor visual del ícono.
          Cambia de color si el módulo está deshabilitado. */}
      <div
        className={`p-4 rounded-lg ${
          disabled ? "bg-gray-400 text-gray-200" : "bg-red-600 text-white"
        }`}
      >
        {icon}
      </div>

      {/* Texto del módulo mostrado debajo del ícono. */}
      <span className="text-base font-semibold text-black text-center">
        {title}
      </span>
    </button>
  );
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

// Componente principal del panel del coordinador.
// Muestra una grilla de módulos y permite navegar a cada funcionalidad.
export default function CoordinatorHome() {
  // Hook para navegar entre rutas de la aplicación.
  const navigate = useNavigate();

  // Lista de módulos disponibles para el coordinador.
  // Cada objeto define el ícono, título y ruta a la que debe navegar.
  const modules: Module[] = [
    {
      // Módulo para activar permisos de edición o revisión.
      icon: <Key size={32} />,
      title: "Activar permisos",
      onClick: () => navigate("/coordinator/permissions"),
    },
    {
      // Módulo para enviar correos desde el panel del coordinador.
      icon: <Mail size={32} />,
      title: "Enviar correos",
      onClick: () => navigate("/coordinator/send-email"),
    },
    {
      // Módulo para revisar sílabos enviados a revisión académica.
      icon: <FileSearch size={32} />,
      title: "Revisión Académica",
      onClick: () => navigate("/coordinator/review-syllabus"),
    },
    {
      // Módulo para consultar el estado operativo de los sílabos.
      icon: <ClipboardList size={32} />,
      title: "Seguimiento de Sílabos",
      onClick: () => navigate("/coordinator/syllabus-tracking"),
    },
    {
      // Módulo para acceder al catálogo de sumillas.
      icon: <List size={32} />,
      title: "Catálogo de Sumilla",
      onClick: () => navigate("/coordinator/syllabus-catalog"),

      // Actualmente está habilitado.
      disabled: false,
    },
    {
      // Módulo para iniciar el registro de un nuevo sílabo.
      icon: <Plus size={32} />,
      title: "Registrar nuevo Sílabo",
      onClick: () => navigate("/syllabus?mode=create"),
    },
    {
      // Módulo para modificar un sílabo desde la vista de asignaciones.
      icon: <Edit size={32} />,
      title: "Modificar Sílabo",
      onClick: () => navigate("/mis-asignaciones"),
    },
  ];

  // Renderiza la grilla de módulos.
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recorre la lista de módulos y genera una tarjeta por cada uno. */}
        {modules.map((module) => (
          <ModuleCard
            key={module.title}
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