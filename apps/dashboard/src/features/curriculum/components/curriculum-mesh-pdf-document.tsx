import {
  Document,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import type {
  CurriculumCourse,
  CurriculumMesh,
} from "../hooks/curriculum-query";

type CurriculumMeshPdfDocumentProps = {
  mesh: CurriculumMesh;
  selectedPeriod: string;
};

type PrintableCourse = CurriculumCourse & {
  row: number;
  color: string;
};

type Connection = {
  from: PrintableCourse;
  to: PrintableCourse;
};

const COLORS = {
  math: "#f97316",
  general: "#a855f7",
  systems: "#2563eb",
  software: "#1d4ed8",
  it: "#60a5fa",
  management: "#65a30d",
  research: "#93c5fd",
  professional: "#92400e",
  elective: "#ffffff",
};

const BOARD_WIDTH = 806;
const COLUMN_WIDTH = 75;
const COLUMN_GAP = 5;
const HEADER_HEIGHT = 13;
const CARD_HEIGHT = 43;
const CARD_GAP = 4;
const CARD_TOP = 27;
const CARD_LEFT_PADDING = 4;

function normalizeText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function shouldIgnorePrerequisite(value: string) {
  const text = normalizeText(value);

  return (
    text.length === 0 || text.includes("CREDITOS") || text.includes("CRÉDITOS")
  );
}

function getAreaColor(course: CurriculumCourse) {
  const text = normalizeText(
    `${course.areaCurricular ?? ""} ${course.tipoCurso ?? ""} ${course.nombre}`,
  );

  if (
    text.includes("MATEM") ||
    text.includes("CALCULO") ||
    text.includes("ALGEBRA") ||
    text.includes("FISICA") ||
    text.includes("ESTADIST")
  ) {
    return COLORS.math;
  }

  if (
    text.includes("ESTUDIOS GENERALES") ||
    text.includes("FILOSOFIA") ||
    text.includes("LENGUAJE") ||
    text.includes("INGLES") ||
    text.includes("ACTIVIDADES") ||
    text.includes("CIUDADANIA") ||
    text.includes("METODOS") ||
    text.includes("ETICA") ||
    text.includes("DISCAPACIDAD") ||
    text.includes("LIDERAZGO")
  ) {
    return COLORS.general;
  }

  if (
    text.includes("TECNOLOGIAS DE INFORMACION") ||
    text.includes("TECNOLOGIA") ||
    text.includes("CIBERSEGURIDAD") ||
    text.includes("SEGURIDAD") ||
    text.includes("REDES")
  ) {
    return COLORS.it;
  }

  if (
    text.includes("SOFTWARE") ||
    text.includes("PROGRAMACION") ||
    text.includes("TALLER") ||
    text.includes("PRUEBAS") ||
    text.includes("CALIDAD")
  ) {
    return COLORS.software;
  }

  if (
    text.includes("SISTEMAS DE INFORMACION") ||
    text.includes("SISTEMAS") ||
    text.includes("BASE DE DATOS") ||
    text.includes("ARQUITECTURA") ||
    text.includes("INTELIGENCIA") ||
    text.includes("DATA") ||
    text.includes("ERP")
  ) {
    return COLORS.systems;
  }

  if (
    text.includes("GESTION") ||
    text.includes("PROCESOS") ||
    text.includes("PROYECTO") ||
    text.includes("AUDITOR") ||
    text.includes("FINANCI") ||
    text.includes("MARKETING") ||
    text.includes("ECONOMIA") ||
    text.includes("CONTABILIDAD") ||
    text.includes("ADMINISTRATIVA")
  ) {
    return COLORS.management;
  }

  if (
    text.includes("INVEST") ||
    text.includes("TESIS") ||
    text.includes("TRABAJO DE INVESTIGACION") ||
    text.includes("PROYECTO FINAL")
  ) {
    return COLORS.research;
  }

  if (text.includes("ELECTIVO") || text.includes("ELECTIVA")) {
    return COLORS.elective;
  }

  return COLORS.professional;
}

function truncate(value: string, maxLength = 38) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}

function roman(cycle: number) {
  const values: Record<number, string> = {
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

  return values[cycle] ?? String(cycle);
}

function getCourseKeys(course: CurriculumCourse) {
  return [course.codigo, course.nombre].map(normalizeText).filter(Boolean);
}

function buildPrintableCycles(mesh: CurriculumMesh) {
  return mesh.ciclos.map((cycle) => ({
    ...cycle,
    cursos: cycle.cursos.map((course, index): PrintableCourse => {
      return {
        ...course,
        row: index,
        color: getAreaColor(course),
      };
    }),
  }));
}

function buildLookup(courses: PrintableCourse[]) {
  const lookup = new Map<string, PrintableCourse>();

  for (const course of courses) {
    for (const key of getCourseKeys(course)) {
      lookup.set(key, course);
    }
  }

  return lookup;
}

function buildConnections(courses: PrintableCourse[]) {
  const lookup = buildLookup(courses);
  const connections: Connection[] = [];

  for (const course of courses) {
    for (const prerequisite of course.prerrequisitos) {
      if (shouldIgnorePrerequisite(prerequisite)) continue;

      const source = lookup.get(normalizeText(prerequisite));

      if (
        source &&
        source.ciclo &&
        course.ciclo &&
        source.ciclo < course.ciclo
      ) {
        connections.push({
          from: source,
          to: course,
        });
      }
    }
  }

  return connections;
}

function getCoursePosition(course: PrintableCourse) {
  const cycleIndex = Math.max(0, (course.ciclo ?? 1) - 1);

  return {
    x: cycleIndex * (COLUMN_WIDTH + COLUMN_GAP) + CARD_LEFT_PADDING,
    y: CARD_TOP + course.row * (CARD_HEIGHT + CARD_GAP),
  };
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function PdfHeader({
  title,
  selectedPeriod,
}: {
  title: string;
  selectedPeriod: string;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Periodo académico: {selectedPeriod}</Text>
    </View>
  );
}

function CourseListCard({ course }: { course: CurriculumCourse }) {
  return (
    <View style={styles.listCourseCard}>
      <View style={styles.listCourseTop}>
        <Text style={styles.listCourseCode}>{course.codigo}</Text>
        <Text style={styles.listCourseCredits}>{course.creditos} cr.</Text>
      </View>

      <Text style={styles.listCourseName}>{course.nombre}</Text>

      <Text style={styles.listCourseMeta}>
        {course.modalidad}
        {course.tipoCurso ? ` · ${course.tipoCurso}` : ""}
      </Text>

      {course.areaCurricular && (
        <Text style={styles.listCourseArea}>Área: {course.areaCurricular}</Text>
      )}

      {course.prerrequisitos.length > 0 && (
        <Text style={styles.listCourseReq}>
          Req: {course.prerrequisitos.join(", ")}
        </Text>
      )}
    </View>
  );
}

function CycleListBlock({
  cycle,
}: {
  cycle: {
    ciclo: number;
    nombre: string;
    cursos: CurriculumCourse[];
  };
}) {
  return (
    <View style={styles.cycleListBlock}>
      <View style={styles.cycleListHeader}>
        <Text style={styles.cycleListTitle}>{cycle.nombre}</Text>
        <Text style={styles.cycleListCount}>{cycle.cursos.length} cursos</Text>
      </View>

      <View style={styles.listCourseGrid}>
        {cycle.cursos.map((course) => (
          <CourseListCard key={course.id} course={course} />
        ))}
      </View>
    </View>
  );
}

function CurriculumCyclesPage({
  cycles,
  selectedPeriod,
  pageIndex,
  totalPages,
}: {
  cycles: Array<{
    ciclo: number;
    nombre: string;
    cursos: CurriculumCourse[];
  }>;
  selectedPeriod: string;
  pageIndex: number;
  totalPages: number;
}) {
  return (
    <Page size="A4" orientation="landscape" style={styles.page} wrap={false}>
      <PdfHeader
        title="Plan de estudios por ciclos"
        selectedPeriod={selectedPeriod}
      />

      <Text style={styles.pageHint}>
        Cursos organizados por ciclo académico. Página {pageIndex + 1} de{" "}
        {totalPages}.
      </Text>

      <View style={styles.cyclesListPageGrid}>
        {cycles.map((cycle) => (
          <CycleListBlock key={cycle.ciclo} cycle={cycle} />
        ))}
      </View>
    </Page>
  );
}

function ElectivesPage({
  electivos,
  selectedPeriod,
  pageIndex,
  totalPages,
}: {
  electivos: CurriculumCourse[];
  selectedPeriod: string;
  pageIndex: number;
  totalPages: number;
}) {
  return (
    <Page size="A4" orientation="landscape" style={styles.page} wrap={false}>
      <PdfHeader
        title="Electivas de Especialidad y Electivas Libres"
        selectedPeriod={selectedPeriod}
      />

      <Text style={styles.pageHint}>
        Relación de cursos electivos. Página {pageIndex + 1} de {totalPages}.
      </Text>

      <View style={styles.electiveGrid}>
        {electivos.map((course) => (
          <CourseListCard key={course.id} course={course} />
        ))}
      </View>
    </Page>
  );
}

function ConnectionsLayer({ courses }: { courses: PrintableCourse[] }) {
  const connections = buildConnections(courses);

  return (
    <Svg style={styles.connectionsLayer} viewBox={`0 0 ${BOARD_WIDTH} 465`}>
      {connections.map((connection, index) => {
        const from = getCoursePosition(connection.from);
        const to = getCoursePosition(connection.to);

        const startX = from.x + COLUMN_WIDTH - 8;
        const startY = from.y + CARD_HEIGHT / 2;
        const endX = to.x;
        const endY = to.y + CARD_HEIGHT / 2;
        const midX = startX + Math.max(10, (endX - startX) / 2);

        const color = index % 2 === 0 ? "#2563eb" : "#ea580c";

        return (
          <Path
            key={`${connection.from.id}-${connection.to.id}-${index}`}
            d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
            stroke={color}
            strokeWidth={0.8}
            fill="none"
            opacity={0.65}
          />
        );
      })}
    </Svg>
  );
}

function CourseBox({ course }: { course: PrintableCourse }) {
  return (
    <View
      style={[
        styles.courseBox,
        {
          backgroundColor: course.color,
          borderColor: "#111827",
        },
      ]}
    >
      <Text style={styles.courseName}>{truncate(course.nombre, 30)}</Text>

      <Text style={styles.courseCode}>{course.codigo}</Text>

      <Text style={styles.courseCredits}>{course.creditos}</Text>
    </View>
  );
}

function CycleColumn({
  cycle,
}: {
  cycle: {
    ciclo: number;
    nombre: string;
    cursos: PrintableCourse[];
  };
}) {
  return (
    <View style={styles.cycleColumn}>
      <View style={styles.cycleHeader}>
        <Text style={styles.cycleHeaderText}>CICLO {roman(cycle.ciclo)}</Text>
      </View>

      <View style={styles.courseList}>
        {cycle.cursos.map((course) => (
          <CourseBox key={course.id} course={course} />
        ))}
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendColor, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function Legend() {
  return (
    <View style={styles.legend}>
      <LegendItem color={COLORS.math} label="Matemática y Ciencias" />
      <LegendItem color={COLORS.general} label="Estudios Generales" />
      <LegendItem color={COLORS.systems} label="Sistemas de Información" />
      <LegendItem color={COLORS.software} label="Ingeniería de Software" />
      <LegendItem color={COLORS.it} label="Tecnologías de Información" />
      <LegendItem color={COLORS.management} label="Gestión de la Computación" />
      <LegendItem color={COLORS.research} label="Investigación" />
      <LegendItem color={COLORS.professional} label="Formación Profesional" />
    </View>
  );
}

function BoardPage({
  cycles,
  mesh,
  selectedPeriod,
}: {
  cycles: ReturnType<typeof buildPrintableCycles>;
  mesh: CurriculumMesh;
  selectedPeriod: string;
}) {
  const allCycleCourses = cycles.flatMap((cycle) => cycle.cursos);
  const totalCourses = allCycleCourses.length + mesh.electivos.length;
  const totalCredits = [...allCycleCourses, ...mesh.electivos].reduce(
    (total, course) => total + Number(course.creditos || 0),
    0,
  );

  return (
    <Page size="A4" orientation="landscape" style={styles.page} wrap={false}>
      <View style={styles.boardHeader}>
        <Text style={styles.boardTitle}>
          Cuadro de Malla Curricular del Programa de Ingeniería de Computación y
          Sistemas {selectedPeriod}
        </Text>

        <View style={styles.stats}>
          <Text style={styles.stat}>Total de cursos: {totalCourses}</Text>
          <Text style={styles.stat}>Total de créditos: {totalCredits}</Text>
          <Text style={styles.stat}>Periodo: {selectedPeriod}</Text>
        </View>
      </View>

      <View style={styles.board}>
        <ConnectionsLayer courses={allCycleCourses} />

        <View style={styles.cyclesRow}>
          {cycles.map((cycle) => (
            <CycleColumn key={cycle.ciclo} cycle={cycle} />
          ))}
        </View>
      </View>

      <Legend />
    </Page>
  );
}

export function CurriculumMeshPdfDocument({
  mesh,
  selectedPeriod,
}: CurriculumMeshPdfDocumentProps) {
  const cycles = buildPrintableCycles(mesh);
  const cyclePages = chunkArray(mesh.ciclos, 2);
  const electivePages = chunkArray(mesh.electivos, 12);
  const totalCyclePages = cyclePages.length;

  return (
    <Document>
      {cyclePages.map((cyclesChunk, index) => (
        <CurriculumCyclesPage
          key={`cycle-page-${index}`}
          cycles={cyclesChunk}
          selectedPeriod={selectedPeriod}
          pageIndex={index}
          totalPages={totalCyclePages}
        />
      ))}

      {electivePages.map((electivesChunk, index) => (
        <ElectivesPage
          key={`elective-page-${index}`}
          electivos={electivesChunk}
          selectedPeriod={selectedPeriod}
          pageIndex={index}
          totalPages={electivePages.length}
        />
      ))}

      <BoardPage cycles={cycles} mesh={mesh} selectedPeriod={selectedPeriod} />
    </Document>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 6,
    alignItems: "center",
  },
  title: {
    fontSize: 13,
    fontWeight: 700,
    textAlign: "center",
    color: "#111827",
  },
  subtitle: {
    marginTop: 3,
    fontSize: 8,
    color: "#4b5563",
  },
  pageHint: {
    marginBottom: 8,
    fontSize: 7,
    color: "#6b7280",
    textAlign: "center",
  },
  cyclesListPageGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cycleListBlock: {
    width: "49%",
    height: 475,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 7,
  },
  cycleListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  cycleListTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#dc2626",
  },
  cycleListCount: {
    fontSize: 7,
    fontWeight: 700,
    color: "#111827",
  },
  listCourseGrid: {
    flexDirection: "column",
  },
  listCourseCard: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 5,
    padding: 5,
    marginBottom: 4,
    minHeight: 38,
  },
  listCourseTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  listCourseCode: {
    fontSize: 6,
    fontWeight: 700,
    color: "#475569",
  },
  listCourseCredits: {
    fontSize: 6,
    fontWeight: 700,
    color: "#dc2626",
  },
  listCourseName: {
    fontSize: 7.5,
    fontWeight: 700,
    color: "#111827",
    textTransform: "uppercase",
  },
  listCourseMeta: {
    marginTop: 3,
    fontSize: 6,
    color: "#2563eb",
    fontWeight: 700,
  },
  listCourseArea: {
    marginTop: 2,
    fontSize: 5.8,
    color: "#4b5563",
  },
  listCourseReq: {
    marginTop: 2,
    fontSize: 5.6,
    color: "#6b7280",
    lineHeight: 1.15,
  },
  electiveGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  boardHeader: {
    marginBottom: 6,
    alignItems: "center",
  },
  boardTitle: {
    fontSize: 10,
    fontWeight: 700,
    textAlign: "center",
    color: "#111827",
  },
  stats: {
    marginTop: 4,
    flexDirection: "row",
  },
  stat: {
    marginHorizontal: 7,
    fontSize: 6.5,
    color: "#374151",
  },
  board: {
    position: "relative",
    width: BOARD_WIDTH,
    height: 478,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignSelf: "center",
    paddingTop: 16,
    paddingHorizontal: 5,
  },
  connectionsLayer: {
    position: "absolute",
    left: 0,
    top: 0,
    width: BOARD_WIDTH,
    height: 465,
  },
  cyclesRow: {
    flexDirection: "row",
  },
  cycleColumn: {
    width: COLUMN_WIDTH,
    marginRight: COLUMN_GAP,
  },
  cycleHeader: {
    height: HEADER_HEIGHT,
    backgroundColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  cycleHeaderText: {
    fontSize: 5.5,
    fontWeight: 700,
    color: "#111827",
  },
  courseList: {
    flexDirection: "column",
  },
  courseBox: {
    position: "relative",
    height: CARD_HEIGHT,
    borderWidth: 1,
    paddingTop: 4,
    paddingRight: 12,
    paddingBottom: 4,
    paddingLeft: 4,
    marginBottom: CARD_GAP,
  },
  courseName: {
    fontSize: 5.4,
    lineHeight: 1.08,
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#111827",
  },
  courseCode: {
    position: "absolute",
    left: 4,
    bottom: 3,
    fontSize: 4.8,
    color: "#111827",
  },
  courseCredits: {
    position: "absolute",
    right: 3,
    top: 3,
    fontSize: 6,
    fontWeight: 700,
    color: "#111827",
  },
  legend: {
    marginTop: 7,
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 4,
    marginBottom: 3,
  },
  legendColor: {
    width: 18,
    height: 5,
    borderWidth: 0.5,
    borderColor: "#111827",
    marginRight: 3,
  },
  legendText: {
    fontSize: 5.8,
    color: "#111827",
  },
});
