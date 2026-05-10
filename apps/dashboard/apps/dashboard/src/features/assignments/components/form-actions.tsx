import { ArrowLeft, Send } from "lucide-react";

interface FormActionsProps {
  onGoBack: () => void;
  onSubmit: () => void;
}

export default function FormActions({ onGoBack, onSubmit }: FormActionsProps) {
  return (
    <div className="flex justify-between items-center">
      <button
        type="button"
        onClick={onGoBack}
        className="h-11 px-6 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 font-semibold shadow-sm"
      >
        <ArrowLeft size={18} />
        Atrás
      </button>

      <button
        type="button"
        onClick={onSubmit}
        className="h-11 px-8 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 font-semibold shadow-sm"
      >
        <Send size={18} />
        Enviar
      </button>
    </div>
  );
}