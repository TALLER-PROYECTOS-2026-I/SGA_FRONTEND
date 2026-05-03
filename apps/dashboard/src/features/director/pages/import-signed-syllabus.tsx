import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FileText, Upload, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

const isRealPDF = async (file: File): Promise<boolean> => {
  const fileReader = new FileReader();

  return new Promise((resolve) => {
    fileReader.onload = () => {
      const arr = new Uint8Array(fileReader.result as ArrayBuffer);
      const header = String.fromCharCode(...arr.slice(0, 5));
      resolve(header === "%PDF-");
    };

    fileReader.readAsArrayBuffer(file.slice(0, 5));
  });
};

export default function ImportSignedSyllabusPage() {
  const [searchParams] = useSearchParams();

  const silaboId = searchParams.get("silaboId") ?? "";
  const cursoCodigo = decodeURIComponent(searchParams.get("cursoCodigo") ?? "");
  const cursoNombre = decodeURIComponent(searchParams.get("cursoNombre") ?? "");

  const [ciclo, setCiclo] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!silaboId) {
      alert("No se encontró el sílabo seleccionado");
      return;
    }

    if (!ciclo) {
      alert("Selecciona un ciclo");
      return;
    }

    if (!file) {
      alert("Selecciona un archivo PDF");
      return;
    }

    const formData = new FormData();
    formData.append("silaboId", silaboId);
    formData.append("ciclo", ciclo);
    formData.append("file", file);

    try {
      setLoading(true);

      const res = await fetch(`${API}/director/syllabi/upload-signed`, {
        method: "POST",
        body: formData,
      });

      let data: { message?: string } | null = null;

      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        alert(data?.message ?? "Error al subir archivo");
        return;
      }

      alert("Archivo subido correctamente");
      setFile(null);
      setCiclo("");
    } catch (error) {
      console.error(error);
      alert("Error al subir archivo");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    window.location.href = "/mis-asignaciones";
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-5xl font-bold tracking-tight text-slate-900">
          Importar Sílabo Firmado
        </h1>
        <p className="text-2xl text-slate-500">
          Carga el archivo PDF firmado correspondiente a la asignatura seleccionada
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
              <Upload size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Cargar archivo firmado
              </h2>
              <p className="text-sm text-slate-500">
                Solo se aceptan archivos PDF válidos
              </p>
            </div>
          </div>

          <div className="grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Asignatura
              </label>
              <input
                type="text"
                readOnly
                value={`${cursoCodigo} - ${cursoNombre}`}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Ciclo académico
              </label>
              <select
                value={ciclo}
                onChange={(e) => setCiclo(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Seleccione un ciclo</option>
                <option value="2026-I">2026-I</option>
                <option value="2026-II">2026-II</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Archivo PDF firmado
              </label>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-red-300 hover:bg-red-50/40">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-red-600 shadow-sm">
                  <FileText size={28} />
                </div>

                <p className="text-base font-semibold text-slate-800">
                  Haz clic para seleccionar tu archivo
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Formato permitido: PDF firmado
                </p>

                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={async (e) => {
                    const selectedFile = e.target.files?.[0];
                    if (!selectedFile) return;

                    if (selectedFile.type !== "application/pdf") {
                      alert("Solo se permiten archivos PDF");
                      e.target.value = "";
                      setFile(null);
                      return;
                    }

                    const validPdf = await isRealPDF(selectedFile);

                    if (!validPdf) {
                      alert("El archivo no es un PDF válido");
                      e.target.value = "";
                      setFile(null);
                      return;
                    }

                    setFile(selectedFile);
                  }}
                />
              </label>

              {file && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 text-green-600" size={20} />
                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      Archivo seleccionado correctamente
                    </p>
                    <p className="text-sm text-green-700">{file.name}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-2 flex flex-wrap justify-end gap-3">
              <button
                onClick={handleFinish}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft size={18} />
                Finalizar
              </button>

              <button
                onClick={handleUpload}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#b91c1c] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Subir archivo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="mb-5 text-2xl font-bold text-slate-900">
            Resumen de importación
          </h3>

          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Código del curso
              </p>
              <p className="text-base font-semibold text-slate-900">
                {cursoCodigo || "No disponible"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Asignatura
              </p>
              <p className="text-base font-semibold text-slate-900">
                {cursoNombre || "No disponible"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sílabo ID
              </p>
              <p className="text-base font-semibold text-slate-900">
                {silaboId || "No disponible"}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="mb-2 text-sm font-semibold text-amber-800">
                Recomendaciones
              </p>
              <ul className="space-y-2 text-sm text-amber-700">
                <li>• Verifica que el archivo corresponda a la asignatura seleccionada.</li>
                <li>• El documento debe estar firmado y en formato PDF válido.</li>
                <li>• Selecciona el ciclo correcto antes de subir el archivo.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}