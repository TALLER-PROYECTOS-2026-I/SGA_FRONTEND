import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { ReactNode } from "react";
import LogoUsmpSilabo from "@/assets/logo_usmp_silabo.jpeg";
import type {
  CompleteSyllabus,
  SemanaUnidad,
  UnidadDidactica,
  FuenteInformacion,
} from "../types/complete-syllabus";

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingHorizontal: 34,
    paddingBottom: 34,
    fontFamily: "Helvetica",
    fontSize: 8,
    lineHeight: 1.25,
    color: "#111111",
  },

  pageLandscape: {
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 26,
    fontFamily: "Helvetica",
    fontSize: 6.4,
    lineHeight: 1.18,
    color: "#000000",
  },

  header: {
    width: "100%",
    marginBottom: 10,
    alignItems: "flex-start",
  },

  logo: {
    width: 190,
    height: 50,
    objectFit: "contain",
  },

  titleBlock: {
    textAlign: "center",
    marginBottom: 12,
  },

  title: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 4,
  },

  courseTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 4,
  },

  areaTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    textTransform: "uppercase",
  },

  section: {
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 7,
    marginBottom: 4,
    textTransform: "uppercase",
  },

  text: {
    fontSize: 8.5,
    lineHeight: 1.2,
    marginBottom: 4,
    textAlign: "justify",
  },

  paragraph: {
    fontSize: 8,
    lineHeight: 1.22,
    marginBottom: 4,
    textAlign: "justify",
  },

  textBold: {
    fontFamily: "Helvetica-Bold",
  },

  textItalic: {
    fontFamily: "Helvetica-Oblique",
  },

  listItem: {
    fontSize: 8.2,
    marginBottom: 2,
    marginLeft: 10,
    textAlign: "justify",
  },

  subsectionTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
    marginBottom: 3,
  },

  bulletText: {
    fontSize: 8,
    lineHeight: 1.2,
    marginBottom: 2,
    textAlign: "justify",
  },

  emptyText: {
    fontSize: 8,
    fontFamily: "Helvetica-Oblique",
    color: "#555",
  },

  generalTable: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 8,
  },

  generalRow: {
    flexDirection: "row",
    minHeight: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },

  generalRowLast: {
    flexDirection: "row",
    minHeight: 16,
  },

  generalLabel: {
    width: "38%",
    borderRightWidth: 1,
    borderRightColor: "#000",
    paddingVertical: 3,
    paddingHorizontal: 4,
    fontSize: 7.5,
  },

  generalValue: {
    width: "62%",
    paddingVertical: 3,
    paddingHorizontal: 4,
    fontSize: 7.5,
  },

  generalValueText: {
    fontSize: 7.5,
  },

  splitRow: {
    flexDirection: "row",
    width: "60%",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000000",
  },

  splitCell: {
    flex: 1,
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderColor: "#000000",
    justifyContent: "center",
  },

  splitCellLast: {
    flex: 1,
    paddingVertical: 3,
    paddingHorizontal: 4,
    justifyContent: "center",
  },

  hoursBlock: {
    width: "100%",
  },

  hoursLine: {
    fontSize: 7.5,
    marginBottom: 2,
  },

  programUnitTable: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 10,
  },

  programUnitTitle: {
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    textAlign: "center",
  },

  programUnitTitleText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },

  programCapacity: {
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    fontSize: 7,
  },

  programHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    minHeight: 18,
  },

  programRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },

  programCell: {
    padding: 2.5,
    borderRightWidth: 1,
    borderRightColor: "#000",
    fontSize: 6.2,
  },

  programCellLast: {
    padding: 2.5,
    fontSize: 6.2,
  },

  programHeaderText: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },

  programText: {
    fontSize: 6.2,
    lineHeight: 1.15,
  },

  hourText: {
    fontSize: 6.5,
    textAlign: "center",
  },

  programWeekCell: {
    width: "5%",
    justifyContent: "center",
    alignItems: "center",
  },

  programConceptualCell: {
    width: "24%",
  },

  programProceduralCell: {
    width: "24%",
  },

  programActivityCell: {
    width: "23%",
  },

  programHourCell: {
    width: "6%",
    justifyContent: "center",
    alignItems: "center",
  },

  compactTable: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#000000",
    marginTop: 6,
  },

  compactRow: {
    flexDirection: "row",
  },

  compactHeaderCell: {
    padding: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000000",
    fontFamily: "Helvetica-Bold",
    fontSize: 7.3,
  },

  compactCell: {
    padding: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000000",
    fontSize: 7.3,
  },

  outcomesTable: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#000",
    marginTop: 6,
  },

  outcomeHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    minHeight: 16,
  },

  outcomeRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },

  outcomeRowLast: {
    flexDirection: "row",
  },

  outcomeCodeCell: {
    width: "10%",
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: "#000",
    fontSize: 7,
    textAlign: "center",
  },

  outcomeDescriptionCell: {
    width: "78%",
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: "#000",
    fontSize: 7,
  },

  outcomeValueCell: {
    width: "12%",
    padding: 3,
    fontSize: 7,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
  },

  outcomeHeaderText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },

  outcomeText: {
    fontSize: 7,
    lineHeight: 1.2,
  },

  outcomeCenteredText: {
    fontSize: 7,
    lineHeight: 1.2,
    textAlign: "center",
  },

  outcomeValueText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },

  formulaText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },

  pageNumber: {
    position: "absolute",
    fontSize: 8,
    bottom: 12,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#444444",
  },
});

interface SyllabusPDFDocumentProps {
  data: CompleteSyllabus;
}

function cleanText(value?: string | number | null) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function normalizeText(value?: string | number | null) {
  return cleanText(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "");
}

function markOption(current: string | undefined | null, option: string) {
  return normalizeText(current) === normalizeText(option) ? "X" : " ";
}

function formatTwoDigits(value?: number | string | null) {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num) || num <= 0) return " ";
  return String(num).padStart(2, "0");
}

function toNumber(value?: number | string | null) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function roman(value?: number) {
  const map: Record<number, string> = {
    1: "I",
    2: "II",
    3: "III",
    4: "IV",
    5: "V",
    6: "VI",
    7: "VII",
    8: "VIII",
    9: "IX",
    10: "X",
  };

  return map[value || 0] || String(value || "");
}

function GeneralRow({
  label,
  children,
  last = false,
}: {
  label: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <View style={last ? styles.generalRowLast : styles.generalRow}>
      <View style={styles.generalLabel}>
        <Text>{label}</Text>
      </View>

      <View style={styles.generalValue}>
        {typeof children === "string" || typeof children === "number" ? (
          <Text style={styles.generalValueText}>{children}</Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.sectionTitle} wrap={false}>
      {children}
    </Text>
  );
}

function Footer() {
  return (
    <Text
      style={styles.pageNumber}
      render={({ pageNumber }) => `${pageNumber}`}
      fixed
    />
  );
}

const isNonEmpty = (value: unknown) => String(value ?? "").trim().length > 0;

const renderBullet = (text: string, key?: string | number) => {
  if (!isNonEmpty(text)) return null;

  return (
    <Text key={key} style={styles.bulletText}>
      - {text}
    </Text>
  );
};

const renderCodedBullet = (item: any, key?: string | number) => {
  const code = String(item.codigo ?? item.code ?? "").trim();
  const text = String(item.descripcion ?? item.text ?? "").trim();

  if (!text) return null;

  return (
    <Text key={key} style={styles.bulletText}>
      - {code ? `${code} - ` : ""}
      {text}
    </Text>
  );
};

function BulletList({
  items,
}: {
  items?: Array<{ descripcion?: string; codigo?: string }>;
}) {
  const bullets = (items ?? [])
    .map((item, index) => renderCodedBullet(item, index))
    .filter(Boolean);

  if (bullets.length === 0) {
    return <Text style={styles.emptyText}>Sin información registrada.</Text>;
  }

  return <View>{bullets}</View>;
}

function renderBulletList(items: Array<string | null | undefined>) {
  const bullets = items
    .map((item, index) => renderBullet(cleanText(item).trim(), index))
    .filter(Boolean);

  if (bullets.length === 0) {
    return <Text style={styles.emptyText}>Sin información registrada.</Text>;
  }

  return <View>{bullets}</View>;
}

function joinLabelValue(label?: string | null, value?: string | null) {
  const cleanLabel = cleanText(label).trim();
  const cleanValue = cleanText(value).trim();

  if (cleanLabel && cleanValue) return `${cleanLabel}: ${cleanValue}`;
  return cleanLabel || cleanValue;
}

function strategyText(estrategia: { nombre?: string; descripcion?: string }) {
  const nombre = cleanText(estrategia.nombre).trim();
  const descripcion = cleanText(estrategia.descripcion).trim();

  if (nombre && descripcion) return `${nombre}: ${descripcion}`;
  return nombre || descripcion;
}

function resourceNoteText(nota: { nombre?: string; descripcion?: string }) {
  return joinLabelValue(nota.nombre, nota.descripcion);
}

function resourceText(recurso: {
  destino?: string;
  recursoNombre?: string;
  observaciones?: string;
}) {
  const main = joinLabelValue(recurso.destino, recurso.recursoNombre);
  const observaciones = cleanText(recurso.observaciones).trim();

  if (main && observaciones) return `${main} - ${observaciones}`;
  return main || observaciones;
}

function textToBullets(value?: string | null) {
  const text = cleanText(value).trim();

  if (!text) return "-";

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return "-";

  return lines
    .map((line) => {
      if (line.startsWith("-") || line.startsWith("•")) return line;
      return `- ${line}`;
    })
    .join("\n");
}

function formatBulletText(value?: string | null) {
  return textToBullets(value);
}

function renderProgramLines(value?: string | null) {
  return formatBulletText(value)
    .split("\n")
    .map((line, index) => (
      <Text key={index} style={styles.programText}>
        {line}
      </Text>
    ));
}

function isEventWeek(semana: SemanaUnidad) {
  return cleanText(semana.actividadesAprendizaje)
    .trim()
    .toUpperCase()
    .startsWith("[EVENTO]");
}

const cleanFormulaExpression = (label: string, expression?: string | null) => {
  const value = String(expression ?? "").trim();

  if (!value) return "";

  const normalized = value
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/\s*=\s*/, " = ");

  if (normalized.startsWith(`${label.toUpperCase()} =`)) {
    return value;
  }

  return `${label} = ${value}`;
};

function getWeeks(unidad: UnidadDidactica) {
  if (unidad.semanas && unidad.semanas.length > 0) {
    return unidad.semanas;
  }

  return [
    {
      id: unidad.id,
      silaboUnidadId: unidad.id,
      semana: unidad.numero,
      contenidosConceptuales: unidad.contenidosConceptuales,
      contenidosProcedimentales: unidad.contenidosProcedimentales,
      actividadesAprendizaje: unidad.actividadesAprendizaje,
      horasLectivasTeoria: unidad.horasLectivasTeoria,
      horasLectivasPractica: unidad.horasLectivasPractica,
      horasNoLectivasTeoria: unidad.horasNoLectivasTeoria,
      horasNoLectivasPractica: unidad.horasNoLectivasPractica,
    },
  ];
}

function getStringField(source: unknown, keys: string[]) {
  if (!source) return "";

  const record = source as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (isNonEmpty(value)) return String(value).trim();
  }

  return "";
}

function shouldAppendUrl(title: string, url: string) {
  if (!url) return false;
  return !title.toLowerCase().includes(url.toLowerCase());
}

function fuenteText(fuente: FuenteInformacion) {
  const autores = cleanText(fuente.autores).trim();
  const anio = cleanText(fuente.anio).trim();
  const titulo = cleanText(fuente.titulo).trim();
  const editorial = cleanText(fuente.editorial).trim();
  const ciudad = cleanText(fuente.ciudad).trim();
  const isbn = cleanText(fuente.isbn).trim();
  const notas = cleanText(fuente.notas).trim();
  const url = getStringField(fuente, ["url", "doiUrl"]);
  const autorAnio = autores
    ? `${autores}${anio ? ` (${anio})` : ""}`
    : anio
      ? `(${anio})`
      : "";
  const parts = [
    autorAnio,
    titulo,
    editorial,
    ciudad,
    isbn ? `ISBN: ${isbn}` : "",
    notas,
    shouldAppendUrl(titulo, url) ? url : "",
  ].filter(isNonEmpty);

  return parts.join(". ");
}

function outcomeNumber(value: string) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
}

function getOutcomeCode(aporte: unknown, index: number) {
  return (
    getStringField(aporte, [
      "resultadoCodigo",
      "resultadoProgramaCodigo",
      "codigo",
      "code",
    ]) || `RP${index + 1}`
  );
}

function getOutcomeDescription(aporte: unknown) {
  return getStringField(aporte, [
    "resultadoDescripcion",
    "resultadoProgramaDescripcion",
    "descripcion",
    "description",
  ]);
}

function getOutcomeValue(aporte: unknown) {
  return getStringField(aporte, ["aporteValor", "aporte", "valor", "level"]);
}

function getOutcomeRows(aportes?: unknown[]) {
  return (aportes ?? [])
    .map((aporte, index) => ({
      code: getOutcomeCode(aporte, index),
      description: getOutcomeDescription(aporte),
      value: getOutcomeValue(aporte),
      originalIndex: index,
    }))
    .filter((aporte) => isNonEmpty(aporte.code) || isNonEmpty(aporte.description))
    .sort((a, b) => {
      const numberDiff = outcomeNumber(a.code) - outcomeNumber(b.code);
      if (Number.isFinite(numberDiff) && numberDiff !== 0) return numberDiff;
      return a.code.localeCompare(b.code) || a.originalIndex - b.originalIndex;
    });
}

export function SyllabusPDFDocument({ data }: SyllabusPDFDocumentProps) {
  const datos = data.datosGenerales;

  const bibliograficas = data.fuentes?.filter((fuente) => fuente.tipo !== "WEB");

  const electronicas = data.fuentes?.filter((fuente) => fuente.tipo === "WEB");

  const horasTeoria = toNumber(datos.horasTeoria);
  const horasPractica = toNumber(datos.horasPractica);
  const totalHoras = toNumber(datos.horasTotales) || horasTeoria + horasPractica;
  const creditosTeoria = toNumber(datos.creditosTeoria);
  const creditosPractica = toNumber(datos.creditosPractica);
  const totalCreditos =
    toNumber(datos.creditosTotales) || creditosTeoria + creditosPractica;
  const outcomeRows = getOutcomeRows(data.aportesResultadosPrograma);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={LogoUsmpSilabo} style={styles.logo} />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>SÍLABO</Text>
          <Text style={styles.courseTitle}>
            {cleanText(datos.nombreAsignatura).toUpperCase()}
          </Text>
          <Text style={styles.areaTitle}>
            ÁREA CURRICULAR:{" "}
            {cleanText(datos.areaCurricular || "TECNOLOGÍA DE INFORMACIÓN")
              .toUpperCase()}
          </Text>
        </View>

        <View style={styles.section}>
          <SectionTitle>I. DATOS GENERALES</SectionTitle>

          <View style={styles.generalTable}>
            <GeneralRow label="Departamento Académico">
              {datos.departamentoAcademico || ""}
            </GeneralRow>

            <GeneralRow label="Escuela Profesional">
              {datos.escuelaProfesional || ""}
            </GeneralRow>

            <GeneralRow label="Programa académico">
              {datos.programaAcademico || ""}
            </GeneralRow>

            <GeneralRow label="Semestre Académico">
              {datos.semestreAcademico || ""}
            </GeneralRow>

            <GeneralRow label="Tipo de asignatura">
              {datos.tipoAsignatura || ""}
            </GeneralRow>

            <GeneralRow label="Tipo de estudios">
              {`General (${markOption(datos.tipoEstudios, "general")})    Específica (${markOption(datos.tipoEstudios, "específica")})    Especialidad (${markOption(datos.tipoEstudios, "especialidad")})`}
            </GeneralRow>

            <GeneralRow label="Modalidad de la asignatura">
              {`Presencial (${markOption(datos.modalidad, "presencial")})    Semipresencial (${markOption(datos.modalidad, "semipresencial")})    A distancia (${markOption(datos.modalidad, "a distancia")})`}
            </GeneralRow>

            <GeneralRow label="Código de la asignatura">
              {datos.codigoAsignatura || ""}
            </GeneralRow>

            <GeneralRow label="Ciclo">
              {datos.ciclo || ""}
            </GeneralRow>

            <GeneralRow label="Requisitos">
              {datos.requisitos || "Ninguno"}
            </GeneralRow>

            <GeneralRow label="Cantidad de horas">
              <View style={styles.hoursBlock}>
                <Text style={styles.hoursLine}>
                  Teoría ({formatTwoDigits(horasTeoria)})    Práctica (
                  {formatTwoDigits(horasPractica)})    Total horas (
                  {formatTwoDigits(totalHoras)})
                </Text>
                <Text style={styles.hoursLine}>
                  Teoría lectiva presencial ({formatTwoDigits(horasTeoria)})
                </Text>
                <Text style={styles.hoursLine}>
                  Teoría lectiva a distancia ( )
                </Text>
                <Text style={styles.hoursLine}>
                  Teoría no lectiva presencial ( )
                </Text>
                <Text style={styles.hoursLine}>
                  Teoría no lectiva a distancia ( )
                </Text>
                <Text style={styles.hoursLine}>
                  Práctica lectiva presencial ({formatTwoDigits(horasPractica)})
                </Text>
                <Text style={styles.hoursLine}>
                  Práctica lectiva a distancia ( )
                </Text>
                <Text style={styles.hoursLine}>
                  Práctica no lectiva presencial ( )
                </Text>
                <Text style={styles.hoursLine}>
                  Práctica no lectiva a distancia ( )
                </Text>
              </View>
            </GeneralRow>

            <GeneralRow label="Cantidad de Créditos">
              {`Teoría (${formatTwoDigits(creditosTeoria)})    Práctica (${formatTwoDigits(creditosPractica)})    Total créditos (${formatTwoDigits(totalCreditos)})`}
            </GeneralRow>

            <GeneralRow label="Docente(s)" last>
              {datos.docentes || "Pendiente de asignación"}
            </GeneralRow>
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle>II. SUMILLA</SectionTitle>
          {isNonEmpty(data.sumilla) ? (
            <Text style={styles.paragraph}>{cleanText(data.sumilla).trim()}</Text>
          ) : (
            <Text style={styles.emptyText}>Sin información registrada.</Text>
          )}
        </View>

        <View style={styles.section}>
          <SectionTitle>
            III. COMPETENCIAS Y SUS COMPONENTES COMPRENDIDOS EN LA ASIGNATURA
          </SectionTitle>

          <Text style={styles.subsectionTitle}>3.1. Competencias</Text>
          <BulletList items={data.competenciasCurso} />

          <Text style={styles.subsectionTitle}>3.2. Componentes</Text>

          <Text style={styles.subsectionTitle}>Capacidades</Text>
          <BulletList items={data.componentesConceptuales} />

          {data.componentesProcedimentales?.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Procedimentales</Text>
              <BulletList items={data.componentesProcedimentales} />
            </>
          )}

          <Text style={styles.subsectionTitle}>Contenidos actitudinales</Text>
          <BulletList items={data.componentesActitudinales} />
        </View>

        <Footer />
      </Page>

      <Page size="A4" orientation="landscape" style={styles.pageLandscape}>
        <SectionTitle>IV. PROGRAMACIÓN DE CONTENIDOS</SectionTitle>

        {data.unidadesDidacticas?.map((unidad) => {
          const semanas = getWeeks(unidad);

          return (
            <View key={unidad.id} style={styles.programUnitTable}>
              <View style={styles.programUnitTitle} wrap={false}>
                <Text style={styles.programUnitTitleText}>
                  UNIDAD {roman(unidad.numero)} :{" "}
                  {cleanText(unidad.titulo).toUpperCase()}
                </Text>
              </View>

              <View style={styles.programCapacity}>
                <Text style={styles.programText}>
                  <Text style={styles.textBold}>CAPACIDAD:</Text>
                </Text>
                {renderProgramLines(unidad.capacidadesText)}
              </View>

              <View style={styles.programHeaderRow} wrap={false}>
                <View style={[styles.programCell, styles.programWeekCell]}>
                  <Text style={styles.programHeaderText}>SEMANA</Text>
                </View>

                <View style={[styles.programCell, styles.programConceptualCell]}>
                  <Text style={styles.programHeaderText}>
                    CONTENIDOS CONCEPTUALES
                  </Text>
                </View>

                <View style={[styles.programCell, styles.programProceduralCell]}>
                  <Text style={styles.programHeaderText}>
                    CONTENIDOS PROCEDIMENTALES
                  </Text>
                </View>

                <View style={[styles.programCell, styles.programActivityCell]}>
                  <Text style={styles.programHeaderText}>
                    ACTIVIDADES DE APRENDIZAJE
                  </Text>
                </View>

                <View style={[styles.programCell, styles.programHourCell]}>
                  <Text style={styles.programHeaderText}>HL TEORÍA</Text>
                </View>

                <View style={[styles.programCell, styles.programHourCell]}>
                  <Text style={styles.programHeaderText}>HL PRÁCTICA</Text>
                </View>

                <View style={[styles.programCell, styles.programHourCell]}>
                  <Text style={styles.programHeaderText}>HNL TEORÍA</Text>
                </View>

                <View style={[styles.programCellLast, styles.programHourCell]}>
                  <Text style={styles.programHeaderText}>HNL PRÁCTICA</Text>
                </View>
              </View>

              {semanas.map((semana) => {
                const isEvent = isEventWeek(semana);

                return (
                  <View key={semana.id || semana.semana} style={styles.programRow}>
                    <View style={[styles.programCell, styles.programWeekCell]}>
                      <Text style={styles.hourText}>{semana.semana}</Text>
                    </View>

                    <View
                      style={[styles.programCell, styles.programConceptualCell]}
                    >
                      {isEvent ? (
                        <Text style={styles.programText}>-</Text>
                      ) : (
                        renderProgramLines(semana.contenidosConceptuales)
                      )}
                    </View>

                    <View
                      style={[styles.programCell, styles.programProceduralCell]}
                    >
                      {isEvent ? (
                        <Text style={styles.programText}>-</Text>
                      ) : (
                        renderProgramLines(semana.contenidosProcedimentales)
                      )}
                    </View>

                    <View style={[styles.programCell, styles.programActivityCell]}>
                      {isEvent ? (
                        <Text style={styles.programText}>
                          {cleanText(semana.actividadesAprendizaje)}
                        </Text>
                      ) : (
                        renderProgramLines(semana.actividadesAprendizaje)
                      )}
                    </View>

                    <View style={[styles.programCell, styles.programHourCell]}>
                      <Text style={styles.hourText}>
                        {isEvent ? 0 : (semana.horasLectivasTeoria ?? 0)}
                      </Text>
                    </View>

                    <View style={[styles.programCell, styles.programHourCell]}>
                      <Text style={styles.hourText}>
                        {isEvent ? 0 : (semana.horasLectivasPractica ?? 0)}
                      </Text>
                    </View>

                    <View style={[styles.programCell, styles.programHourCell]}>
                      <Text style={styles.hourText}>
                        {isEvent ? 0 : (semana.horasNoLectivasTeoria ?? 0)}
                      </Text>
                    </View>

                    <View
                      style={[styles.programCellLast, styles.programHourCell]}
                    >
                      <Text style={styles.hourText}>
                        {isEvent ? 0 : (semana.horasNoLectivasPractica ?? 0)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}

        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <SectionTitle>V. ESTRATEGIAS DIDÁCTICAS</SectionTitle>
          {renderBulletList(
            (data.estrategiasMetodologicas ?? []).map(strategyText),
          )}
        </View>

        <View style={styles.section}>
          <SectionTitle>VI. RECURSOS DIDÁCTICOS</SectionTitle>
          {renderBulletList([
            ...(data.recursosDidacticos?.notas ?? []).map(resourceNoteText),
            ...(data.recursosDidacticos?.recursos ?? []).map(resourceText),
          ])}
        </View>

        <View style={styles.section}>
          <SectionTitle>VII. EVALUACIÓN DEL APRENDIZAJE</SectionTitle>

          {data.evaluacionAprendizaje?.formulaEvaluacion ? (
            <>
              <Text style={styles.text}>
                El promedio final de la asignatura se obtiene con la siguiente
                fórmula:
              </Text>

              <Text style={styles.formulaText}>
                {cleanFormulaExpression(
                  data.evaluacionAprendizaje.formulaEvaluacion
                    .variableFinalCodigo || "PF",
                  data.evaluacionAprendizaje.formulaEvaluacion.expresionFinal,
                )}
              </Text>

              {data.evaluacionAprendizaje.formulaEvaluacion.variables?.map(
                (variable, index) => (
                  <Text key={index} style={styles.text}>
                    <Text style={styles.textBold}>{variable.codigo}</Text> ={" "}
                    {variable.descripcion}
                  </Text>
                ),
              )}

              {data.evaluacionAprendizaje.formulaEvaluacion.subformulas?.map(
                (subformula, index) => (
                  <Text key={index} style={styles.formulaText}>
                    {cleanFormulaExpression(
                      subformula.variableCodigo,
                      subformula.expresion,
                    )}
                  </Text>
                ),
              )}
            </>
          ) : (
            <>
              {data.evaluacionAprendizaje?.descripcion && (
                <Text style={styles.text}>
                  {data.evaluacionAprendizaje.descripcion}
                </Text>
              )}

              {data.evaluacionAprendizaje?.formulaPF && (
                <Text style={styles.formulaText}>
                  {cleanFormulaExpression(
                    "PF",
                    data.evaluacionAprendizaje.formulaPF,
                  )}
                </Text>
              )}

              {data.evaluacionAprendizaje?.componentesPF?.map(
                (item, index) => (
                  <Text key={index} style={styles.text}>
                    <Text style={styles.textBold}>{item.codigo}</Text> ={" "}
                    {item.descripcion}
                  </Text>
                ),
              )}

              {data.evaluacionAprendizaje?.descripcionPE && (
                <Text style={styles.text}>
                  {data.evaluacionAprendizaje.descripcionPE}
                </Text>
              )}

              {data.evaluacionAprendizaje?.formulaPE && (
                <Text style={styles.formulaText}>
                  {cleanFormulaExpression(
                    "PE",
                    data.evaluacionAprendizaje.formulaPE,
                  )}
                </Text>
              )}

              {data.evaluacionAprendizaje?.componentesPE?.map(
                (item, index) => (
                  <Text key={index} style={styles.text}>
                    <Text style={styles.textBold}>{item.codigo}</Text> ={" "}
                    {item.descripcion}
                  </Text>
                ),
              )}
            </>
          )}
        </View>

        <View style={styles.section}>
          <SectionTitle>VIII. FUENTES DE INFORMACIÓN.</SectionTitle>

          {bibliograficas?.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>8.1 Bibliográficas</Text>
              {renderBulletList(bibliograficas.map(fuenteText))}
            </>
          )}

          {electronicas?.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>8.2 Electrónicas</Text>
              {renderBulletList(electronicas.map(fuenteText))}
            </>
          )}

          {(bibliograficas?.length ?? 0) === 0 &&
            (electronicas?.length ?? 0) === 0 && (
              <Text style={styles.emptyText}>Sin información registrada.</Text>
            )}
        </View>

        <View style={styles.section}>
          <SectionTitle>
            IX. APORTE DE LA ASIGNATURA AL LOGRO DE RESULTADOS
          </SectionTitle>

          <Text style={styles.paragraph}>
            El aporte de la asignatura al logro de los Resultados del Estudiante
            (<Text style={styles.textItalic}>Student Outcomes</Text>) en la
            formación del graduado en Ingeniería de Computación y Sistemas, se
            establece en la tabla siguiente:
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.textBold}>K</Text> = clave{" "}
            <Text style={styles.textBold}>R</Text> = relacionado{" "}
            <Text style={styles.textBold}>Recuadro vacío</Text> = no aplica
          </Text>

          {outcomeRows.length > 0 ? (
            <View style={styles.outcomesTable}>
              <View style={styles.outcomeHeaderRow} wrap={false}>
                <View style={styles.outcomeCodeCell}>
                  <Text style={styles.outcomeHeaderText}>Código</Text>
                </View>

                <View style={styles.outcomeDescriptionCell}>
                  <Text style={styles.outcomeHeaderText}>
                    Resultado del estudiante
                  </Text>
                </View>

                <View style={styles.outcomeValueCell}>
                  <Text style={styles.outcomeHeaderText}>Aporte</Text>
                </View>
              </View>

              {outcomeRows.map((aporte, index) => (
                <View
                  key={`${aporte.code}-${index}`}
                  style={
                    index === outcomeRows.length - 1
                      ? styles.outcomeRowLast
                      : styles.outcomeRow
                  }
                >
                  <View style={styles.outcomeCodeCell}>
                    <Text style={styles.outcomeCenteredText}>
                      {aporte.code}
                    </Text>
                  </View>

                  <View style={styles.outcomeDescriptionCell}>
                    <Text style={styles.outcomeText}>{aporte.description}</Text>
                  </View>

                  <View style={styles.outcomeValueCell}>
                    <Text style={styles.outcomeValueText}>{aporte.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Sin aportes registrados.</Text>
          )}
        </View>

        <Footer />
      </Page>
    </Document>
  );
}