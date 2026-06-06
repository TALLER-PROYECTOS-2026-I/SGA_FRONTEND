import { Image, StyleSheet } from "@react-pdf/renderer";
import selloUsmp from "../../../assets/sello_usmp.png";

type PdfUsmpPageFooterProps = Readonly<{
  landscape?: boolean;
}>;

const styles = StyleSheet.create({
  seal: {
    position: "absolute",
    right: 18,
    bottom: 120,
    width: 72,
    height: 72,
  },
  sealLandscape: {
    position: "absolute",
    right: 22,
    bottom: 48,
    width: 68,
    height: 68,
  },
});

export function PdfUsmpPageFooter({
  landscape = false,
}: PdfUsmpPageFooterProps) {
  return (
    <Image
      src={selloUsmp}
      style={landscape ? styles.sealLandscape : styles.seal}
      fixed
    />
  );
}
