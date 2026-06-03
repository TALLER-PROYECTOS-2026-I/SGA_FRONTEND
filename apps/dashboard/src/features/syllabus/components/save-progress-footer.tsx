import { useState, useCallback } from "react";
import { Loader2, Save } from "lucide-react";

export type SaveProgressFooterProps = {
  onSave: () => Promise<void>;
  disabled?: boolean;
};

function formatSavedTime() {
  return new Date().toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * HU17: guardar avance por sección sin avanzar de paso.
 */
export function SaveProgressFooter({
  onSave,
  disabled = false,
}: SaveProgressFooterProps) {
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    if (disabled || saving) return;

    setError(null);
    setSaving(true);
    setSavedAt(null);

    try {
      await onSave();
      setSavedAt(formatSavedTime());
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "No se pudo guardar el avance.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }, [disabled, saving, onSave]);

  return (
    <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || saving}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold bg-white text-gray-900 border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar avance
            </>
          )}
        </button>

        {savedAt && !error && (
          <span className="text-sm font-medium text-green-700">
            Avance guardado a las {savedAt}
          </span>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 font-medium max-w-xl">{error}</p>
      )}
    </div>
  );
}
