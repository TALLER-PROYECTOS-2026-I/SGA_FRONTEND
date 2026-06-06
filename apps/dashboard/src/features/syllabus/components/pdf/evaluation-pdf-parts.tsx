import { Text, type TextProps } from "@react-pdf/renderer";
import type { CompleteSyllabus } from "../../types/complete-syllabus";
import { cleanFormulaExpression } from "./syllabus-format-helpers";

type PdfTextStyle = TextProps["style"];

type FormulaComponentItem = Readonly<{
  codigo?: string;
  descripcion?: string;
}>;

type EvaluationPdfStyles = Readonly<{
  text: PdfTextStyle;
  textBold: PdfTextStyle;
  formulaText: PdfTextStyle;
}>;

function FormulaComponentLine({
  item,
  styles,
}: Readonly<{
  item: FormulaComponentItem;
  styles: EvaluationPdfStyles;
}>) {
  return (
    <Text style={styles.text}>
      <Text style={styles.textBold}>{item.codigo}</Text> = {item.descripcion}
    </Text>
  );
}

type EvaluationSectionProps = Readonly<{
  evaluacion: CompleteSyllabus["evaluacionAprendizaje"];
  styles: EvaluationPdfStyles;
}>;

export function EvaluationSection({
  evaluacion,
  styles,
}: EvaluationSectionProps) {
  if (evaluacion?.formulaEvaluacion) {
    return (
      <>
        <Text style={styles.text}>
          El promedio final de la asignatura se obtiene con la siguiente
          fórmula:
        </Text>

        <Text style={styles.formulaText}>
          {cleanFormulaExpression(
            evaluacion.formulaEvaluacion.variableFinalCodigo || "PF",
            evaluacion.formulaEvaluacion.expresionFinal,
          )}
        </Text>

        {evaluacion.formulaEvaluacion.variables?.map((variable, idx) => (
          <FormulaComponentLine
            key={`var-${variable.codigo ?? variable.descripcion ?? idx}`}
            item={variable}
            styles={styles}
          />
        ))}

        {evaluacion.formulaEvaluacion.subformulas?.map((subformula, idx) => (
          <Text
            key={`subformula-${subformula.variableCodigo ?? subformula.expresion ?? idx}`}
            style={styles.formulaText}
          >
            {cleanFormulaExpression(
              subformula.variableCodigo,
              subformula.expresion,
            )}
          </Text>
        ))}
      </>
    );
  }

  return (
    <>
      {evaluacion?.descripcion && (
        <Text style={styles.text}>{evaluacion.descripcion}</Text>
      )}

      {evaluacion?.formulaPF && (
        <Text style={styles.formulaText}>
          {cleanFormulaExpression("PF", evaluacion.formulaPF)}
        </Text>
      )}

      {evaluacion?.componentesPF?.map((item, index) => (
        <FormulaComponentLine
          key={`pf-${item.codigo ?? item.descripcion ?? index}`}
          item={item}
          styles={styles}
        />
      ))}

      {evaluacion?.descripcionPE && (
        <Text style={styles.text}>{evaluacion.descripcionPE}</Text>
      )}

      {evaluacion?.formulaPE && (
        <Text style={styles.formulaText}>
          {cleanFormulaExpression("PE", evaluacion.formulaPE)}
        </Text>
      )}

      {evaluacion?.componentesPE?.map((item, idx) => (
        <FormulaComponentLine
          key={`pe-${item.codigo ?? item.descripcion ?? idx}`}
          item={item}
          styles={styles}
        />
      ))}
    </>
  );
}
