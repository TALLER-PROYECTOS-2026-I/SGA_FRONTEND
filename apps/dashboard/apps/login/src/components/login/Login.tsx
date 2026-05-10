import { useMsal } from "@azure/msal-react";
import { Loader2, ShieldCheck } from "lucide-react";
import { useSendTokenToBackend } from "../../hooks/api/login";

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL as string;

function Login() {
  const { instance } = useMsal();
  const { mutate, isPending } = useSendTokenToBackend();

  const handleLoginMicrosoft = async () => {
    try {
      const loginResponse = await instance.loginPopup({
        scopes: [import.meta.env.VITE_AZURE_API_SCOPE],
      });

      const backendToken = loginResponse.idToken;
      await new Promise((r) => setTimeout(r, 500));

      let mailResponse;

      try {
        mailResponse = await instance.acquireTokenSilent({
          scopes: ["Mail.Send"],
          account: loginResponse.account,
        });
      } catch (_silentError) {
        console.warn(
          "Token silencioso falló, intentando con popup...",
          _silentError,
        );

        mailResponse = await instance.acquireTokenPopup({
          scopes: ["Mail.Send"],
        });
      }

      const mailToken = mailResponse.accessToken;

      if (!backendToken || !mailToken) {
        throw new Error("No se obtuvo token de Microsoft");
      }

      mutate(
        {
          baseUrl: BACKEND_URL,
          microsoftToken: backendToken,
          mailToken: mailToken,
        },
        {
          onSuccess: (data) => {
            window.location.href = data.url;
          },
          onError: (error: unknown) => {
            const message =
              error instanceof Error ? error.message : "Error desconocido";

            console.error("Error al crear sesión:", message);
            alert(`Error al crear sesión: ${message}`);
          },
        },
      );
    } catch (error) {
      console.error("Error durante el login con Microsoft:", error);

      const message = error instanceof Error ? error.message : String(error);
      alert(`Error al iniciar sesión: ${message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-950">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/10 to-red-950/40 z-10" />

        <img
          src="/images/login_main2.png"
          alt="Ilustración USMP"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="relative z-20 w-full h-full flex flex-col justify-between p-10">
          <div className="inline-flex items-center gap-3 bg-white/95 backdrop-blur rounded-2xl px-5 py-4 shadow-xl w-fit">
            <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-xl">
              U
            </div>

            <div>
              <p className="text-lg font-bold text-gray-900">USMP</p>
              <p className="text-xs text-gray-500">
                Sistema de Gestión Académica
              </p>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur rounded-2xl p-6 shadow-xl max-w-md">
            <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center mb-4">
              <ShieldCheck size={26} />
            </div>

            <h2 className="text-2xl font-bold text-gray-900">
              Gestión académica segura
            </h2>

            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Accede con tu cuenta institucional para gestionar sílabos,
              asignaciones y revisiones académicas.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full lg:w-1/2 min-h-screen flex items-center justify-center px-6 py-10 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg mb-5">
              <span className="text-3xl font-bold">U</span>
            </div>

            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Iniciar sesión
            </h1>

            <p className="text-gray-500 mt-3 leading-relaxed">
              Ingresa con tu cuenta corporativa de Microsoft para continuar al
              Sistema de Gestión Académica.
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl shadow-xl p-7">
            <div className="mb-6 rounded-2xl bg-red-50 border border-red-100 p-4">
              <p className="text-sm font-bold text-red-700">
                Acceso institucional
              </p>
              <p className="text-sm text-red-600 mt-1">
                Usa únicamente tu cuenta autorizada de Microsoft 365.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLoginMicrosoft}
              disabled={isPending}
              className="w-full h-12 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  SGA conectando...
                </>
              ) : (
                <>
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                    alt="Microsoft"
                    className="w-5 h-5 bg-white rounded-sm"
                  />
                  Iniciar sesión con Microsoft 365
                </>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center mt-5">
              Al continuar, se validará tu identidad y permisos dentro del
              sistema.
            </p>
          </div>

          <p className="text-xs text-gray-400 text-center mt-8">
            © 2026 USMP - Sistema de Gestión Académica
          </p>
        </div>
      </section>
    </div>
  );
}

export default Login;