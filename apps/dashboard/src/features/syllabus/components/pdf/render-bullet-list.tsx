import { Text, View, type TextProps } from "@react-pdf/renderer";
import { cleanPdfText, isPdfValueNonEmpty } from "./format-pdf-value";

type PdfTextStyle = TextProps["style"];

const renderBullet = (text: string, key: string, bulletStyle: PdfTextStyle) => {
  if (!isPdfValueNonEmpty(text)) {
    return null;
  }

  return (
    <Text key={key} style={bulletStyle}>
      - {text}
    </Text>
  );
};

export function renderBulletList(
  items: Array<string | null | undefined>,
  bulletStyle: PdfTextStyle,
  emptyStyle: PdfTextStyle,
) {
  const bullets = items
    .map((item) => {
      const text = cleanPdfText(item).trim();
      const key = `bullet-${text}`;
      return renderBullet(text, key, bulletStyle);
    })
    .filter(Boolean);

  if (bullets.length === 0) {
    return <Text style={emptyStyle}>Sin información registrada.</Text>;
  }

  return <View>{bullets}</View>;
}
