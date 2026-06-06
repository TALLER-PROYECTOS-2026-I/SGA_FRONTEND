import type {
  CurriculumCourse,
  CurriculumMesh,
} from "../hooks/curriculum-query";

type PrintableCourse = CurriculumCourse & {
  row: number;
  color: string;
  areaLabel: string;
};

type Connection = {
  from: string;
  to: string;
};

const CYCLE_WIDTH = 118;
const CYCLE_GAP = 12;
const HEADER_HEIGHT = 22;
const COURSE_WIDTH = 106;
const COURSE_HEIGHT = 58;
const COURSE_GAP_Y = 10;
const BOARD_PADDING_X = 18;
const BOARD_PADDING_Y = 42;

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function getAreaInfo(course: CurriculumCourse) {
  const text = normalizeText(
    `${course.areaCurricular ?? ""} ${course.tipoCurso ?? ""} ${course.nombre ?? ""}`,
  );

  if (
    text.includes("MATEM") ||
    text.includes("CALCULO") ||
    text.includes("ALGEBRA") ||
    text.includes("FISICA") ||
    text.includes("ESTADIST")
  ) {
    return {
      label: "Matemática y Ciencias",
      color: "#f97316",
      className: "area-math",
    };
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
    return {
      label: "Estudios Generales",
      color: "#a855f7",
      className: "area-general",
    };
  }

  if (
    text.includes("TECNOLOGIAS DE INFORMACION") ||
    text.includes("TECNOLOGIA") ||
    text.includes("CIBERSEGURIDAD") ||
    text.includes("SEGURIDAD") ||
    text.includes("REDES")
  ) {
    return {
      label: "Tecnologías de Información",
      color: "#60a5fa",
      className: "area-it",
    };
  }

  if (
    text.includes("SOFTWARE") ||
    text.includes("PROGRAMACION") ||
    text.includes("TALLER") ||
    text.includes("PRUEBAS") ||
    text.includes("CALIDAD")
  ) {
    return {
      label: "Ingeniería de Software",
      color: "#2563eb",
      className: "area-software",
    };
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
    return {
      label: "Sistemas de Información",
      color: "#2563eb",
      className: "area-systems",
    };
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
    return {
      label: "Gestión de la Computación",
      color: "#65a30d",
      className: "area-management",
    };
  }

  if (
    text.includes("INVEST") ||
    text.includes("TESIS") ||
    text.includes("TRABAJO DE INVESTIGACION") ||
    text.includes("PROYECTO FINAL")
  ) {
    return {
      label: "Investigación",
      color: "#93c5fd",
      className: "area-research",
    };
  }

  if (text.includes("ELECTIVO") || text.includes("ELECTIVA")) {
    return {
      label: "Electivos",
      color: "#ffffff",
      className: "area-elective",
    };
  }

  return {
    label: "Formación Profesional",
    color: "#92400e",
    className: "area-professional",
  };
}

function getCourseKey(course: CurriculumCourse) {
  return normalizeText(course.codigo || course.nombre);
}

function getNodeId(course: CurriculumCourse) {
  return `course-${course.id}`;
}

function formatCourseName(name: string) {
  const cleanName = name.trim();

  if (cleanName.length <= 28) {
    return escapeHtml(cleanName);
  }

  return `${escapeHtml(cleanName.slice(0, 28).trim())}...`;
}

function formatCycleRoman(cycle: number) {
  const romans: Record<number, string> = {
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

  return romans[cycle] ?? String(cycle);
}

function layoutCourses(courses: CurriculumCourse[]) {
  return courses.map((course, index): PrintableCourse => {
    const area = getAreaInfo(course);

    return {
      ...course,
      row: index,
      color: area.color,
      areaLabel: area.label,
    };
  });
}

function buildCourseLookup(
  cycles: PrintableCourse[][],
  electivos: PrintableCourse[],
) {
  const lookup = new Map<string, PrintableCourse>();

  for (const cycleCourses of cycles) {
    for (const course of cycleCourses) {
      lookup.set(getCourseKey(course), course);
      lookup.set(normalizeText(course.nombre), course);
    }
  }

  for (const course of electivos) {
    lookup.set(getCourseKey(course), course);
    lookup.set(normalizeText(course.nombre), course);
  }

  return lookup;
}

function shouldIgnorePrerequisite(value: string) {
  const text = normalizeText(value);

  return (
    text.includes("CREDITOS APROBADOS") ||
    text.includes("CREDITO APROBADO") ||
    text.includes("CREDITOS") ||
    text.length === 0
  );
}

function buildConnections(
  courses: PrintableCourse[],
  lookup: Map<string, PrintableCourse>,
) {
  const connections: Connection[] = [];

  for (const course of courses) {
    for (const prerequisite of course.prerrequisitos ?? []) {
      if (shouldIgnorePrerequisite(prerequisite)) {
        continue;
      }

      const source = lookup.get(normalizeText(prerequisite));

      if (!source) {
        continue;
      }

      connections.push({
        from: getNodeId(source),
        to: getNodeId(course),
      });
    }
  }

  return connections;
}

function getCoursePosition(course: PrintableCourse) {
  const ciclo = course.ciclo && course.ciclo > 0 ? course.ciclo : 1;
  const colIndex = Math.max(0, ciclo - 1);

  const x =
    BOARD_PADDING_X +
    colIndex * (CYCLE_WIDTH + CYCLE_GAP) +
    (CYCLE_WIDTH - COURSE_WIDTH) / 2;

  const y =
    BOARD_PADDING_Y +
    HEADER_HEIGHT +
    10 +
    course.row * (COURSE_HEIGHT + COURSE_GAP_Y);

  return { x, y };
}

function buildSvgConnections(
  connections: Connection[],
  allCourses: PrintableCourse[],
) {
  const coursesByNodeId = new Map<string, PrintableCourse>();

  for (const course of allCourses) {
    coursesByNodeId.set(getNodeId(course), course);
  }

  return connections
    .map((connection, index) => {
      const from = coursesByNodeId.get(connection.from);
      const to = coursesByNodeId.get(connection.to);

      if (!from || !to || !from.ciclo || !to.ciclo) {
        return "";
      }

      const fromPosition = getCoursePosition(from);
      const toPosition = getCoursePosition(to);

      const startX = fromPosition.x + COURSE_WIDTH;
      const startY = fromPosition.y + COURSE_HEIGHT / 2;
      const endX = toPosition.x;
      const endY = toPosition.y + COURSE_HEIGHT / 2;
      const midX = startX + Math.max(16, (endX - startX) / 2);

      const color = index % 2 === 0 ? "#2563eb" : "#ea580c";
      const dash = index % 3 === 0 ? "4 3" : "0";

      return `
        <path
          d="M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}"
          fill="none"
          stroke="${color}"
          stroke-width="1.2"
          stroke-dasharray="${dash}"
          marker-end="url(#arrow-${index % 2})"
          opacity="0.78"
        />
      `;
    })
    .join("");
}

function buildCycleColumn(cycleNumber: number, courses: PrintableCourse[]) {
  const left = BOARD_PADDING_X + (cycleNumber - 1) * (CYCLE_WIDTH + CYCLE_GAP);

  const courseBlocks = courses
    .map((course) => {
      const { x, y } = getCoursePosition(course);
      const area = getAreaInfo(course);

      return `
        <div
          id="${getNodeId(course)}"
          class="course-card ${area.className}"
          title="${escapeHtml(course.nombre)}"
          style="
            left: ${x}px;
            top: ${y}px;
            width: ${COURSE_WIDTH}px;
            height: ${COURSE_HEIGHT}px;
            background: ${course.color};
          "
        >
          <div class="course-title">${formatCourseName(course.nombre)}</div>
          <div class="course-code">${escapeHtml(course.codigo)}</div>
          <div class="course-credits">${escapeHtml(course.creditos)}</div>
        </div>
      `;
    })
    .join("");

  return `
    <div
      class="cycle-header"
      style="left: ${left}px; width: ${CYCLE_WIDTH}px;"
    >
      CICLO ${formatCycleRoman(cycleNumber)}
    </div>
    ${courseBlocks}
  `;
}

function buildElectiveBlock(electivos: PrintableCourse[], boardHeight: number) {
  if (electivos.length === 0) {
    return "";
  }

  const visibleElectives = electivos.slice(0, 18);
  const hiddenCount = Math.max(0, electivos.length - visibleElectives.length);
  const top = boardHeight + 10;

  const cards = visibleElectives
    .map(
      (course, index) => `
        <div class="elective-mini-card" style="
          left: ${(index % 9) * 126}px;
          top: ${Math.floor(index / 9) * 42}px;
        ">
          <div class="course-title">${formatCourseName(course.nombre)}</div>
          <div class="course-code">${escapeHtml(course.codigo)}</div>
          <div class="course-credits">${escapeHtml(course.creditos)}</div>
        </div>
      `,
    )
    .join("");

  return `
    <div class="elective-section" style="top: ${top}px;">
      <div class="elective-title">ELECTIVOS</div>
      <div class="elective-wrapper">
        ${cards}
        ${
          hiddenCount > 0
            ? `<div class="elective-more">+ ${hiddenCount} electivos adicionales</div>`
            : ""
        }
      </div>
    </div>
  `;
}

function buildLegend() {
  const items = [
    { label: "Matemática y Ciencias", color: "#f97316" },
    { label: "Estudios Generales", color: "#a855f7" },
    { label: "Sistemas de Información", color: "#2563eb" },
    { label: "Ingeniería de Software", color: "#2563eb" },
    { label: "Tecnologías de Información", color: "#60a5fa" },
    { label: "Gestión de la Computación", color: "#65a30d" },
    { label: "Investigación", color: "#93c5fd" },
    { label: "Formación Profesional", color: "#92400e" },
  ];

  return `
    <div class="legend">
      ${items
        .map(
          (item) => `
            <div class="legend-item">
              <span style="background: ${item.color};"></span>
              ${escapeHtml(item.label)}
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

export function buildCurriculumPrintableHtml(
  mesh: CurriculumMesh,
  selectedPeriod: string,
) {
  const cycleCourses = mesh.ciclos.map((cycle) => layoutCourses(cycle.cursos));
  const electivos = layoutCourses(mesh.electivos);

  const allCycleCourses = cycleCourses.flat();
  const allCourses = [...allCycleCourses, ...electivos];

  const maxRows = Math.max(6, ...cycleCourses.map((courses) => courses.length));
  const boardWidth = BOARD_PADDING_X * 2 + 10 * CYCLE_WIDTH + 9 * CYCLE_GAP;

  const boardHeight =
    BOARD_PADDING_Y +
    HEADER_HEIGHT +
    14 +
    maxRows * (COURSE_HEIGHT + COURSE_GAP_Y);

  const electiveRows = Math.ceil(Math.min(electivos.length, 18) / 9);
  const electiveHeight = electivos.length > 0 ? 38 + electiveRows * 42 : 0;
  const wrapperHeight = boardHeight + electiveHeight + 56;

  const lookup = buildCourseLookup(cycleCourses, electivos);
  const connections = buildConnections(allCycleCourses, lookup);
  const svgConnections = buildSvgConnections(connections, allCycleCourses);

  const cycleColumns = Array.from({ length: 10 }, (_, index) =>
    buildCycleColumn(index + 1, cycleCourses[index] ?? []),
  ).join("");

  const electiveBlock = buildElectiveBlock(electivos, boardHeight);
  const legend = buildLegend();

  const totalCredits = allCourses.reduce(
    (total, course) => total + Number(course.creditos || 0),
    0,
  );

  return `
    <!doctype html>
    <html>
      <head>
        <title>Malla Curricular ${escapeHtml(selectedPeriod)}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 6mm;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            min-height: 100%;
            font-family: Arial, Helvetica, sans-serif;
            color: #111827;
            background: #ffffff;
          }

          .toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 10px 14px;
            border-bottom: 1px solid #e5e7eb;
            background: #ffffff;
          }

          .toolbar h1 {
            margin: 0;
            font-size: 18px;
            font-weight: 900;
          }

          .toolbar p {
            margin: 2px 0 0;
            font-size: 11px;
            color: #6b7280;
          }

          .toolbar button {
            border: none;
            background: #dc2626;
            color: #ffffff;
            font-weight: 900;
            padding: 8px 14px;
            border-radius: 10px;
            cursor: pointer;
          }

          .paper {
            padding: 8px 10px 14px;
            overflow-x: auto;
          }

          .board-title {
            text-align: center;
            font-size: 12px;
            font-weight: 900;
            margin: 4px 0 4px;
          }

          .board-subtitle {
            display: flex;
            justify-content: center;
            gap: 18px;
            font-size: 8px;
            color: #374151;
            margin-bottom: 7px;
          }

          .board-wrapper {
            width: ${boardWidth}px;
            height: ${wrapperHeight}px;
            position: relative;
            margin: 0 auto;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            overflow: hidden;
          }

          .cycle-header {
            position: absolute;
            top: 16px;
            height: 12px;
            background: #d1d5db;
            color: #111827;
            font-size: 6.5px;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .course-card {
            position: absolute;
            border: 1.25px solid #111827;
            box-shadow: inset -9px 0 rgba(0, 0, 0, 0.16);
            padding: 4px 17px 4px 5px;
            font-size: 6.5px;
            overflow: hidden;
          }

          .course-title {
            font-weight: 900;
            line-height: 1.05;
            color: #111827;
          }

          .course-code {
            position: absolute;
            left: 5px;
            bottom: 3px;
            font-size: 5.8px;
            color: #111827;
            opacity: 0.9;
          }

          .course-credits {
            position: absolute;
            right: 4px;
            top: 4px;
            font-size: 7.4px;
            font-weight: 900;
            color: #111827;
          }

          .area-elective {
            background: #ffffff !important;
          }

          .connections {
            position: absolute;
            left: 0;
            top: 0;
            width: ${boardWidth}px;
            height: ${boardHeight}px;
            pointer-events: none;
            z-index: 1;
          }

          .course-card {
            z-index: 2;
          }

          .elective-section {
            position: absolute;
            left: ${BOARD_PADDING_X}px;
            right: ${BOARD_PADDING_X}px;
            min-height: ${electiveHeight}px;
          }

          .elective-title {
            font-size: 8px;
            color: #7e22ce;
            font-weight: 900;
            margin-bottom: 5px;
          }

          .elective-wrapper {
            position: relative;
            height: ${Math.max(46, electiveRows * 42)}px;
          }

          .elective-mini-card {
            position: absolute;
            width: 114px;
            height: 36px;
            border: 1.15px solid #111827;
            background: #ffffff;
            padding: 4px 16px 4px 5px;
            font-size: 6.3px;
            overflow: hidden;
          }

          .elective-more {
            position: absolute;
            right: 0;
            bottom: 0;
            border: 1px dashed #94a3b8;
            border-radius: 8px;
            padding: 6px 10px;
            color: #475569;
            font-size: 8px;
            font-weight: 900;
            background: #f8fafc;
          }

          .legend {
            display: grid;
            grid-template-columns: repeat(4, max-content);
            gap: 4px 14px;
            justify-content: center;
            margin-top: 7px;
            font-size: 7.5px;
            font-weight: 700;
          }

          .legend-item {
            display: flex;
            align-items: center;
            gap: 5px;
          }

          .legend-item span {
            display: inline-block;
            width: 30px;
            height: 7px;
            border: 1px solid #111827;
          }

          @media screen {
            .board-wrapper {
              transform: scale(1.18);
              transform-origin: top center;
              margin-bottom: ${Math.round(wrapperHeight * 0.18)}px;
            }
          }

          @media print {
            .toolbar {
              display: none;
            }

            .paper {
              padding: 0;
              overflow: hidden;
            }

            .board-title {
              margin-top: 0;
            }

            .board-wrapper {
              transform: scale(0.93);
              transform-origin: top center;
              margin-top: 0;
            }

            .legend {
              margin-top: -${Math.round(wrapperHeight * 0.07)}px;
            }
          }
        </style>
      </head>

      <body>
        <div class="toolbar">
          <div>
            <h1>Malla Curricular - ${escapeHtml(selectedPeriod)}</h1>
            <p>Vista oficial para impresión horizontal.</p>
          </div>

          <button onclick="window.print()">Imprimir</button>
        </div>

        <main class="paper">
          <div class="board-title">
            Malla Curricular del Programa de Ingeniería de Computación y Sistemas ${escapeHtml(
              selectedPeriod,
            )}
          </div>

          <div class="board-subtitle">
            <span>Total de cursos: ${escapeHtml(allCourses.length)}</span>
            <span>Total de créditos: ${escapeHtml(totalCredits)}</span>
            <span>Periodo: ${escapeHtml(selectedPeriod)}</span>
          </div>

          <div class="board-wrapper">
            <svg class="connections" viewBox="0 0 ${boardWidth} ${boardHeight}">
              <defs>
                <marker
                  id="arrow-0"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L0,6 L7,3 z" fill="#2563eb" />
                </marker>

                <marker
                  id="arrow-1"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L0,6 L7,3 z" fill="#ea580c" />
                </marker>
              </defs>

              ${svgConnections}
            </svg>

            ${cycleColumns}
            ${electiveBlock}
          </div>

          ${legend}
        </main>
      </body>
    </html>
  `;
}
