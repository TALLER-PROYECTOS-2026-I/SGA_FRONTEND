import { useEffect, useRef, useState } from "react";
import type HeaderProps from "../types/headerProps";
import { Link } from "react-router-dom";
import { authService } from "../../features/auth/services/auth-service";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { getRoleName } from "../constants/roles";
import {
  ChevronDown,
  GraduationCap,
  LogOut,
  User,
} from "lucide-react";

const roleDisplayNames = {
  docente: "Docente",
  coordinadora_academica: "Coordinador",
  director_escuela: "Director",
  indeterminado: "Usuario",
} as const;

const roleSubtitle = {
  docente: "Cuenta docente",
  coordinadora_academica: "Gestión Académica",
  director_escuela: "Dirección de Escuela",
  indeterminado: "Sistema Académico",
} as const;

export default function Header({ user }: HeaderProps) {
  const displayName = user?.name || user?.email || "Usuario";
  const email = user?.email || "";

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const roleName = getRoleName(user?.role);
  const roleLabel =
    roleDisplayNames[roleName as keyof typeof roleDisplayNames] || "Usuario";
  const subtitle =
    roleSubtitle[roleName as keyof typeof roleSubtitle] || "Sistema Académico";

  const handleLogout = async () => {
    try {
      await authService.logout();
      window.location.href = import.meta.env.VITE_REDIRECT_LOGIN;
    } catch {
      window.location.href = import.meta.env.VITE_REDIRECT_LOGIN;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="w-full h-[72px] bg-red-700 text-white flex items-center justify-between px-6 relative shadow-sm">
      <div className="hidden md:flex items-center">
        <div className="inline-flex items-center gap-3 rounded-xl border border-white/30 bg-white/10 px-4 py-2 shadow-sm backdrop-blur">
          <div className="w-9 h-9 rounded-lg bg-yellow-400 text-gray-900 flex items-center justify-center shadow-sm">
            <GraduationCap size={21} />
          </div>

          <div className="leading-tight">
            <p className="text-sm font-bold text-white">{roleLabel}</p>
            <p className="text-[11px] font-medium text-white/80">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="relative ml-auto" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="group bg-white text-gray-900 pl-2 pr-4 py-2 rounded-xl shadow-md flex items-center gap-3 hover:bg-gray-50 transition-all border border-white/20"
        >
          <UserAvatar className="w-9 h-9" />

          <div className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-sm font-bold max-w-[180px] truncate">
              {displayName}
            </span>
            <span className="text-xs text-gray-500">Sesión activa</span>
          </div>

          <ChevronDown
            size={18}
            className={`text-gray-500 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <div className="absolute right-0 mt-3 w-60 bg-white text-gray-900 rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
            <div className="px-4 py-4 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-semibold text-gray-400 uppercase">
                Cuenta
              </p>

              <p className="text-sm font-bold text-gray-900 truncate mt-1">
                {displayName}
              </p>

              {email && (
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {email}
                </p>
              )}

              <div className="mt-3 inline-flex items-center rounded-full bg-red-50 border border-red-100 px-3 py-1 text-xs font-bold text-red-700">
                {roleLabel}
              </div>
            </div>

            <div className="p-2">
              <Link
                to="/perfil"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setOpen(false)}
              >
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <User size={17} />
                </span>
                Ver perfil
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                <span className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <LogOut size={17} />
                </span>
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}