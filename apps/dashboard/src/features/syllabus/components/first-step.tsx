import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Step } from "./step";
import { useSteps } from "../contexts/steps-context-provider";

export default function FirstStep() {
  const { nextStep } = useSteps();
  const [searchParams] = useSearchParams();

  const mode = searchParams.get("mode") ?? "";
  const codigoFromUrl = (searchParams.get("codigo") ?? "").trim();
  const idFromUrl = (searchParams.get("id") ?? "").trim();

  const isEditMode = mode === "edit";

  const [nombreAsignatura, setNombreAsignatura] = useState("");
  const [codigoAsignatura, setCodigoAsignatura] = useState("");

  useEffect(() => {
    if (!isEditMode) return;

    // Nombre inferido desde el código que venga por URL.
    // Si luego quieres traer el nombre real desde backend, esto se puede reemplazar.
    const nombreInferido =
      codigoFromUrl === "INF-202"
        ? "Base de Datos"
        : codigoFromUrl === "INF-101"
          ? "Ingeniería de Software"
          : codigoFromUrl === "INF-303"
            ? "Arquitectura de Software"
            : codigoFromUrl === "INF-404"
              ? "Pruebas de Software"
              : codigoFromUrl === "INF-901"
                ? "Arquitectura de Software II"
                : "";

    setCodigoAsignatura(codigoFromUrl);
    setNombreAsignatura(nombreInferido);
  }, [isEditMode, codigoFromUrl]);

  const handleNext = () => {
    if (!nombreAsignatura.trim()) {
      alert("Ingrese el nombre de la asignatura");
      return;
    }

    if (!codigoAsignatura.trim()) {
      alert("Ingrese el código de la asignatura");
      return;
    }

    nextStep();
  };

  return (
    <Step step={1} onNextStep={handleNext}>
      <div className="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#b91c1c] font-bold text-white">
            1
          </div>
          <h2 className="text-xl font-bold text-[#111827]">Datos Generales</h2>
        </div>

        <div className="space-y-6 px-8 pb-8">
          {isEditMode && (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Editando sílabo existente
              {idFromUrl ? ` (ID: ${idFromUrl})` : ""}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Nombre de la asignatura
            </label>
            <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-4">
              <input
                type="text"
                className="w-full bg-transparent font-medium text-gray-800 outline-none"
                value={nombreAsignatura}
                onChange={(e) => setNombreAsignatura(e.target.value)}
                placeholder="Escriba el nombre de la asignatura"
                readOnly={isEditMode}
              />
              <svg
                className="h-5 w-5 cursor-pointer text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Código de la asignatura
            </label>
            <input
              type="text"
              value={codigoAsignatura}
              onChange={(e) => setCodigoAsignatura(e.target.value)}
              placeholder="Escriba el código de la asignatura"
              readOnly={isEditMode}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:border-red-400 read-only:bg-gray-50"
            />
          </div>
        </div>
      </div>
    </Step>
  );
}