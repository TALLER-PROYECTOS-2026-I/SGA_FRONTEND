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
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-bold text-gray-900">
          5. Mensaje al Docente
        </label>

        <span
          className={`text-xs font-medium ${
            charCount >= maxChars ? "text-red-600" : "text-gray-400"
          }`}
        >
          {charCount}/{maxChars}
        </span>
      </div>

      <textarea
        value={message}
        onChange={onChange}
        placeholder="Escribe un mensaje para el docente..."
        className="w-full border border-gray-200 rounded-xl px-4 py-3 resize-none h-36 text-sm text-gray-700 placeholder:text-gray-400 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
      />
    </div>
  );
}
