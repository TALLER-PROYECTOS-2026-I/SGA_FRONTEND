import { useMsal } from "@azure/msal-react";
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
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Columna izquierda con imagen */}
      <div className="md:w-1/2 flex items-center justify-center bg-gradient-to-br">
        <div className="rounded-2xl overflow-hidden shadow-lg border-4 border-white w-4/5 max-w-md">
          <img
            src="/images/login_main.jpg"
            alt="Ilustración USMP"
            className="object-cover w-full h-full border-7 border-red-500 rounded"
          />
        </div>
      </div>

      {/* Columna derecha con formulario */}
      <div className="md:w-1/2 flex flex-col justify-center items-center px-8 py-12 bg-white">
        <div className="flex items-center justify-center bg-gradient-to-br pb-3">
          <div className="rounded-2xl overflow-hidden shadow-lg border-4 border-white w-4/5 max-w-md">
            <img
              src="data:image/png;base64,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"
              alt="Microsoft"
              className="object-cover w-full h-full"
            />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-red-600 mb-6 font-poppins">
          INICIAR SESIÓN
        </h1>

        <p className="text-gray-600 mb-10 text-center max-w-md">
          Inicia sesión con tu cuenta corporativa de Microsoft para continuar.
        </p>

        <button
          onClick={handleLoginMicrosoft}
          disabled={isPending}
          className={`flex items-center justify-center gap-3 font-semibold px-6 py-3 rounded-lg shadow-md transition-transform transform ${
            isPending
              ? "bg-red-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700 text-white hover:scale-105"
          }`}
        >
          {isPending
            ? "SGA conectando....."
            : "Iniciar sesión con Microsoft 365"}
          {!isPending && (
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
              alt="Microsoft"
              className="w-6 h-6"
            />
          )}
        </button>
      </div>
    </div>
  );
}

export default Login;
