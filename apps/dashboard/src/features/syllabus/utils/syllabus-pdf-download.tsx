import { pdf } from "@react-pdf/renderer";
import { SyllabusPDFDocument } from "../components/SyllabusPDFDocument";
import { syllabusPDFService } from "../services/syllabus-pdf-service";

function sanitizeFileToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildSyllabusPdfFilename(
  syllabusId: number,
  codigo?: string | null,
): string {
  if (codigo?.trim()) {
    return `silabo-${sanitizeFileToken(codigo)}.pdf`;
  }
  return `silabo-${syllabusId}.pdf`;
}

/** Mismo PDF que el visor oficial (@react-pdf/renderer + SyllabusPDFDocument). */
export async function downloadSyllabusPdf(
  syllabusId: number,
  options?: { filename?: string; codigo?: string | null },
): Promise<void> {
  if (!Number.isInteger(syllabusId) || syllabusId <= 0) {
    throw new Error("ID de sílabo inválido");
  }

  const data = await syllabusPDFService.fetchCompleteSyllabus(syllabusId);
  const blob = await pdf(<SyllabusPDFDocument data={data} />).toBlob();

  const filename =
    options?.filename ??
    buildSyllabusPdfFilename(
      syllabusId,
      options?.codigo ?? data.datosGenerales?.codigoAsignatura ?? null,
    );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
