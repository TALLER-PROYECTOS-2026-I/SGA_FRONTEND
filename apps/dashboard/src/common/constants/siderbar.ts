export const sidebarMenusByRole = {
  docente: [
    { to: "/", label: "Inicio" },
    { to: "/mis-asignaciones", label: "Mis Asignaciones" },
    { to: "/management", label: "Asignar Docente" },
  ],
  coordinadora_academica: [
    { to: "/", label: "Inicio" },
    { to: "/coordinator/permissions", label: "Activar Permisos" },
    { to: "/coordinator/send-email", label: "Enviar Correo" },
    { to: "/management", label: "Asignar Docente" },
  ],
  director_escuela: [
    { to: "/", label: "Inicio" },
    { to: "/silabus", label: "Silabus" },
    { to: "/management", label: "Asignar Docente" },
    { to: "/director/importar-silabo-firmado", label: "Importar Sílabo" },
  ],
  indeterminado: [],
} as const;

export type RoleKey = keyof typeof sidebarMenusByRole;
