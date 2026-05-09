import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ReactNode } from "react";
import type {
  CompleteSyllabus,
  SemanaUnidad,
  UnidadDidactica,
  FuenteInformacion,
} from "../types/complete-syllabus";

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 32,
    fontFamily: "Helvetica",
    fontSize: 8.5,
    lineHeight: 1.25,
    color: "#000000",
  },

  pageLandscape: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 26,
    fontFamily: "Helvetica",
    fontSize: 6.4,
    lineHeight: 1.18,
    color: "#000000",
  },

  header: {
    marginBottom: 14,
  },

  logoText: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#c00000",
    marginBottom: 2,
  },

  facultyText: {
    fontSize: 7.5,
    color: "#c00000",
    marginBottom: 18,
  },

  title: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 2,
  },

  courseTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 12,
  },

  areaTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 18,
  },

  section: {
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },

  text: {
    fontSize: 8.5,
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
    fontSize: 8.8,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    marginTop: 4,
  },

  generalTable: {
    width: "100%",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#000000",
  },

  generalRow: {
    flexDirection: "row",
    minHeight: 17,
  },

  generalLabel: {
    width: "40%",
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000000",
    justifyContent: "center",
  },

  generalValue: {
    width: "60%",
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000000",
    justifyContent: "center",
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
    width: "60%",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000000",
  },

  hoursLine: {
    fontSize: 8,
    marginBottom: 2,
  },

  unitBox: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#000000",
    marginBottom: 12,
  },

  unitTitle: {
    padding: 5,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000000",
  },

  unitTitleText: {
    fontSize: 8.2,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },

  capacityBox: {
    padding: 5,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000000",
  },

  programHeaderRow: {
    flexDirection: "row",
  },

  programRow: {
    flexDirection: "row",
    minHeight: 74,
  },

  th: {
    padding: 3,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },

  td: {
    padding: 3,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000000",
  },

  thText: {
    fontSize: 5.8,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },

  tdText: {
    fontSize: 6.2,
    lineHeight: 1.18,
  },

  weekCol: {
    width: "5.5%",
    justifyContent: "center",
    alignItems: "center",
  },

  conceptualCol: {
    width: "25%",
  },

  proceduralCol: {
    width: "25%",
  },

  activityCol: {
    width: "19%",
  },

  hourCol: {
    width: "6.375%",
    justifyContent: "center",
    alignItems: "center",
  },

  hourGroup: {
    width: "12.75%",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000000",
  },

  hourGroupTitle: {
    height: 18,
    borderBottomWidth: 1,
    borderColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
  },

  hourGroupSubRow: {
    flexDirection: "row",
    flex: 1,
  },

  hourSubCell: {
    width: "50%",
    borderRightWidth: 1,
    borderColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 1,
  },

  hourSubCellLast: {
    width: "50%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 1,
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

  formulaText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },

  footer: {
    position: "absolute",
    bottom: 12,
    left: 32,
    right: 32,
    textAlign: "center",
  },

  footerText: {
    fontSize: 7,
  },
});

interface SyllabusPDFDocumentProps {
  data: CompleteSyllabus;
}

function cleanText(value?: string | number | null) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function pad2(value?: number | string | null) {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "00";
  return String(num).padStart(2, "0");
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

function checked(current?: string, expected?: string) {
  return cleanText(current).toLowerCase() === cleanText(expected).toLowerCase()
    ? "X"
    : " ";
}

function GeneralRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.generalRow}>
      <View style={styles.generalLabel}>
        <Text>{label}</Text>
      </View>

      <View style={styles.generalValue}>{children}</View>
    </View>
  );
}

function GeneralSplitRow({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  return (
    <View style={styles.generalRow}>
      <View style={styles.generalLabel}>
        <Text>{label}</Text>
      </View>

      <View style={styles.splitRow}>
        {items.map((item, index) => (
          <View
            key={item}
            style={
              index === items.length - 1 ? styles.splitCellLast : styles.splitCell
            }
          >
            <Text>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text
        style={styles.footerText}
        render={({ pageNumber }) => String(pageNumber)}
      />
    </View>
  );
}

function BulletList({ items }: { items?: Array<{ descripcion?: string; codigo?: string }> }) {
  if (!items || items.length === 0) {
    return <Text style={styles.listItem}>-</Text>;
  }

  return (
    <View>
      {items.map((item, index) => (
        <Text key={index} style={styles.listItem}>
          • {item.descripcion || ""} {item.codigo ? `(${item.codigo})` : ""}
        </Text>
      ))}
    </View>
  );
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

function activityText(semana: SemanaUnidad) {
  const value = cleanText(semana.actividadesAprendizaje).trim();

  if (value) return value;

  return "Lectivas\n- Desarrollo del tema\n\nDe trabajo Independiente\n- No Aplica";
}

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

function fuenteText(fuente: FuenteInformacion) {
  const autores = fuente.autores || "";
  const anio = fuente.anio || "s.f.";
  const titulo = fuente.titulo || "";
  const editorial = fuente.editorial ? `, ${fuente.editorial}` : "";
  const ciudad = fuente.ciudad ? `, ${fuente.ciudad}` : "";
  const isbn = fuente.isbn ? `, ISBN: ${fuente.isbn}` : "";
  const url = fuente.url ? `, ${fuente.url}` : "";

  return `${autores} (${anio}). ${titulo}${editorial}${ciudad}${isbn}${url}`;
}

export function SyllabusPDFDocument({ data }: SyllabusPDFDocumentProps) {
  const datos = data.datosGenerales;

  const bibliograficas = data.fuentes?.filter(
    (fuente) => fuente.tipo === "LIBRO" || fuente.tipo === "ART",
  );

  const electronicas = data.fuentes?.filter((fuente) => fuente.tipo === "WEB");

  const otros = data.fuentes?.filter((fuente) => fuente.tipo === "OTRO");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logoText}>USMP</Text>
          <Text style={styles.facultyText}>
            Facultad de Ingeniería y Arquitectura
          </Text>

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
              <Text>{datos.departamentoAcademico}</Text>
            </GeneralRow>

            <GeneralRow label="Escuela Profesional">
              <Text>{datos.escuelaProfesional}</Text>
            </GeneralRow>

            <GeneralRow label="Programa académico">
              <Text>{datos.programaAcademico}</Text>
            </GeneralRow>

            <GeneralRow label="Semestre Académico">
              <Text>{datos.semestreAcademico}</Text>
            </GeneralRow>

            <GeneralRow label="Tipo de asignatura">
              <Text>{datos.tipoAsignatura}</Text>
            </GeneralRow>

            <GeneralSplitRow
              label="Tipo de estudios"
              items={[
                `General (${checked(datos.tipoEstudios, "general")})`,
                `Específica (${checked(datos.tipoEstudios, "específica")})`,
                `Especialidad (${checked(datos.tipoEstudios, "especialidad")})`,
              ]}
            />

            <GeneralSplitRow
              label="Modalidad de la asignatura"
              items={[
                `Presencial (${checked(datos.modalidad, "presencial")})`,
                `Semipresencial (${checked(datos.modalidad, "semipresencial")})`,
                `A distancia (${checked(datos.modalidad, "aDistancia")})`,
              ]}
            />

            <GeneralRow label="Código de la asignatura">
              <Text>{datos.codigoAsignatura}</Text>
            </GeneralRow>

            <GeneralRow label="Ciclo">
              <Text>{datos.ciclo}</Text>
            </GeneralRow>

            <GeneralRow label="Requisitos">
              <Text>{datos.requisitos}</Text>
            </GeneralRow>

            <View style={styles.generalRow}>
              <View style={styles.generalLabel}>
                <Text>Cantidad de horas</Text>
              </View>

              <View style={styles.hoursBlock}>
                <Text style={styles.hoursLine}>
                  Teoría ({pad2(datos.horasTeoria)}) Práctica (
                  {pad2(datos.horasPractica)}) Total horas (
                  {pad2(datos.horasTotales)})
                </Text>
                <Text style={styles.hoursLine}>
                  Teoría lectiva presencial ({pad2(datos.horasTeoria)})
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
                  Práctica lectiva presencial ({pad2(datos.horasPractica)})
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
            </View>

            <GeneralRow label="Cantidad de Créditos">
              <Text>
                Teoría ({pad2(datos.creditosTeoria)}) Práctica (
                {pad2(datos.creditosPractica)}) Total créditos (
                {pad2(datos.creditosTotales)})
              </Text>
            </GeneralRow>

            <GeneralRow label="Docente(s)">
              <Text>{datos.docentes}</Text>
            </GeneralRow>
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle>II. SUMILLA</SectionTitle>
          <Text style={styles.text}>{data.sumilla || ""}</Text>
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
            <View key={unidad.id} style={styles.unitBox}>
              <View style={styles.unitTitle}>
                <Text style={styles.unitTitleText}>
                  UNIDAD {roman(unidad.numero)} :{" "}
                  {cleanText(unidad.titulo).toUpperCase()}
                </Text>
              </View>

              <View style={styles.capacityBox}>
                <Text style={styles.tdText}>
                  <Text style={styles.textBold}>CAPACIDAD:</Text>
                </Text>

                {textToBullets(unidad.capacidadesText)
                  .split("\n")
                  .map((line, index) => (
                    <Text key={index} style={styles.tdText}>
                      {line}
                    </Text>
                  ))}
              </View>

              <View style={styles.programHeaderRow}>
                <View style={[styles.th, styles.weekCol]}>
                  <Text style={styles.thText}>SEMANA</Text>
                </View>

                <View style={[styles.th, styles.conceptualCol]}>
                  <Text style={styles.thText}>CONTENIDOS CONCEPTUALES</Text>
                </View>

                <View style={[styles.th, styles.proceduralCol]}>
                  <Text style={styles.thText}>
                    CONTENIDOS PROCEDIMENTALES
                  </Text>
                </View>

                <View style={[styles.th, styles.activityCol]}>
                  <Text style={styles.thText}>ACTIVIDADES DE APRENDIZAJE</Text>
                </View>

                <View style={styles.hourGroup}>
                  <View style={styles.hourGroupTitle}>
                    <Text style={styles.thText}>HORAS LECTIVAS</Text>
                  </View>

                  <View style={styles.hourGroupSubRow}>
                    <View style={styles.hourSubCell}>
                      <Text style={styles.thText}>TEORÍA</Text>
                    </View>
                    <View style={styles.hourSubCellLast}>
                      <Text style={styles.thText}>PRÁCTICA</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.hourGroup}>
                  <View style={styles.hourGroupTitle}>
                    <Text style={styles.thText}>HORAS NO LECTIVAS</Text>
                  </View>

                  <View style={styles.hourGroupSubRow}>
                    <View style={styles.hourSubCell}>
                      <Text style={styles.thText}>TEORÍA</Text>
                    </View>
                    <View style={styles.hourSubCellLast}>
                      <Text style={styles.thText}>PRÁCTICA</Text>
                    </View>
                  </View>
                </View>
              </View>

              {semanas.map((semana) => (
                <View key={semana.id || semana.semana} style={styles.programRow}>
                  <View style={[styles.td, styles.weekCol]}>
                    <Text style={styles.tdText}>{semana.semana}</Text>
                  </View>

                  <View style={[styles.td, styles.conceptualCol]}>
                    {textToBullets(semana.contenidosConceptuales)
                      .split("\n")
                      .map((line, index) => (
                        <Text key={index} style={styles.tdText}>
                          {line}
                        </Text>
                      ))}
                  </View>

                  <View style={[styles.td, styles.proceduralCol]}>
                    {textToBullets(semana.contenidosProcedimentales)
                      .split("\n")
                      .map((line, index) => (
                        <Text key={index} style={styles.tdText}>
                          {line}
                        </Text>
                      ))}
                  </View>

                  <View style={[styles.td, styles.activityCol]}>
                    {activityText(semana)
                      .split("\n")
                      .map((line, index) => (
                        <Text key={index} style={styles.tdText}>
                          {line}
                        </Text>
                      ))}
                  </View>

                  <View style={[styles.td, styles.hourCol]}>
                    <Text style={styles.tdText}>
                      {semana.horasLectivasTeoria ?? 0}
                    </Text>
                  </View>

                  <View style={[styles.td, styles.hourCol]}>
                    <Text style={styles.tdText}>
                      {semana.horasLectivasPractica ?? 0}
                    </Text>
                  </View>

                  <View style={[styles.td, styles.hourCol]}>
                    <Text style={styles.tdText}>
                      {semana.horasNoLectivasTeoria ?? 0}
                    </Text>
                  </View>

                  <View style={[styles.td, styles.hourCol]}>
                    <Text style={styles.tdText}>
                      {semana.horasNoLectivasPractica ?? 0}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          );
        })}

        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <SectionTitle>V. ESTRATEGIAS DIDÁCTICAS</SectionTitle>

          {data.estrategiasMetodologicas?.length > 0 ? (
            data.estrategiasMetodologicas.map((estrategia, index) => (
              <Text key={index} style={styles.listItem}>
                - {estrategia.nombre}
                {estrategia.descripcion ? `. ${estrategia.descripcion}` : ""}
              </Text>
            ))
          ) : (
            <Text style={styles.text}>-</Text>
          )}
        </View>

        <View style={styles.section}>
          <SectionTitle>VI. RECURSOS DIDÁCTICOS</SectionTitle>

          {data.recursosDidacticos?.notas?.map((nota, index) => (
            <Text key={`nota-${index}`} style={styles.text}>
              <Text style={styles.textBold}>{nota.nombre}: </Text>
              {nota.descripcion}
            </Text>
          ))}

          {data.recursosDidacticos?.recursos?.map((recurso, index) => (
            <Text key={`recurso-${index}`} style={styles.text}>
              <Text style={styles.textBold}>{recurso.destino}: </Text>
              {recurso.recursoNombre}
              {recurso.observaciones ? ` - ${recurso.observaciones}` : ""}
            </Text>
          ))}
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
                {
                  data.evaluacionAprendizaje.formulaEvaluacion
                    .variableFinalCodigo
                }{" "}
                = {data.evaluacionAprendizaje.formulaEvaluacion.expresionFinal}
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
                    {subformula.variableCodigo} = {subformula.expresion}
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
                  {data.evaluacionAprendizaje.formulaPF}
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
                  {data.evaluacionAprendizaje.formulaPE}
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
              {bibliograficas.map((fuente, index) => (
                <Text key={index} style={styles.listItem}>
                  - {fuenteText(fuente)}
                </Text>
              ))}
            </>
          )}

          {electronicas?.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>8.2 Electrónicas</Text>
              {electronicas.map((fuente, index) => (
                <Text key={index} style={styles.listItem}>
                  - {fuenteText(fuente)}
                </Text>
              ))}
            </>
          )}

          {otros?.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>8.3 Otras</Text>
              {otros.map((fuente, index) => (
                <Text key={index} style={styles.listItem}>
                  - {fuenteText(fuente)}
                </Text>
              ))}
            </>
          )}
        </View>

        <View style={styles.section}>
          <SectionTitle>
            IX. APORTE DE LA ASIGNATURA AL LOGRO DE RESULTADOS
          </SectionTitle>

          <Text style={styles.text}>
            El aporte de la asignatura al logro de los Resultados del Estudiante
            (<Text style={styles.textItalic}>Student Outcomes</Text>) en la
            formación del graduado en Ingeniería de Computación y Sistemas, se
            establece en la tabla siguiente:
          </Text>

          <Text style={styles.text}>
            <Text style={styles.textBold}>K</Text> = clave{" "}
            <Text style={styles.textBold}>R</Text> = relacionado{" "}
            <Text style={styles.textBold}>Recuadro vacío</Text> = no aplica
          </Text>

          <View style={styles.compactTable}>
            {data.aportesResultadosPrograma?.map((aporte, index) => (
              <View key={index} style={styles.compactRow}>
                <View style={[styles.compactCell, { width: "8%" }]}>
                  <Text>{aporte.resultadoCodigo || index + 1}</Text>
                </View>

                <View style={[styles.compactCell, { width: "82%" }]}>
                  <Text>{aporte.resultadoDescripcion}</Text>
                </View>

                <View style={[styles.compactCell, { width: "10%" }]}>
                  <Text>{aporte.aporteValor}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <Footer />
      </Page>
    </Document>
  );
}