import React from "react";
import { getRoleName } from "../constants/roles";
import { useSession } from "../../features/auth";
import Sidebar from "../components/sidebar";
import Header from "../components/header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const { user, isLoading, isError } = useSession();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-gray-600 text-lg">Verificando sesión...</span>
      </div>
    );
  }

  const redirectUrl = import.meta.env.VITE_REDIRECT_LOGIN as string;
  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-800">
          No has iniciado sesión
        </h2>
        <a href={redirectUrl} className="text-blue-600 hover:underline">
          Ir al inicio de sesión
        </a>
      </div>
    );
  }

  if (getRoleName(user?.role) === "indeterminado") {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Acceso denegado, No tienes un rol permitido en el sistema.
        </h2>
        <h2 className="text-lg font-semibold text-gray-800">
          Comunicarse con soporte.
        </h2>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen overflow-hidden">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col max-h-screen">
        <Header user={user} />
        <main className="p-6 bg-white flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
