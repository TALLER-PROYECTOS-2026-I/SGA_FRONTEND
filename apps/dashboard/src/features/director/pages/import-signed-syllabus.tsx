import { useState } from "react";
import { useSearchParams } from "react-router-dom";

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
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Importar Sílabo con firma</h1>

      <p className="text-sm text-gray-600 mb-4">
        Importando archivo para:{" "}
        <span className="font-medium">
          {cursoCodigo} - {cursoNombre}
        </span>
      </p>

      <div className="grid gap-4 max-w-xl">
        <div>
          <label className="block mb-2 font-medium">Asignatura</label>
          <input
            type="text"
            readOnly
            value={`${cursoCodigo} - ${cursoNombre}`}
            className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-700"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Ciclo</label>
          <select
            value={ciclo}
            onChange={(e) => setCiclo(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Seleccione un ciclo</option>
            <option value="2026-I">2026-I</option>
            <option value="2026-II">2026-II</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Archivo de sílabo (PDF firmado)
          </label>
          <input
            type="file"
            accept="application/pdf"
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
            className="w-full border rounded px-3 py-2"
          />
          {file && (
            <p className="text-sm text-gray-600 mt-2">
              Archivo seleccionado:{" "}
              <span className="font-medium">{file.name}</span>
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            disabled={loading}
            className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800 disabled:opacity-60"
          >
            {loading ? "Subiendo..." : "Subir archivo"}
          </button>

          <button
            onClick={handleFinish}
            className="border px-4 py-2 rounded hover:bg-gray-50"
          >
            Finalizar
          </button>
        </div>
      </div>
    </div>
  );
}
