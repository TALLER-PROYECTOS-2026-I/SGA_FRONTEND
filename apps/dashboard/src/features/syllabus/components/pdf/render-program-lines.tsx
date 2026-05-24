import { Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";

import type { SemanaUnidad } from "../../types/complete-syllabus";
import { cleanPdfText } from "./format-pdf-value";
import { isEventWeek } from "./syllabus-format-helpers";

type ProgramLinesProps = Readonly<{
  content?: string | null;
  programTextStyle: Style | Style[];
}>;

type ProgramCellProps = Readonly<{
  content?: string | null;
  isEvent?: boolean;
  cellStyle: Style | Style[];
  programTextStyle: Style | Style[];
}>;

type ProgramHourCellProps = Readonly<{
  value: string | number;
  cellStyle: Style | Style[];
  hourTextStyle: Style | Style[];
}>;

type ProgramActivityCellProps = Readonly<{
  semana: SemanaUnidad;
  isEvent?: boolean;
  cellStyle: Style | Style[];
  programTextStyle: Style | Style[];
}>;

const buildProgramLineKey = (line: string, occurrence: number) =>
  `program-line-${line || "empty"}-${occurrence}`;

const getProgramLines = (text: string) => {
  const occurrences = new Map<string, number>();

  return text.split("\n").map((line) => {
    const currentOccurrence = occurrences.get(line) ?? 0;
    occurrences.set(line, currentOccurrence + 1);

    return {
      key: buildProgramLineKey(line, currentOccurrence),
      text: line,
    };
  });
};

export function ProgramLines({ content, programTextStyle }: ProgramLinesProps) {
  const text = cleanPdfText(content);

  if (!text) {
    return <Text style={programTextStyle}>-</Text>;
  }

  return (
    <>
      {getProgramLines(text).map((line) => (
        <Text key={line.key} style={programTextStyle}>
          {line.text}
        </Text>
      ))}
    </>
  );
}

export function ProgramContentCell({
  content,
  isEvent = false,
  cellStyle,
  programTextStyle,
}: ProgramCellProps) {
  const text = cleanPdfText(content);
  const eventText = text.replace("[EVENTO]", "").trim();
  const shouldRenderEvent = isEvent || text.startsWith("[EVENTO]");

  return (
    <View style={cellStyle}>
      {shouldRenderEvent ? (
        <Text style={programTextStyle}>{eventText || "-"}</Text>
      ) : (
        <ProgramLines content={content} programTextStyle={programTextStyle} />
      )}
    </View>
  );
}

export function ProgramHourCell({
  value,
  cellStyle,
  hourTextStyle,
}: ProgramHourCellProps) {
  return (
    <View style={cellStyle}>
      <Text style={hourTextStyle}>{value}</Text>
    </View>
  );
}

export function ProgramActivityCell({
  semana,
  isEvent,
  cellStyle,
  programTextStyle,
}: ProgramActivityCellProps) {
  const shouldRenderEvent = isEvent ?? isEventWeek(semana);

  if (shouldRenderEvent) {
    const activityText = cleanPdfText(semana.actividadesAprendizaje)
      .replace("[EVENTO]", "")
      .trim();

    return (
      <View style={cellStyle}>
        <Text style={programTextStyle}>{activityText || "-"}</Text>
      </View>
    );
  }

  return (
    <View style={cellStyle}>
      <ProgramLines
        content={semana.actividadesAprendizaje}
        programTextStyle={programTextStyle}
      />
    </View>
  );
}
