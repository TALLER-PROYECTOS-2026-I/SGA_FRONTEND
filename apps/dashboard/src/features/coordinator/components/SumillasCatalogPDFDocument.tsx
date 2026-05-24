import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export interface SumillaPDFItem {
  id: string;
  title: string;
  tipoAsignatura: string;
  tipoEstudios: string;
  modalidad: string;
  codigoAsignatura: string;
  ciclo: string;
  requisitos: string;
  horasTeoria: string;
  horasPractica: string;
  horasTotal: string;
  creditosTeoria: string;
  creditosPractica: string;
  creditosTotal: string;
  departamentoAcademico: string;
  escuelaProfesional: string;
  programaAcademico: string;
  semestreAcademico: string;
  docente: string;
  estadoRevision: string;
  sumilla: string;
}

interface SumillasCatalogPDFDocumentProps {
  items: SumillaPDFItem[];
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 52,
    paddingHorizontal: 58,
    paddingBottom: 58,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: "#111827",
  },
  title: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 18,
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#111827",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    minHeight: 22,
  },
  lastRow: {
    flexDirection: "row",
    minHeight: 22,
  },
  labelCell: {
    width: "36%",
    borderRightWidth: 1,
    borderRightColor: "#111827",
    paddingVertical: 5,
    paddingHorizontal: 7,
    fontWeight: "bold",
  },
  valueCell: {
    width: "64%",
    paddingVertical: 5,
    paddingHorizontal: 7,
  },
  valueCellSplit: {
    width: "64%",
    flexDirection: "row",
  },
  splitItem: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 7,
    borderRightWidth: 1,
    borderRightColor: "#111827",
  },
  splitItemLast: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 7,
  },
  paragraph: {
    fontSize: 10.5,
    lineHeight: 1.45,
    textAlign: "justify",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 10.5,
    fontWeight: "bold",
    marginBottom: 6,
  },
  note: {
    fontSize: 8.5,
    color: "#6b7280",
    lineHeight: 1.4,
  },
  footerBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 30,
    backgroundColor: "#dc0000",
  },
  footerText: {
    position: "absolute",
    bottom: 11,
    left: 58,
    right: 58,
    color: "#ffffff",
    fontSize: 8,
    textAlign: "center",
  },
  pageNumber: {
    position: "absolute",
    right: 58,
    bottom: 38,
    fontSize: 8,
    color: "#6b7280",
  },
});

function clean(value: string | number | null | undefined) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "No registrado";
  }

  return String(value).trim();
}

function cleanSumilla(value: string | null | undefined) {
  if (!value || value.trim() === "") {
    return "Este sílabo aún no tiene sumilla registrada.";
  }

  return value.trim();
}

export function SumillasCatalogPDFDocument({
  items,
}: SumillasCatalogPDFDocumentProps) {
  return (
    <Document>
      {items.map((item) => (
        <Page key={item.id} size="A4" style={styles.page}>
          <Text style={styles.title}>{clean(item.title)}</Text>

          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Tipo de asignatura</Text>
              <Text style={styles.valueCell}>{clean(item.tipoAsignatura)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.labelCell}>Tipo de estudios</Text>

              <View style={styles.valueCellSplit}>
                <Text style={styles.splitItem}>{clean(item.tipoEstudios)}</Text>
                <Text style={styles.splitItem}>
                  Escuela: {clean(item.escuelaProfesional)}
                </Text>
                <Text style={styles.splitItemLast}>
                  Programa: {clean(item.programaAcademico)}
                </Text>
              </View>
            </View>

            <View style={styles.row}>
              <Text style={styles.labelCell}>Modalidad de la asignatura</Text>
              <Text style={styles.valueCell}>{clean(item.modalidad)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.labelCell}>Código de la asignatura</Text>
              <Text style={styles.valueCell}>
                {clean(item.codigoAsignatura)}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.labelCell}>Ciclo</Text>
              <Text style={styles.valueCell}>{clean(item.ciclo)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.labelCell}>Semestre Académico</Text>
              <Text style={styles.valueCell}>
                {clean(item.semestreAcademico)}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.labelCell}>Departamento Académico</Text>
              <Text style={styles.valueCell}>
                {clean(item.departamentoAcademico)}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.labelCell}>Docente(s)</Text>
              <Text style={styles.valueCell}>{clean(item.docente)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.labelCell}>Requisito(s)</Text>
              <Text style={styles.valueCell}>{clean(item.requisitos)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.labelCell}>Cantidad de horas</Text>

              <View style={styles.valueCellSplit}>
                <Text style={styles.splitItem}>
                  Teoría ({clean(item.horasTeoria)})
                </Text>
                <Text style={styles.splitItem}>
                  Práctica ({clean(item.horasPractica)})
                </Text>
                <Text style={styles.splitItemLast}>
                  Total horas ({clean(item.horasTotal)})
                </Text>
              </View>
            </View>

            <View style={styles.row}>
              <Text style={styles.labelCell}>Cantidad de Créditos</Text>

              <View style={styles.valueCellSplit}>
                <Text style={styles.splitItem}>
                  Teoría ({clean(item.creditosTeoria)})
                </Text>
                <Text style={styles.splitItem}>
                  Práctica ({clean(item.creditosPractica)})
                </Text>
                <Text style={styles.splitItemLast}>
                  Total créditos ({clean(item.creditosTotal)})
                </Text>
              </View>
            </View>

            <View style={styles.lastRow}>
              <Text style={styles.labelCell}>Estado</Text>
              <Text style={styles.valueCell}>{clean(item.estadoRevision)}</Text>
            </View>
          </View>

          <Text style={styles.paragraph}>{cleanSumilla(item.sumilla)}</Text>

          <Text style={styles.subtitle}>
            La asignatura se desarrolla mediante las unidades de aprendizaje
            registradas en el sílabo correspondiente.
          </Text>

          <Text style={styles.note}>
            Reporte generado desde el Catálogo de Sumillas del Sistema de
            Gestión Académica.
          </Text>

          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
            fixed
          />

          <View style={styles.footerBar} fixed />

          <Text style={styles.footerText} fixed>
            Escuela Profesional de Ingeniería de Computación y Sistemas
          </Text>
        </Page>
      ))}
    </Document>
  );
}