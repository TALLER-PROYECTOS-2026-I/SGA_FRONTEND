interface MessageTextareaProps {
  message: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  charCount: number;
  maxChars: number;
}

export default function MessageTextarea({
  message,
  onChange,
  charCount,
  maxChars,
}: MessageTextareaProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        Mensaje al Docente{" "}
        <span className="text-slate-400 font-normal ml-1">(Opcional)</span>
      </label>
      <textarea
        value={message}
        onChange={onChange}
        placeholder="Escribe un mensaje para el docente..."
        className="w-full border border-gray-300 rounded-lg px-4 py-3 resize-none h-40 outline-none transition-colors focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
      <div className="text-right text-sm text-gray-500 mt-1">
        {charCount}/{maxChars}
      </div>
    </div>
  );
}
