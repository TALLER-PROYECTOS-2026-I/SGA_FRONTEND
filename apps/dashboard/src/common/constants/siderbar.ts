import {
  Home,
  ClipboardList,
  ShieldCheck,
  Mail,
  BookOpenCheck,
  UserPlus,
  Calculator,
  Network,
  History,
} from "lucide-react";

export const sidebarMenusByRole = {
  docente: [
    {
      to: "/",
      label: "Inicio",
      icon: Home,
    },
    {
      to: "/mis-asignaciones",
      label: "Mis Asignaciones",
      icon: ClipboardList,
    },
  ],

  coordinadora_academica: [
    {
      to: "/",
      label: "Inicio",
      icon: Home,
    },
    {
      to: "/coordinator/permissions",
      label: "Activar Permisos",
      icon: ShieldCheck,
    },
    {
      to: "/coordinator/send-email",
      label: "Enviar Correo",
      icon: Mail,
    },
  ],

  director_escuela: [
    {
      to: "/",
      label: "Inicio",
      icon: Home,
    },
    {
      to: "/silabus",
      label: "Sílabos",
      icon: BookOpenCheck,
    },
    {
      to: "/syllabus-versions",
      label: "Versiones de Sílabos",
      icon: History,
    },
    {
      to: "/curriculum",
      label: "Malla Curricular",
      icon: Network,
    },
    {
      to: "/formulas",
      label: "Fórmulas",
      icon: Calculator,
    },
  ],

  comite_curricular_operativo: [
    {
      to: "/",
      label: "Inicio",
      icon: Home,
    },
    {
      to: "/silabus",
      label: "Sílabos",
      icon: BookOpenCheck,
    },
    {
      to: "/management",
      label: "Asignar Docente",
      icon: UserPlus,
    },
  ],

  indeterminado: [],
} as const;

export type RoleKey = keyof typeof sidebarMenusByRole;
