import { NavLink } from "react-router-dom";
import { Home } from "lucide-react";
import usmpLogo from "../../assets/Logo_FIA.png";
import { getRoleName } from "../constants/roles";
import { sidebarMenusByRole, type RoleKey } from "../constants/siderbar";
import type HeaderProps from "../types/headerProps";

export default function Sidebar({ user }: HeaderProps) {
  const roleName = getRoleName(user?.role);
  const role = (roleName ?? "indeterminado") as RoleKey;
  const menuItems = sidebarMenusByRole[role] ?? [];

  return (
    <aside className="w-64 bg-[#111827] text-white h-screen flex flex-col border-r border-white/10">
      <div className="px-6 py-7 border-b border-white/10">
        <div className="flex items-center justify-center">
          <img src={usmpLogo} alt="USMP Logo" className="h-20 object-contain" />
        </div>
      </div>

      <nav className="flex-1 px-4 py-6">
        <p className="px-3 mb-4 text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
          Menú
        </p>

        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = "icon" in item && item.icon ? item.icon : Home;

            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    [
                      "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                      isActive
                        ? "bg-white text-gray-900 shadow-md"
                        : "text-gray-300 hover:bg-white/10 hover:text-white",
                    ].join(" ")
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={[
                          "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                          isActive
                            ? "bg-red-600 text-white"
                            : "bg-white/5 text-gray-300 group-hover:bg-red-600 group-hover:text-white",
                        ].join(" ")}
                      >
                        <Icon size={19} />
                      </span>

                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-5 border-t border-white/10">
        <div className="rounded-2xl bg-white/5 px-4 py-4">
          <p className="text-xs font-semibold text-gray-400">Sesión activa</p>

          <p className="mt-1 text-sm font-bold text-white truncate">
            {user?.name || "Usuario"}
          </p>

          <p className="mt-0.5 text-xs text-gray-500 capitalize">
            {role && role !== "indeterminado"
              ? role.replaceAll("_", " ")
              : "usuario"}
          </p>
        </div>

        <p className="mt-4 text-[11px] text-gray-600 text-center">
          © 2026 USMP
        </p>
      </div>
    </aside>
  );
}
