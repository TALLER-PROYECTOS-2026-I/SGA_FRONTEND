import { createElement } from "react";
import type { ReactElement, ReactNode } from "react";
import JSZip from "jszip";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import type { SyllabusDownloadByCycleResponse } from "../hooks/syllabus-versions-query";

type SnapshotRecord = Record<string, unknown>;
type PdfItem = SyllabusDownloadByCycleResponse["syllabi"][number];

function isRecord(value: unknown): value is SnapshotRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readText(value: unknown, fallback = "No registrado") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function sanitizeFileName(value: string) {
  const withoutAccents = value.normalize("NFD").replace(/\p{M}/gu, "");

  const cleaned = Array.from(withoutAccents)
    .filter((char) => {
      const code = char.charCodeAt(0);
      const isControlChar = code >= 0 && code <= 31;
      const isForbiddenFileChar = '<>:"/\\|?*'.includes(char);

      return !isControlChar && !isForbiddenFileChar;
    })
    .join("");

  return cleaned.replace(/\s+/g, " ").trim().slice(0, 120);
}

function getDatosGenerales(snapshot: unknown): SnapshotRecord {
  if (!isRecord(snapshot)) {
    return {};
  }

  const datos = snapshot.datosGenerales;

  if (!isRecord(datos)) {
    return {};
  }

  return datos;
}

function getSumilla(snapshot: unknown) {
  if (!isRecord(snapshot)) {
    return "No hay sumilla registrada.";
  }

  return readText(
    snapshot.sumilla ??
      snapshot.silaboSumilla ??
      snapshot.descripcionSumilla,
    "No hay sumilla registrada.",
  );
}

function getArrayValue(snapshot: unknown, key: string): unknown[] {
  if (!isRecord(snapshot)) {
    return [];
  }

  const value = snapshot[key];

  return Array.isArray(value) ? value : [];
}

function getDisplayTextFromItem(item: unknown) {
  if (typeof item === "string" || typeof item === "number") {
    return String(item);
  }

  if (isRecord(item)) {
    return readText(
      item.descripcion ?? item.text ?? item.nombre ?? item.titulo,
      "",
    );
  }

  return "";
}

function getCourseName(item: PdfItem) {
  const snapshot = isRecord(item.snapshot) ? item.snapshot : {};
  const datos = getDatosGenerales(snapshot);

  return readText(
    item.cursoNombre ??
      datos.nombreAsignatura ??
      datos.cursoNombre ??
      datos.asignatura,
    "Sílabo",
  );
}

function getCourseCode(item: PdfItem) {
  const snapshot = isRecord(item.snapshot) ? item.snapshot : {};
  const datos = getDatosGenerales(snapshot);

  return readText(
    item.cursoCodigo ?? datos.codigoAsignatura ?? datos.cursoCodigo,
    "-",
  );
}

function getEscuela(item: PdfItem) {
  const snapshot = isRecord(item.snapshot) ? item.snapshot : {};
  const datos = getDatosGenerales(snapshot);

  return readText(
    datos.escuelaProfesional ?? datos.escuela,
    "Ingeniería de Computación y Sistemas",
  );
}

function getPrograma(item: PdfItem) {
  const snapshot = isRecord(item.snapshot) ? item.snapshot : {};
  const datos = getDatosGenerales(snapshot);

  return readText(
    datos.programaAcademico ?? datos.programa,
    "Ingeniería de Computación y Sistemas",
  );
}

function safeDate(value?: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111827",
  },
  header: {
    borderBottomWidth: 3,
    borderBottomColor: "#dc2626",
    paddingBottom: 12,
    marginBottom: 14,
  },
  headerLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: "#dc2626",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: "#4b5563",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  box: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 8,
  },
  label: {
    fontSize: 7,
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  value: {
    fontSize: 9,
    fontWeight: 700,
    color: "#111827",
  },
  section: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 9,
    lineHeight: 1.45,
    color: "#374151",
  },
  listItem: {
    marginBottom: 5,
    fontSize: 9,
    lineHeight: 1.35,
    color: "#374151",
  },
  missing: {
    fontSize: 9,
    color: "#6b7280",
  },
  footer: {
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    fontSize: 8,
    color: "#6b7280",
  },
});

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: unknown;
}): ReactElement {
  return createElement(
    View,
    { style: styles.box },
    createElement(Text, { style: styles.label }, label),
    createElement(Text, { style: styles.value }, readText(value)),
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): ReactElement {
  return createElement(
    View,
    { style: styles.section },
    createElement(Text, { style: styles.sectionTitle }, title),
    children,
  );
}

function ListSection({
  title,
  items,
}: {
  title: string;
  items: unknown[];
}): ReactElement {
  const readableItems = items
    .map(getDisplayTextFromItem)
    .map((item) => item.trim())
    .filter(Boolean);

  const children =
    readableItems.length > 0
      ? readableItems.map((item, index) =>
          createElement(
            Text,
            {
              key: `${title}-${index}`,
              style: styles.listItem,
            },
            `${index + 1}. ${item}`,
          ),
        )
      : createElement(
          Text,
          { style: styles.missing },
          "No hay información registrada.",
        );

  return Section({
    title,
    children,
  });
}

function SyllabusPdfDocument({ item }: { item: PdfItem }): ReactElement {
  const snapshot = isRecord(item.snapshot) ? item.snapshot : {};
  const courseName = getCourseName(item);
  const courseCode = getCourseCode(item);
  const competencias = getArrayValue(snapshot, "competenciasCurso");
  const unidades = getArrayValue(snapshot, "unidadesDidacticas");
  const fuentes = getArrayValue(snapshot, "fuentesConsulta");

  return createElement(
    Document,
    null,
    createElement(
      Page,
      { size: "A4", style: styles.page },
      createElement(
        View,
        { style: styles.header },
        createElement(Text, { style: styles.headerLabel }, "Sílabo exportado"),
        createElement(Text, { style: styles.title }, courseName),
        createElement(
          Text,
          { style: styles.subtitle },
          `${courseCode} · ${item.cicloNombre} · Periodo ${item.periodo}`,
        ),
        createElement(
          View,
          { style: styles.grid },
          InfoBox({ label: "Escuela", value: getEscuela(item) }),
          InfoBox({
            label: "Programa",
            value: getPrograma(item),
          }),
          InfoBox({
            label: "Estado",
            value: item.estado ?? "Sin estado",
          }),
          InfoBox({
            label: "Versión",
            value: `v${item.versionNumber}`,
          }),
          InfoBox({
            label: "Última modificación",
            value: safeDate(item.modifiedAt),
          }),
          InfoBox({
            label: "Modificado por",
            value: item.modifiedBy?.nombre ?? "No registrado",
          }),
        ),
      ),
      Section({
        title: "Sumilla",
        children: createElement(
          Text,
          { style: styles.paragraph },
          getSumilla(snapshot),
        ),
      }),
      ListSection({
        title: "Competencias",
        items: competencias,
      }),
      ListSection({
        title: "Unidades temáticas",
        items: unidades,
      }),
      ListSection({
        title: "Fuentes de consulta",
        items: fuentes,
      }),
      createElement(
        Text,
        { style: styles.footer },
        "Documento generado automáticamente desde el sistema de gestión académica.",
      ),
    ),
  );
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export async function downloadSyllabusCycleZip(
  data: SyllabusDownloadByCycleResponse,
) {
  const zip = new JSZip();
  const folderName = sanitizeFileName(`${data.periodo} - ${data.cicloNombre}`);
  const folder = zip.folder(folderName) ?? zip;

  for (const item of data.syllabi) {
    const code = item.cursoCodigo ?? "SIN-CODIGO";
    const name = item.cursoNombre ?? "SILABO";
    const fileName = sanitizeFileName(
      `${code} - ${name} - v${item.versionNumber}.pdf`,
    );

  const pdfBlob = await pdf(
    createElement(SyllabusPdfDocument, { item }) as unknown as Parameters<
      typeof pdf
    >[0]
  ).toBlob();

    folder.file(fileName, pdfBlob);
  }

  if (data.missingCourses.length > 0) {
    const missingText = data.missingCourses
      .map((course) => {
        return `${course.cursoCodigo ?? "-"} - ${
          course.cursoNombre ?? "Curso sin nombre"
        }: ${course.motivo}`;
      })
      .join("\n");

    folder.file("CURSOS-SIN-VERSIONES.txt", missingText);
  }

  const blob = await zip.generateAsync({ type: "blob" });

  downloadBlob(
    blob,
    sanitizeFileName(`silabos-${data.periodo}-${data.cicloNombre}.zip`),
  );
}