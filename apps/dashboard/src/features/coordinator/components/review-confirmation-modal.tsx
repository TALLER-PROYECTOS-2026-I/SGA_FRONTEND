import { CheckCircle, XCircle } from "lucide-react";

interface ReviewConfirmationModalProps {
  isOpen: boolean;
  type: "approved" | "rejected";
  onClose: () => void;
}

export function ReviewConfirmationModal({
  isOpen,
  type,
  onClose,
}: ReviewConfirmationModalProps) {
  if (!isOpen) return null;

  const isApproved = type === "approved";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`px-8 py-7 border-b ${
            isApproved
              ? "bg-gradient-to-r from-green-50 via-white to-white border-green-100"
              : "bg-gradient-to-r from-red-50 via-white to-white border-red-100"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-md ${
                isApproved ? "bg-green-600 text-white" : "bg-red-600 text-white"
              }`}
            >
              {isApproved ? <CheckCircle size={34} /> : <XCircle size={34} />}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Revisión finalizada
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                El resultado de la revisión fue registrado correctamente.
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 py-7">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-center">
            <p className="text-sm font-semibold text-gray-500 mb-3">
              Estado del sílabo
            </p>

            <span
              className={`inline-flex items-center justify-center px-6 py-2 rounded-full text-sm font-bold border ${
                isApproved
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {isApproved ? "Aprobado" : "Desaprobado"}
            </span>

            <p className="text-sm text-gray-500 mt-4 leading-relaxed">
              {isApproved
                ? "El sílabo quedó aprobado y podrá continuar con el flujo correspondiente."
                : "El sílabo quedó desaprobado y requiere correcciones antes de volver a revisión."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`mt-6 w-full h-11 rounded-xl text-white font-semibold shadow-sm transition-colors ${
              isApproved
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
