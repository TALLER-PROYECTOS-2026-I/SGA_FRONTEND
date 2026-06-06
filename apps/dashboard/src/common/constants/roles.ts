export const roleNames: Record<number, string> = {
  1: "docente",
  2: "director_escuela",
  3: "coordinadora_academica",
  4: "director_escuela",
  5: "comite_curricular_operativo",
} as const;

export type RoleKey = keyof typeof roleNames;
export type RoleName = (typeof roleNames)[RoleKey];

export function getRoleName(role?: number): RoleName | undefined {
  return role ? roleNames[role as RoleKey] : undefined;
}
