import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { PdfUsmpPageFooter } from "../pdf-usmp-page-footer";
import { cleanCatalogPdfValue, cleanCatalogSumilla } from "./format-pdf-value";

export type SumillaPDFItem = Readonly<{
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
}>;

type SumillasCatalogPDFDocumentProps = Readonly<{
  items: SumillaPDFItem[];
}>;

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
});

function CatalogRow({
  label,
  children,
  last = false,
}: Readonly<{
  label: string;
  children: ReactNode;
  last?: boolean;
}>) {
  return (
    <View style={last ? styles.lastRow : styles.row}>
      <Text style={styles.labelCell}>{label}</Text>
      {children}
    </View>
  );
}

export function SumillasCatalogPDFDocument({
  items,
}: SumillasCatalogPDFDocumentProps) {
  return (
    <Document>
      {items.map((item) => (
        <Page key={item.id} size="A4" style={styles.page}>
          <Text style={styles.title}>{cleanCatalogPdfValue(item.title)}</Text>

          <View style={styles.table}>
            <CatalogRow label="Tipo de asignatura">
              <Text style={styles.valueCell}>
                {cleanCatalogPdfValue(item.tipoAsignatura)}
              </Text>
            </CatalogRow>

            <CatalogRow label="Tipo de estudios">
              <View style={styles.valueCellSplit}>
                <Text style={styles.splitItem}>
                  {cleanCatalogPdfValue(item.tipoEstudios)}
                </Text>
                <Text style={styles.splitItem}>
                  Escuela: {cleanCatalogPdfValue(item.escuelaProfesional)}
                </Text>
                <Text style={styles.splitItemLast}>
                  Programa: {cleanCatalogPdfValue(item.programaAcademico)}
                </Text>
              </View>
            </CatalogRow>

            <CatalogRow label="Modalidad de la asignatura">
              <Text style={styles.valueCell}>
                {cleanCatalogPdfValue(item.modalidad)}
              </Text>
            </CatalogRow>

            <CatalogRow label="Código de la asignatura">
              <Text style={styles.valueCell}>
                {cleanCatalogPdfValue(item.codigoAsignatura)}
              </Text>
            </CatalogRow>

            <CatalogRow label="Ciclo">
              <Text style={styles.valueCell}>
                {cleanCatalogPdfValue(item.ciclo)}
              </Text>
            </CatalogRow>

            <CatalogRow label="Semestre Académico">
              <Text style={styles.valueCell}>
                {cleanCatalogPdfValue(item.semestreAcademico)}
              </Text>
            </CatalogRow>

            <CatalogRow label="Departamento Académico">
              <Text style={styles.valueCell}>
                {cleanCatalogPdfValue(item.departamentoAcademico)}
              </Text>
            </CatalogRow>

            <CatalogRow label="Docente(s)">
              <Text style={styles.valueCell}>
                {cleanCatalogPdfValue(item.docente)}
              </Text>
            </CatalogRow>

            <CatalogRow label="Requisito(s)">
              <Text style={styles.valueCell}>
                {cleanCatalogPdfValue(item.requisitos)}
              </Text>
            </CatalogRow>

            <CatalogRow label="Cantidad de horas">
              <View style={styles.valueCellSplit}>
                <Text style={styles.splitItem}>
                  Teoría ({cleanCatalogPdfValue(item.horasTeoria)})
                </Text>
                <Text style={styles.splitItem}>
                  Práctica ({cleanCatalogPdfValue(item.horasPractica)})
                </Text>
                <Text style={styles.splitItemLast}>
                  Total horas ({cleanCatalogPdfValue(item.horasTotal)})
                </Text>
              </View>
            </CatalogRow>

            <CatalogRow label="Cantidad de Créditos">
              <View style={styles.valueCellSplit}>
                <Text style={styles.splitItem}>
                  Teoría ({cleanCatalogPdfValue(item.creditosTeoria)})
                </Text>
                <Text style={styles.splitItem}>
                  Práctica ({cleanCatalogPdfValue(item.creditosPractica)})
                </Text>
                <Text style={styles.splitItemLast}>
                  Total créditos ({cleanCatalogPdfValue(item.creditosTotal)})
                </Text>
              </View>
            </CatalogRow>

            <CatalogRow label="Estado" last>
              <Text style={styles.valueCell}>
                {cleanCatalogPdfValue(item.estadoRevision)}
              </Text>
            </CatalogRow>
          </View>

          <Text style={styles.paragraph}>
            {cleanCatalogSumilla(item.sumilla)}
          </Text>

          <Text style={styles.subtitle}>
            La asignatura se desarrolla mediante las unidades de aprendizaje
            registradas en el sílabo correspondiente.
          </Text>

          <Text style={styles.note}>
            Reporte generado desde el Catálogo de Sumillas del Sistema de
            Gestión Académica.
          </Text>

          <PdfUsmpPageFooter />

          <View style={styles.footerBar} fixed />

          <Text style={styles.footerText} fixed>
            Escuela Profesional de Ingeniería de Computación y Sistemas
          </Text>
        </Page>
      ))}
    </Document>
  );
}
