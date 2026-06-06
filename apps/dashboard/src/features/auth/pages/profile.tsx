import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSession } from "@/features/auth/hooks/use-session";
import { getRoleName } from "@/common/constants/roles";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useToast } from "@/common/hooks/use-toast";
import {
  useProfile,
  type ProfileData,
} from "@/features/auth/hooks/use-profile";
import {
  ArrowLeft,
  Briefcase,
  Check,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  User,
  X,
  AlertTriangle,
} from "lucide-react";

const roleDisplayNames = {
  docente: "Docente",
  coordinadora_academica: "Coordinador Académico",
  director_escuela: "Director",
  indeterminado: "Usuario",
} as const;

const EMPTY_PROFILE: ProfileData = {
  firstName: "",
  lastName: "",
  profession: "",
  email: "",
  phone: "",
  photo: null,
};

function normalizeProfile(profile?: ProfileData | null): ProfileData {
  return {
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    profession: profile?.profession ?? "",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    photo: profile?.photo ?? null,
  };
}

function areProfilesEqual(a: ProfileData, b: ProfileData): boolean {
  return (
    a.firstName === b.firstName &&
    a.lastName === b.lastName &&
    a.profession === b.profession &&
    a.email === b.email &&
    a.phone === b.phone &&
    a.photo === b.photo
  );
}

export default function Profile() {
  const location = useLocation();
  const { user: sessionUser } = useSession();
  const toast = useToast();

  const { profile, isLoading, isError, updateProfile, isUpdating } =
    useProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>(EMPTY_PROFILE);

  const roleName = getRoleName(sessionUser?.role);
  const roleDisplayName =
    roleDisplayNames[roleName as keyof typeof roleDisplayNames] || "Usuario";

  useEffect(() => {
    setIsEditing(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!profile || isEditing) return;

    const normalizedProfile = normalizeProfile(profile);

    setProfileData((currentProfileData) => {
      if (areProfilesEqual(currentProfileData, normalizedProfile)) {
        return currentProfileData;
      }

      return normalizedProfile;
    });
  }, [
    profile?.firstName,
    profile?.lastName,
    profile?.profession,
    profile?.email,
    profile?.phone,
    profile?.photo,
    isEditing,
  ]);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateProfile(profileData, {
      onSuccess: () => {
        toast.success(
          "Perfil actualizado",
          "Los cambios se guardaron correctamente ✅",
        );
        setIsEditing(false);
      },
      onError: (error: Error) => {
        if (error.message.includes("No hay cambios")) {
          toast.info("Sin cambios", "No se detectaron cambios para guardar");
          setIsEditing(false);
        } else {
          toast.error(
            "Error",
            error.message || "No se pudo actualizar el perfil ⚠️",
          );
        }
      },
    });
  };

  const handleCancel = () => {
    if (profile) {
      setProfileData(normalizeProfile(profile));
    }

    setIsEditing(false);
  };

  const handleBackHome = () => {
    window.location.href = "/";
  };

  const fields = [
    {
      label: "Nombre",
      field: "firstName" as const,
      icon: User,
      type: "text",
      placeholder: "Ingrese su nombre",
    },
    {
      label: "Apellidos",
      field: "lastName" as const,
      icon: User,
      type: "text",
      placeholder: "Ingrese sus apellidos",
    },
    {
      label: "Profesión",
      field: "profession" as const,
      icon: Briefcase,
      type: "text",
      placeholder: "Ingrese su profesión",
    },
    {
      label: "Correo",
      field: "email" as const,
      icon: Mail,
      type: "email",
      placeholder: "correo@usmp.pe",
    },
    {
      label: "Teléfono",
      field: "phone" as const,
      icon: Phone,
      type: "tel",
      placeholder: "999999999",
    },
  ];

  if (isLoading && !profile) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-8 py-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl px-8 py-7 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <Loader2 className="animate-spin" size={24} />
          </div>

          <div>
            <p className="text-base font-bold text-gray-900">Cargando perfil</p>
            <p className="text-sm text-gray-500 mt-1">
              Obteniendo información de tu cuenta...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-8 py-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-red-100 shadow-xl p-8 max-w-md w-full">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-5">
            <AlertTriangle size={30} />
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Error al cargar el perfil
          </h1>

          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            No se pudo obtener la información del perfil. Por favor, intenta
            nuevamente.
          </p>

          <button
            type="button"
            onClick={handleBackHome}
            className="mt-6 h-11 px-6 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 font-semibold shadow-sm"
          >
            <ArrowLeft size={18} />
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-7">
          <h1 className="text-3xl font-bold text-gray-900">
            Perfil {roleDisplayName}
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Consulta y actualiza la información de tu cuenta institucional.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="px-8 py-7 border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <UserAvatar className="w-24 h-24 border-4 border-white shadow-md" />

                  <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md">
                    <ShieldCheck size={18} />
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {`${profileData.firstName || ""} ${
                      profileData.lastName || ""
                    }`.trim() ||
                      sessionUser?.name ||
                      "Usuario"}
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    {profileData.email ||
                      sessionUser?.email ||
                      "Correo no disponible"}
                  </p>

                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-100 px-3 py-1 text-xs font-bold text-red-700">
                    <ShieldCheck size={14} />
                    {roleDisplayName}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isEditing ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                    <Pencil size={16} />
                    Modo edición
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                    <Check size={16} />
                    Perfil activo
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-8">
            {isEditing && (
              <div className="mb-7 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Pencil size={19} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-blue-900">
                      Editando perfil
                    </p>
                    <p className="text-sm text-blue-700 mt-1 leading-relaxed">
                      Solo modifica los campos que deseas actualizar. El correo
                      institucional permanece bloqueado.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
              <aside className="rounded-2xl border border-gray-100 bg-gray-50 p-6 h-fit">
                <div className="flex flex-col items-center text-center">
                  <UserAvatar className="w-36 h-36 border-4 border-white shadow-md" />

                  <h3 className="text-lg font-bold text-gray-900 mt-5">
                    {profileData.firstName || "Usuario"}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    {roleDisplayName}
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="rounded-xl bg-white border border-gray-100 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                      Rol
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {roleDisplayName}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white border border-gray-100 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                      Estado
                    </p>
                    <p className="text-sm font-semibold text-green-700 mt-1">
                      Activo
                    </p>
                  </div>
                </div>
              </aside>

              <section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {fields.map(
                    ({ label, field, icon: Icon, type, placeholder }) => {
                      const isEmail = field === "email";
                      const disabled = isEmail || !isEditing;

                      return (
                        <div key={field}>
                          <label className="block text-sm font-bold text-gray-900 mb-2">
                            {label}
                          </label>

                          <div className="relative">
                            <Icon
                              size={18}
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <input
                              type={type}
                              value={profileData[field] || ""}
                              onChange={(e) =>
                                handleInputChange(field, e.target.value)
                              }
                              disabled={disabled}
                              placeholder={placeholder}
                              className={`w-full h-12 pl-12 pr-4 rounded-xl border text-sm outline-none transition-all ${
                                disabled
                                  ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                                  : "bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              }`}
                            />
                          </div>

                          {isEmail && (
                            <p className="text-xs text-gray-400 mt-2">
                              El correo institucional no se puede editar.
                            </p>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleBackHome}
                    className="h-11 px-6 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 font-semibold shadow-sm"
                  >
                    <ArrowLeft size={18} />
                    Volver al inicio
                  </button>

                  <div className="flex flex-col sm:flex-row gap-3">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="h-11 px-6 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-semibold shadow-sm"
                          disabled={isUpdating}
                        >
                          <X size={18} />
                          Cancelar
                        </button>

                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={isUpdating}
                          className="h-11 px-7 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-sm"
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 size={18} className="animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Save size={18} />
                              Guardar cambios
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="h-11 px-7 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-semibold shadow-sm"
                      >
                        <Pencil size={18} />
                        Editar perfil
                      </button>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
