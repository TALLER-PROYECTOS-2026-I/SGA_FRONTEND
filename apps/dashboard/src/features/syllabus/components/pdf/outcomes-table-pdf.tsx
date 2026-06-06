import {
  Text,
  View,
  type TextProps,
  type ViewProps,
} from "@react-pdf/renderer";

type OutcomeRow = Readonly<{
  code: string;
  description: string;
  value: string;
}>;

type OutcomesTableStyles = Readonly<{
  outcomesTable: ViewProps["style"];
  outcomeHeaderRow: ViewProps["style"];
  outcomeRow: ViewProps["style"];
  outcomeRowLast: ViewProps["style"];
  outcomeCodeCell: ViewProps["style"];
  outcomeDescriptionCell: ViewProps["style"];
  outcomeValueCell: ViewProps["style"];
  outcomeHeaderText: TextProps["style"];
  outcomeText: TextProps["style"];
  outcomeCenteredText: TextProps["style"];
  outcomeValueText: TextProps["style"];
}>;

type OutcomesTablePdfProps = Readonly<{
  rows: OutcomeRow[];
  styles: OutcomesTableStyles;
}>;

export function OutcomesTablePdf({ rows, styles }: OutcomesTablePdfProps) {
  return (
    <View style={styles.outcomesTable}>
      <View style={styles.outcomeHeaderRow} wrap={false}>
        <View style={styles.outcomeCodeCell}>
          <Text style={styles.outcomeHeaderText}>Código</Text>
        </View>

        <View style={styles.outcomeDescriptionCell}>
          <Text style={styles.outcomeHeaderText}>Resultado del estudiante</Text>
        </View>

        <View style={styles.outcomeValueCell}>
          <Text style={styles.outcomeHeaderText}>Aporte</Text>
        </View>
      </View>

      {rows.map((aporte, index) => (
        <View
          key={aporte.code}
          style={
            index === rows.length - 1
              ? styles.outcomeRowLast
              : styles.outcomeRow
          }
        >
          <View style={styles.outcomeCodeCell}>
            <Text style={styles.outcomeCenteredText}>{aporte.code}</Text>
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
  );
}
