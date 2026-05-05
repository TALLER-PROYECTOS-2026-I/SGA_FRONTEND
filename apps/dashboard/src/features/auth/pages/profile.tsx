import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSession } from "@/features/auth/hooks/use-session";
import { getRoleName } from "@/common/constants/roles";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useToast } from "@/common/hooks/use-toast";
import {
  useProfile,
  type ProfileData,
} from "@/features/auth/hooks/use-profile";

const roleDisplayNames = {
  docente: "Profesor",
  coordinadora_academica: "Coordinador Académico",
  director_escuela: "Director",
  indeterminado: "Usuario",
} as const;

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSession();
  const toast = useToast();

  const { profile, isLoading, isError, updateProfile, isUpdating } =
    useProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    profession: "",
    email: "",
    phone: "",
    photo: null,
  });

  const roleName = getRoleName(user?.role);
  const roleDisplayName =
    roleDisplayNames[roleName as keyof typeof roleDisplayNames] || "Usuario";

  // ✅ Resetear estado al cambiar de ruta
  useEffect(() => {
    setIsEditing(false);
  }, [location.pathname]);

  useEffect(() => {
    if (profile && !isEditing) {
      setProfileData({
        ...profile,
        phone: profile.phone || "", // Asegurar que no sea null
      });
    }
  }, [profile, isEditing]);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    let sanitizedValue = value;

    // Validación en tiempo real según el campo
    if (field === "firstName" || field === "lastName") {
      // Reemplaza cualquier número (0-9) por nada (lo elimina)
      sanitizedValue = value.replace(/[0-9]/g, "");
    } else if (field === "phone") {
      // Reemplaza cualquier cosa que NO sea un dígito por nada (solo deja números)
      sanitizedValue = value.replace(/\D/g, "");
    }

    setProfileData((prev) => ({ ...prev, [field]: sanitizedValue }));
  };

  const handleSave = () => {
    // 1. Validaciones Frontend antes de enviar al Backend
    if (!profileData.firstName?.trim()) {
      return toast.error("Validación", "El campo Nombres es obligatorio.");
    }
    if (!profileData.lastName?.trim()) {
      return toast.error("Validación", "El campo Apellidos es obligatorio.");
    }
    if (!profileData.profession?.trim()) {
      return toast.error(
        "Validación",
        "El campo Grado/Profesión Académica es obligatorio.",
      );
    }

    // Validación de celular peruano (solo si ingresó algo)
    const phoneValue = profileData.phone?.trim();
    if (phoneValue && !/^9\d{8}$/.test(phoneValue)) {
      return toast.error(
        "Validación",
        "El teléfono celular debe tener 9 dígitos y empezar con 9.",
      );
    }

    // 2. Ejecutar actualización
    updateProfile(profileData, {
      onSuccess: () => {
        toast.success(
          "Datos actualizados correctamente",
          "Los cambios se han guardado exitosamente",
        );
        setIsEditing(false);
      },
      onError: (error: Error) => {
        console.error("❌ Error al guardar perfil:", error);

        if (error.message.includes("No hay cambios")) {
          toast.info("Sin cambios", "No se detectaron cambios para guardar");
          setIsEditing(false);
        } else {
          toast.error(
            "Error",
            "No se pudo actualizar el perfil. Verifique los datos e intente nuevamente.",
          );
        }
      },
    });
  };

  const handleCancel = () => {
    if (profile) {
      setProfileData({ ...profile, phone: profile.phone || "" });
    }
    setIsEditing(false);
  };

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-lg">Cargando perfil...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-lg text-red-600">
          Error al cargar el perfil. Por favor, intente de nuevo.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Botón Volver (Fuera de la tarjeta) */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 font-medium transition-colors"
        >
          <svg
            className="w-5 h-5 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Cabecera de la tarjeta: Título y Botones */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold text-slate-800">
              Perfil {roleDisplayName}
            </h1>

            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2.5 bg-slate-500 text-white font-medium rounded-lg hover:bg-slate-600 transition-colors"
                    disabled={isUpdating}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="px-6 py-2.5 bg-red-700 text-white font-medium rounded-lg hover:bg-red-800 transition-colors disabled:opacity-60 flex items-center gap-2"
                  >
                    {isUpdating ? "Guardando..." : "Guardar"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2.5 bg-red-700 text-white font-medium rounded-lg hover:bg-red-800 transition-colors flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Editar
                </button>
              )}
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="w-40 h-40 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 overflow-hidden shadow-sm">
                <UserAvatar className="w-full h-full" />
              </div>
            </div>

            {/* Formulario */}
            <div className="flex-1">
              {/* Sección 1: Datos Personales (Editables) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Nombres <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileData.firstName || ""}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    disabled={!isEditing}
                    className={`w-full p-3 border rounded-lg transition-colors ${
                      isEditing
                        ? "border-gray-300 bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                        : "border-gray-200 bg-slate-50 text-slate-600"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Apellidos <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileData.lastName || ""}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    disabled={!isEditing}
                    className={`w-full p-3 border rounded-lg transition-colors ${
                      isEditing
                        ? "border-gray-300 bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                        : "border-gray-200 bg-slate-50 text-slate-600"
                    }`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Grado/Profesión Académica{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileData.profession || ""}
                    onChange={(e) =>
                      handleInputChange("profession", e.target.value)
                    }
                    disabled={!isEditing}
                    className={`w-full p-3 border rounded-lg transition-colors ${
                      isEditing
                        ? "border-gray-300 bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                        : "border-gray-200 bg-slate-50 text-slate-600"
                    }`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Teléfono Celular
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    disabled={!isEditing}
                    maxLength={9}
                    className={`w-full p-3 border rounded-lg transition-colors ${
                      isEditing
                        ? "border-gray-300 bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                        : "border-gray-200 bg-slate-50 text-slate-600"
                    }`}
                  />
                </div>
              </div>

              {/* Sección 2: Datos Institucionales (Solo lectura) */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">
                  Datos Institucionales (Solo lectura)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Correo Institucional
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={profileData.email || ""}
                        disabled
                        className="w-full p-3 pr-10 border border-gray-200 bg-slate-50 text-slate-500 rounded-lg cursor-not-allowed"
                      />
                      <svg
                        className="w-5 h-5 text-slate-400 absolute right-3 top-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Rol Funcional
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={roleDisplayName}
                        disabled
                        className="w-full p-3 pr-10 border border-gray-200 bg-slate-50 text-slate-500 rounded-lg cursor-not-allowed"
                      />
                      <svg
                        className="w-5 h-5 text-slate-400 absolute right-3 top-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 3: Reglas de Edición (Caja Azul) */}
              <div className="mt-8 bg-blue-50/50 border-l-4 border-blue-600 p-5 rounded-r-xl">
                <div className="flex gap-3">
                  <svg
                    className="w-6 h-6 text-blue-600 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h4 className="text-sm font-bold text-blue-900 mb-2">
                      Reglas de Edición del Perfil
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1.5 list-disc list-inside">
                      <li>
                        <strong>Campos editables:</strong> Nombres, Apellidos,
                        Grado/Profesión Académica y Teléfono
                      </li>
                      <li>
                        <strong>Campos bloqueados:</strong> Correo Institucional
                        y Rol Funcional (datos de control)
                      </li>
                      <li>
                        <strong>Formato de teléfono:</strong> Debe tener 9
                        dígitos y empezar con 9 (formato peruano)
                      </li>
                      <li>
                        Los campos marcados con{" "}
                        <span className="text-red-600 font-bold">*</span> son
                        obligatorios
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
