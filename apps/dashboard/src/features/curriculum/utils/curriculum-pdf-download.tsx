import { pdf } from "@react-pdf/renderer";
import { CurriculumMeshPdfDocument } from "../components/curriculum-mesh-pdf-document";
import type { CurriculumMesh } from "../hooks/curriculum-query";

function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function downloadCurriculumPdf(
  mesh: CurriculumMesh,
  selectedPeriod: string,
) {
  const blob = await pdf(
    <CurriculumMeshPdfDocument mesh={mesh} selectedPeriod={selectedPeriod} />,
  ).toBlob();

  const fileName = `malla-curricular-${sanitizeFileName(selectedPeriod)}.pdf`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
