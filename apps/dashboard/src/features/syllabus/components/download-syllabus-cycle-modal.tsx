import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { fetchSyllabusDownloadByCycle } from "../hooks/syllabus-versions-query";
import { downloadSyllabusCycleZip } from "../utils/syllabus-zip-download";

interface DownloadSyllabusCycleModalProps {
  open: boolean;
  onClose: () => void;
  defaultPeriodo?: string;
}

const PERIOD_OPTIONS = ["2026-I", "2026-II", "2025-I", "2025-II"];

const CYCLE_OPTIONS = [
  { value: "1", label: "Ciclo I" },
  { value: "2", label: "Ciclo II" },
  { value: "3", label: "Ciclo III" },
  { value: "4", label: "Ciclo IV" },
  { value: "5", label: "Ciclo V" },
  { value: "6", label: "Ciclo VI" },
  { value: "7", label: "Ciclo VII" },
  { value: "8", label: "Ciclo VIII" },
  { value: "9", label: "Ciclo IX" },
  { value: "10", label: "Ciclo X" },
];

export function DownloadSyllabusCycleModal({
  open,
  onClose,
  defaultPeriodo = "2026-I",
}: DownloadSyllabusCycleModalProps) {
  const [selectedPeriodo, setSelectedPeriodo] = useState(defaultPeriodo);
  const [selectedCycle, setSelectedCycle] = useState("8");
  const [isDownloading, setIsDownloading] = useState(false);
  const [completedMessage, setCompletedMessage] = useState<string | null>(null);

  const selectedCycleLabel = useMemo(() => {
    return (
      CYCLE_OPTIONS.find((cycle) => cycle.value === selectedCycle)?.label ??
      "Ciclo"
    );
  }, [selectedCycle]);

  useEffect(() => {
    if (open) {
      setSelectedPeriodo(defaultPeriodo);
      setCompletedMessage(null);
      setIsDownloading(false);
    }
  }, [open, defaultPeriodo]);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    setCompletedMessage(null);
    setIsDownloading(false);
    onClose();
  };

  const handleSelectPeriodo = (periodo: string) => {
    setSelectedPeriodo(periodo);
    setCompletedMessage(null);
  };

  const handleSelectCycle = (cycle: string) => {
    setSelectedCycle(cycle);
    setCompletedMessage(null);
  };

  const handleDownloadAnother = () => {
    setCompletedMessage(null);
    setIsDownloading(false);
  };

  const handleDownload = async () => {
    try {
      setCompletedMessage(null);
      setIsDownloading(true);

      const data = await fetchSyllabusDownloadByCycle({
        periodo: selectedPeriodo,
        ciclo: selectedCycle,
      });

      if (data.totalDescargables === 0) {
        toast.error(
          `No hay sílabos descargables para ${selectedPeriodo} - ${selectedCycleLabel}.`,
        );
        return;
      }

      await downloadSyllabusCycleZip(data);

      const message = `Se descargaron ${data.totalDescargables} sílabos de ${selectedCycleLabel}.`;
      setCompletedMessage(message);
      toast.success("Descarga completada");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "No se pudo descargar el ZIP",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white">
              <Download size={21} />
            </div>

            <div>
              <h2 className="text-lg font-black text-gray-900">
                Descargar Sílabos
              </h2>
              <p className="text-sm text-gray-500">
                Selecciona el año y ciclo académico.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {completedMessage ? (
            <div className="rounded-2xl border border-green-100 bg-green-50 p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
                <CheckCircle2 size={30} />
              </div>

              <h3 className="mt-4 text-lg font-black text-gray-900">
                Descarga completada
              </h3>

              <p className="mt-2 text-sm text-gray-600">{completedMessage}</p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleDownloadAnother}
                  className="h-11 rounded-xl border border-red-200 bg-white text-sm font-bold text-red-600 hover:bg-red-50"
                >
                  Descargar otro ciclo
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="h-11 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <>
              <section>
                <p className="mb-3 text-sm font-bold text-gray-900">
                  Sílabos Actuales
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {PERIOD_OPTIONS.map((periodo) => {
                    const selected = selectedPeriodo === periodo;

                    return (
                      <button
                        key={periodo}
                        type="button"
                        onClick={() => handleSelectPeriodo(periodo)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          selected
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-black">
                              Sílabos Actuales {periodo.split("-")[0]}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Periodo {periodo}
                            </p>
                          </div>

                          {selected && <CheckCircle2 size={18} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <p className="mb-3 text-sm font-bold text-gray-900">
                  Ciclo Académico
                </p>

                <div className="grid max-h-64 grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                  {CYCLE_OPTIONS.map((cycle) => {
                    const selected = selectedCycle === cycle.value;

                    return (
                      <button
                        key={cycle.value}
                        type="button"
                        onClick={() => handleSelectCycle(cycle.value)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          selected
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-black">{cycle.label}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              Ciclo académico
                            </p>
                          </div>

                          {selected && <CheckCircle2 size={18} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 text-sm font-black text-white shadow-md hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isDownloading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Download size={18} />
                )}
                {isDownloading
                  ? "Generando ZIP..."
                  : `Descargar ZIP - ${selectedPeriodo}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
