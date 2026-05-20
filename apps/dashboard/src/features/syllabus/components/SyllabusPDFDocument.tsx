import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import LogoUsmpSilabo from "@/assets/logo_usmp_silabo.jpeg";
import { PdfUsmpPageFooter } from "./pdf-usmp-page-footer";
import { EvaluationSection } from "./pdf/evaluation-pdf-parts";
import { buildOutcomeRowsForPdf } from "./pdf/outcome-code";
import { OutcomesTablePdf } from "./pdf/outcomes-table-pdf";
import { fuenteText } from "./pdf/fuente-text";
import { cleanPdfText, isPdfValueNonEmpty } from "./pdf/format-pdf-value";
import {
  ProgramActivityCell,
  ProgramContentCell,
  ProgramHourCell,
  ProgramLines,
} from "./pdf/render-program-lines";
import { renderBulletList } from "./pdf/render-bullet-list";
import {
  formatTwoDigits,
  getWeeks,
  isEventWeek,
  markOption,
  resourceNoteText,
  resourceText,
  roman,
  strategyText,
  toNumber,
} from "./pdf/syllabus-format-helpers";
import { BulletList, GeneralRow, SectionTitle } from "./pdf/syllabus-pdf-ui";
import type { CompleteSyllabus } from "../types/complete-syllabus";

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingHorizontal: 34,
    paddingBottom: 92,
    fontFamily: "Helvetica",
    fontSize: 8,
    lineHeight: 1.25,
    color: "#111111",
  },

  pageLandscape: {
    paddingTop: 24,
    paddingBottom: 86,
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
});

type SyllabusPDFDocumentProps = Readonly<{
  data: CompleteSyllabus;
}>;

const pdfUiStyles = {
  generalRow: styles.generalRow,
  generalRowLast: styles.generalRowLast,
  generalLabel: styles.generalLabel,
  generalValue: styles.generalValue,
  generalValueText: styles.generalValueText,
  sectionTitle: styles.sectionTitle,
  bulletText: styles.bulletText,
  emptyText: styles.emptyText,
};

const evaluationPdfStyles = {
  text: styles.text,
  textBold: styles.textBold,
  formulaText: styles.formulaText,
};

const outcomesTableStyles = {
  outcomesTable: styles.outcomesTable,
  outcomeHeaderRow: styles.outcomeHeaderRow,
  outcomeRow: styles.outcomeRow,
  outcomeRowLast: styles.outcomeRowLast,
  outcomeCodeCell: styles.outcomeCodeCell,
  outcomeDescriptionCell: styles.outcomeDescriptionCell,
  outcomeValueCell: styles.outcomeValueCell,
  outcomeHeaderText: styles.outcomeHeaderText,
  outcomeText: styles.outcomeText,
  outcomeCenteredText: styles.outcomeCenteredText,
  outcomeValueText: styles.outcomeValueText,
};

export function SyllabusPDFDocument({ data }: SyllabusPDFDocumentProps) {
  const datos = data.datosGenerales;

  const bibliograficas = data.fuentes?.filter(
    (fuente) => fuente.tipo !== "WEB",
  );

  const electronicas = data.fuentes?.filter((fuente) => fuente.tipo === "WEB");

  const horasTeoria = toNumber(datos.horasTeoria);
  const horasPractica = toNumber(datos.horasPractica);
  const totalHoras =
    toNumber(datos.horasTotales) || horasTeoria + horasPractica;
  const creditosTeoria = toNumber(datos.creditosTeoria);
  const creditosPractica = toNumber(datos.creditosPractica);
  const totalCreditos =
    toNumber(datos.creditosTotales) || creditosTeoria + creditosPractica;
  const outcomeRows = buildOutcomeRowsForPdf(data.aportesResultadosPrograma);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={LogoUsmpSilabo} style={styles.logo} />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>SÍLABO</Text>
          <Text style={styles.courseTitle}>
            {cleanPdfText(datos.nombreAsignatura).toUpperCase()}
          </Text>
          <Text style={styles.areaTitle}>
            ÁREA CURRICULAR:{" "}
            {cleanPdfText(
              datos.areaCurricular || "TECNOLOGÍA DE INFORMACIÓN",
            ).toUpperCase()}
          </Text>
        </View>

        <View style={styles.section}>
          <SectionTitle style={styles.sectionTitle}>
            I. DATOS GENERALES
          </SectionTitle>

          <View style={styles.generalTable}>
            <GeneralRow styles={pdfUiStyles} label="Departamento Académico">
              {datos.departamentoAcademico || ""}
            </GeneralRow>

            <GeneralRow styles={pdfUiStyles} label="Escuela Profesional">
              {datos.escuelaProfesional || ""}
            </GeneralRow>

            <GeneralRow styles={pdfUiStyles} label="Programa académico">
              {datos.programaAcademico || ""}
            </GeneralRow>

            <GeneralRow styles={pdfUiStyles} label="Semestre Académico">
              {datos.semestreAcademico || ""}
            </GeneralRow>

            <GeneralRow styles={pdfUiStyles} label="Tipo de asignatura">
              {datos.tipoAsignatura || ""}
            </GeneralRow>

            <GeneralRow styles={pdfUiStyles} label="Tipo de estudios">
              {`General (${markOption(datos.tipoEstudios, "general")})    Específica (${markOption(datos.tipoEstudios, "específica")})    Especialidad (${markOption(datos.tipoEstudios, "especialidad")})`}
            </GeneralRow>

            <GeneralRow styles={pdfUiStyles} label="Modalidad de la asignatura">
              {`Presencial (${markOption(datos.modalidad, "presencial")})    Semipresencial (${markOption(datos.modalidad, "semipresencial")})    A distancia (${markOption(datos.modalidad, "a distancia")})`}
            </GeneralRow>

            <GeneralRow styles={pdfUiStyles} label="Código de la asignatura">
              {datos.codigoAsignatura || ""}
            </GeneralRow>

            <GeneralRow styles={pdfUiStyles} label="Ciclo">
              {datos.ciclo || ""}
            </GeneralRow>

            <GeneralRow styles={pdfUiStyles} label="Requisitos">
              {datos.requisitos || "Ninguno"}
            </GeneralRow>

            <GeneralRow styles={pdfUiStyles} label="Cantidad de horas">
              <View style={styles.hoursBlock}>
                <Text style={styles.hoursLine}>
                  Teoría ({formatTwoDigits(horasTeoria)}) Práctica (
                  {formatTwoDigits(horasPractica)}) Total horas (
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

            <GeneralRow styles={pdfUiStyles} label="Cantidad de Créditos">
              {`Teoría (${formatTwoDigits(creditosTeoria)})    Práctica (${formatTwoDigits(creditosPractica)})    Total créditos (${formatTwoDigits(totalCreditos)})`}
            </GeneralRow>

            <GeneralRow styles={pdfUiStyles} label="Docente(s)" last>
              {datos.docentes || "Pendiente de asignación"}
            </GeneralRow>
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle style={styles.sectionTitle}>II. SUMILLA</SectionTitle>
          {isPdfValueNonEmpty(data.sumilla) ? (
            <Text style={styles.paragraph}>
              {cleanPdfText(data.sumilla).trim()}
            </Text>
          ) : (
            <Text style={styles.emptyText}>Sin información registrada.</Text>
          )}
        </View>

        <View style={styles.section}>
          <SectionTitle style={styles.sectionTitle}>
            III. COMPETENCIAS Y SUS COMPONENTES COMPRENDIDOS EN LA ASIGNATURA
          </SectionTitle>

          <Text style={styles.subsectionTitle}>3.1. Competencias</Text>
          <BulletList
            bulletStyle={styles.bulletText}
            emptyStyle={styles.emptyText}
            items={data.competenciasCurso}
          />

          <Text style={styles.subsectionTitle}>3.2. Componentes</Text>

          <Text style={styles.subsectionTitle}>Capacidades</Text>
          <BulletList
            bulletStyle={styles.bulletText}
            emptyStyle={styles.emptyText}
            items={data.componentesConceptuales}
          />

          {data.componentesProcedimentales?.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Procedimentales</Text>
              <BulletList
                bulletStyle={styles.bulletText}
                emptyStyle={styles.emptyText}
                items={data.componentesProcedimentales}
              />
            </>
          )}

          <Text style={styles.subsectionTitle}>Contenidos actitudinales</Text>
          <BulletList
            bulletStyle={styles.bulletText}
            emptyStyle={styles.emptyText}
            items={data.componentesActitudinales}
          />
        </View>

        <PdfUsmpPageFooter />
      </Page>

      <Page size="A4" orientation="landscape" style={styles.pageLandscape}>
        <SectionTitle style={styles.sectionTitle}>
          IV. PROGRAMACIÓN DE CONTENIDOS
        </SectionTitle>

        {data.unidadesDidacticas?.map((unidad) => {
          const semanas = getWeeks(unidad);

          return (
            <View key={unidad.id} style={styles.programUnitTable}>
              <View style={styles.programUnitTitle} wrap={false}>
                <Text style={styles.programUnitTitleText}>
                  UNIDAD {roman(unidad.numero)} :{" "}
                  {cleanPdfText(unidad.titulo).toUpperCase()}
                </Text>
              </View>

              <View style={styles.programCapacity}>
                <Text style={styles.programText}>
                  <Text style={styles.textBold}>CAPACIDAD:</Text>
                </Text>
                <ProgramLines
                  content={unidad.capacidadesText}
                  programTextStyle={styles.programText}
                />
              </View>

              <View style={styles.programHeaderRow} wrap={false}>
                <View style={[styles.programCell, styles.programWeekCell]}>
                  <Text style={styles.programHeaderText}>SEMANA</Text>
                </View>

                <View
                  style={[styles.programCell, styles.programConceptualCell]}
                >
                  <Text style={styles.programHeaderText}>
                    CONTENIDOS CONCEPTUALES
                  </Text>
                </View>

                <View
                  style={[styles.programCell, styles.programProceduralCell]}
                >
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
                  <View
                    key={semana.id || semana.semana}
                    style={styles.programRow}
                  >
                    <View style={[styles.programCell, styles.programWeekCell]}>
                      <Text style={styles.hourText}>{semana.semana}</Text>
                    </View>

                    <ProgramContentCell
                      isEvent={isEvent}
                      content={semana.contenidosConceptuales}
                      cellStyle={[
                        styles.programCell,
                        styles.programConceptualCell,
                      ]}
                      programTextStyle={styles.programText}
                    />

                    <ProgramContentCell
                      isEvent={isEvent}
                      content={semana.contenidosProcedimentales}
                      cellStyle={[
                        styles.programCell,
                        styles.programProceduralCell,
                      ]}
                      programTextStyle={styles.programText}
                    />

                    <ProgramActivityCell
                      isEvent={isEvent}
                      semana={semana}
                      cellStyle={[
                        styles.programCell,
                        styles.programActivityCell,
                      ]}
                      programTextStyle={styles.programText}
                    />

                    <ProgramHourCell
                      value={isEvent ? 0 : (semana.horasLectivasTeoria ?? 0)}
                      cellStyle={[styles.programCell, styles.programHourCell]}
                      hourTextStyle={styles.hourText}
                    />

                    <ProgramHourCell
                      value={isEvent ? 0 : (semana.horasLectivasPractica ?? 0)}
                      cellStyle={[styles.programCell, styles.programHourCell]}
                      hourTextStyle={styles.hourText}
                    />

                    <ProgramHourCell
                      value={isEvent ? 0 : (semana.horasNoLectivasTeoria ?? 0)}
                      cellStyle={[styles.programCell, styles.programHourCell]}
                      hourTextStyle={styles.hourText}
                    />

                    <ProgramHourCell
                      value={
                        isEvent ? 0 : (semana.horasNoLectivasPractica ?? 0)
                      }
                      cellStyle={[
                        styles.programCellLast,
                        styles.programHourCell,
                      ]}
                      hourTextStyle={styles.hourText}
                    />
                  </View>
                );
              })}
            </View>
          );
        })}

        <PdfUsmpPageFooter landscape />
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <SectionTitle style={styles.sectionTitle}>
            V. ESTRATEGIAS DIDÁCTICAS
          </SectionTitle>
          {renderBulletList(
            (data.estrategiasMetodologicas ?? []).map(strategyText),
            styles.bulletText,
            styles.emptyText,
          )}
        </View>

        <View style={styles.section}>
          <SectionTitle style={styles.sectionTitle}>
            VI. RECURSOS DIDÁCTICOS
          </SectionTitle>
          {renderBulletList(
            [
              ...(data.recursosDidacticos?.notas ?? []).map(resourceNoteText),
              ...(data.recursosDidacticos?.recursos ?? []).map(resourceText),
            ],
            styles.bulletText,
            styles.emptyText,
          )}
        </View>

        <View style={styles.section}>
          <SectionTitle style={styles.sectionTitle}>
            VII. EVALUACIÓN DEL APRENDIZAJE
          </SectionTitle>

          <EvaluationSection
            evaluacion={data.evaluacionAprendizaje}
            styles={evaluationPdfStyles}
          />
        </View>

        <View style={styles.section}>
          <SectionTitle style={styles.sectionTitle}>
            VIII. FUENTES DE INFORMACIÓN.
          </SectionTitle>

          {bibliograficas?.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>8.1 Bibliográficas</Text>
              {renderBulletList(
                bibliograficas.map(fuenteText),
                styles.bulletText,
                styles.emptyText,
              )}
            </>
          )}

          {electronicas?.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>8.2 Electrónicas</Text>
              {renderBulletList(
                electronicas.map(fuenteText),
                styles.bulletText,
                styles.emptyText,
              )}
            </>
          )}

          {(bibliograficas?.length ?? 0) === 0 &&
            (electronicas?.length ?? 0) === 0 && (
              <Text style={styles.emptyText}>Sin información registrada.</Text>
            )}
        </View>

        <View style={styles.section}>
          <SectionTitle style={styles.sectionTitle}>
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

          <OutcomesTablePdf rows={outcomeRows} styles={outcomesTableStyles} />
        </View>

        <PdfUsmpPageFooter />
      </Page>
    </Document>
  );
}
