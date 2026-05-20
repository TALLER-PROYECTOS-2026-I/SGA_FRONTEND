import { Text, View, type TextProps } from "@react-pdf/renderer";

type PdfTextStyle = TextProps["style"];
import type { ReactNode } from "react";
import { cleanPdfText } from "./format-pdf-value";

type SyllabusPdfUiStyles = Readonly<{
  generalRow: PdfTextStyle;
  generalRowLast: PdfTextStyle;
  generalLabel: PdfTextStyle;
  generalValue: PdfTextStyle;
  generalValueText: PdfTextStyle;
  sectionTitle: PdfTextStyle;
  bulletText: PdfTextStyle;
  emptyText: PdfTextStyle;
}>;

type GeneralRowProps = Readonly<{
  label: string;
  children: ReactNode;
  last?: boolean;
  styles: SyllabusPdfUiStyles;
}>;

export function GeneralRow({
  label,
  children,
  last = false,
  styles,
}: GeneralRowProps) {
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

type SectionTitleProps = Readonly<{
  children: ReactNode;
  style: PdfTextStyle;
}>;

export function SectionTitle({ children, style }: SectionTitleProps) {
  return (
    <Text style={style} wrap={false}>
      {children}
    </Text>
  );
}

type CodedBulletItem = Readonly<{
  codigo?: string | number;
  code?: string | number;
  descripcion?: string;
  text?: string;
}>;

const renderCodedBullet = (
  item: CodedBulletItem,
  key: string,
  bulletStyle: PdfTextStyle,
) => {
  const code = cleanPdfText(item.codigo ?? item.code).trim();
  const text = cleanPdfText(item.descripcion ?? item.text).trim();

  if (!text) {
    return null;
  }

  const codePrefix = code ? `${code} - ` : "";

  return (
    <Text key={key} style={bulletStyle}>
      - {codePrefix}
      {text}
    </Text>
  );
};

type BulletListProps = Readonly<{
  items?: Array<{ descripcion?: string; codigo?: string }>;
  bulletStyle: PdfTextStyle;
  emptyStyle: PdfTextStyle;
}>;

export function BulletList({
  items,
  bulletStyle,
  emptyStyle,
}: BulletListProps) {
  const bullets = (items ?? [])
    .map((item) => {
      const key = `${item.codigo ?? "item"}-${item.descripcion ?? "desc"}`;
      return renderCodedBullet(item, key, bulletStyle);
    })
    .filter(Boolean);

  if (bullets.length === 0) {
    return <Text style={emptyStyle}>Sin información registrada.</Text>;
  }

  return <View>{bullets}</View>;
}
