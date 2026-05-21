import type { CompleteSyllabus } from "../types/complete-syllabus";

/**
 * Mock de datos completos de un sílabo para testing
 * Basado en el sílabo de "Taller de Proyectos 2025-II" - PDF actualizado
 */
export const mockSyllabusData: CompleteSyllabus = {
  datosGenerales: {
    nombreAsignatura: "Taller de Proyectos",
    codigoAsignatura: "09112108051",
    departamentoAcademico: "Ingeniería y Arquitectura",
    escuelaProfesional: "Ingeniería de Computación y Sistemas",
    programaAcademico: "Ingeniería de Computación y Sistemas",
    semestreAcademico: "2025-II",
    tipoAsignatura: "Obligatoria",
    tipoEstudios: "Especialidad",
    modalidad: "A distancia",
    ciclo: "VIII",
    requisitos:
      "09013707052 – Ingeniería de Software II, 09140707041 – Inteligencia Artificial",
    creditosTeoria: 0,
    creditosPractica: 5,
    creditosTotales: 5,
    horasTeoria: 0,
    horasPractica: 10,
    horasTotales: 10,
    docentes: "Mg. León Lescano, Norma Birginia",
    areaCurricular: "INGENIERÍA DE SOFTWARE",
  },

  sumilla:
    "Es de carácter aplicativo; permitirá al estudiante desarrollar su capacidad para resolver una situación problemática real a través del desarrollo de un proyecto altamente innovador, aplicar las competencias de iniciativa, investigación, creatividad, para el diseño de la solución; responsabilidad, compromiso y autogestión del equipo para gestionar con éxito el proyecto; autoexigencia para dar respuesta a los parámetros de calidad y mejora de la solución; comunicación y reflexión para difundir los resultados del proyecto. El profesor asume diferentes roles en el desarrollo del curso, sin embargo, mantiene el rol de guía y observador de los estudiantes en la aplicación de conceptos y su involucramiento creativo. Unidades: Unidad: I. Diseño de soluciones innovadoras. Unidad: II: Gestión de proyectos y aplicaciones modernas. Unidad III: Integración y entrega continua. Unidad IV: Presentación y evaluación de resultados. La asignatura exige del estudiante la elaboración de un trabajo integrador.",

  competenciasCurso: [
    {
      id: 1,
      codigo: "b",
      descripcion:
        "Utiliza el pensamiento crítico, analizando los diferentes contextos, fuentes de información y hechos de la realidad.",
      orden: 1,
    },
    {
      id: 2,
      codigo: "c",
      descripcion:
        "Realiza investigaciones, relacionadas con su profesión, bajo la guía de un profesional de mayor experiencia.",
      orden: 2,
    },
    {
      id: 3,
      codigo: "d",
      descripcion:
        "Aplica adecuadamente estrategias metacognitivas, lo que lo capacita para el aprendizaje autónomo para toda la vida (Aprender a aprender).",
      orden: 3,
    },
    {
      id: 4,
      codigo: "a",
      descripcion:
        "Planifica y organiza eficazmente sus actividades y el tiempo dedicado a ellas.",
      orden: 4,
    },
    {
      id: 5,
      codigo: "d",
      descripcion:
        "Utiliza eficazmente las nuevas tecnologías de información y la comunicación.",
      orden: 5,
    },
    {
      id: 6,
      codigo: "e",
      descripcion:
        "Resuelve de manera creadora los problemas profesionales y personales a los que se enfrenta.",
      orden: 6,
    },
    {
      id: 7,
      codigo: "f",
      descripcion:
        "Lidera y participa activamente en equipos de trabajo, se compromete con las tareas y logros de los mismos.",
      orden: 7,
    },
    {
      id: 8,
      codigo: "h",
      descripcion:
        "Reconoce la diversidad cultural y la existencia de diferentes perspectivas culturales, expresadas en distintas formas de organización, sistemas de relación y visiones del mundo, lo que implica el reconocimiento y valoración del otro.",
      orden: 8,
    },
    {
      id: 9,
      codigo: "1",
      descripcion:
        "Analizar un sistema complejo de computación y aplicar principios de computación y otras disciplinas relevantes para identificar soluciones.",
      orden: 9,
    },
    {
      id: 10,
      codigo: "2",
      descripcion:
        "Diseñar, implementar y evaluar una solución basada en computación para cumplir con un determinado conjunto de requerimientos de computación en el contexto de la disciplina del programa.",
      orden: 10,
    },
    {
      id: 11,
      codigo: "3",
      descripcion:
        "Comunicación efectiva en una variedad de contextos profesionales.",
      orden: 11,
    },
    {
      id: 12,
      codigo: "5",
      descripcion:
        "Trabajar de manera efectiva como miembro o líder de un equipo comprometido con actividades propias de la disciplina del programa.",
      orden: 12,
    },
    {
      id: 13,
      codigo: "6",
      descripcion:
        "Brindar soporte a la entrega, uso, y administración de sistemas de información en un entorno de sistemas de información.",
      orden: 13,
    },
    {
      id: 14,
      codigo: "7",
      descripcion:
        "Aprendizaje Continuo: Reconoce la necesidad y tiene la capacidad para dedicarse a un aprendizaje autónomo para el desarrollo profesional continuo.",
      orden: 14,
    },
  ],

  componentesConceptuales: [
    {
      id: 1,
      silaboId: 1,
      grupo: "COMP",
      codigo: "b.3",
      descripcion:
        "Analiza los diferentes dilemas sociales teniendo en cuenta la base del pensamiento crítico.",
      orden: 1,
    },
    {
      id: 2,
      silaboId: 1,
      grupo: "COMP",
      codigo: "c.1",
      descripcion:
        "Determina el tema de investigación y las fuentes de información relacionadas al tema por investigar.",
      orden: 2,
    },
    {
      id: 3,
      silaboId: 1,
      grupo: "COMP",
      codigo: "c.2",
      descripcion:
        "Aplica técnicas y herramientas para el desarrollo de la investigación en su especialidad.",
      orden: 3,
    },
    {
      id: 4,
      silaboId: 1,
      grupo: "COMP",
      codigo: "d.2",
      descripcion: "Ensaya y evalúa diversas maneras de aprender algo nuevo.",
      orden: 4,
    },
    {
      id: 5,
      silaboId: 1,
      grupo: "COMP",
      codigo: "d.3",
      descripcion:
        "Ejecuta ejercicios de autoevaluación para medir el desarrollo de su aprendizaje.",
      orden: 5,
    },
    {
      id: 6,
      silaboId: 1,
      grupo: "COMP",
      codigo: "a.1",
      descripcion: "Planifica eficazmente sus actividades.",
      orden: 6,
    },
    {
      id: 7,
      silaboId: 1,
      grupo: "COMP",
      codigo: "a.2",
      descripcion:
        "Asigna eficientemente los tiempos para el desarrollo de sus actividades.",
      orden: 7,
    },
    {
      id: 8,
      silaboId: 1,
      grupo: "COMP",
      codigo: "d.1",
      descripcion:
        "Reconoce las diferentes tecnologías de información y comunicación.",
      orden: 8,
    },
    {
      id: 9,
      silaboId: 1,
      grupo: "COMP",
      codigo: "d.2",
      descripcion:
        "Aplica las nuevas tecnologías de información en el contexto de su desarrollo académico profesional.",
      orden: 9,
    },
    {
      id: 10,
      silaboId: 1,
      grupo: "COMP",
      codigo: "e.1",
      descripcion:
        "Resuelve de manera creativa problemas profesionales a los que se enfrenta.",
      orden: 10,
    },
    {
      id: 11,
      silaboId: 1,
      grupo: "COMP",
      codigo: "f.1",
      descripcion: "Participa en equipos de trabajo.",
      orden: 11,
    },
    {
      id: 12,
      silaboId: 1,
      grupo: "COMP",
      codigo: "f.2",
      descripcion:
        "Se compromete con las tareas y logros de su equipo de trabajo.",
      orden: 12,
    },
    {
      id: 13,
      silaboId: 1,
      grupo: "COMP",
      codigo: "h.1",
      descripcion:
        "Reconoce la importancia del enfoque de ciudadanía intercultural en la práctica social en los distintos escenarios del desempeño personal y colectivo.",
      orden: 13,
    },
    {
      id: 14,
      silaboId: 1,
      grupo: "COMP",
      codigo: "1.a",
      descripcion: "Aplica conocimiento de la especialidad.",
      orden: 14,
    },
    {
      id: 15,
      silaboId: 1,
      grupo: "COMP",
      codigo: "1.b",
      descripcion: "Analiza problemas y establece requerimientos.",
      orden: 15,
    },
    {
      id: 16,
      silaboId: 1,
      grupo: "COMP",
      codigo: "2.a",
      descripcion:
        "Diseña, implementa y/o evalúa procesos, componentes o programas.",
      orden: 16,
    },
    {
      id: 17,
      silaboId: 1,
      grupo: "COMP",
      codigo: "2.b",
      descripcion: "Usa técnicas y herramientas de la especialidad.",
      orden: 17,
    },
    {
      id: 18,
      silaboId: 1,
      grupo: "COMP",
      codigo: "3.a",
      descripcion: "Se comunica de manera efectiva.",
      orden: 18,
    },
    {
      id: 19,
      silaboId: 1,
      grupo: "COMP",
      codigo: "5.a",
      descripcion: "Trabaja en equipo.",
      orden: 19,
    },
    {
      id: 20,
      silaboId: 1,
      grupo: "COMP",
      codigo: "6.a",
      descripcion:
        "Participa en las diversas etapas de un sistema de información.",
      orden: 20,
    },
    {
      id: 21,
      silaboId: 1,
      grupo: "COMP",
      codigo: "7.a",
      descripcion: "Reconoce la importancia de la formación continua.",
      orden: 21,
    },
  ],

  componentesProcedimentales: [],

  componentesActitudinales: [
    {
      id: 1,
      silaboId: 1,
      grupo: "ACT",
      codigo: "b",
      descripcion: "Búsqueda de la verdad.",
      orden: 1,
    },
    {
      id: 2,
      silaboId: 1,
      grupo: "ACT",
      codigo: "c",
      descripcion: "Compromiso ético en todo su quehacer.",
      orden: 2,
    },
    {
      id: 3,
      silaboId: 1,
      grupo: "ACT",
      codigo: "f",
      descripcion: "Actitud innovadora y emprendedora.",
      orden: 3,
    },
  ],

  resultadosAprendizaje: [],

  unidadesDidacticas: [
    {
      id: 1,
      silaboId: 1,
      numero: 1,
      titulo: "DISEÑO DE SOLUCIONES INNOVADORAS",
      contenidosConceptuales:
        "El taller y sus objetivos generales. El modelo de trabajo. Planteamiento del problema. El pensamiento de diseño y sus técnicas. Las necesidades del público objetivo y del entorno para entender a los usuarios. Identificar oportunidades de mejora. Fomento de la creatividad para generar nuevas y posibles soluciones. Actividades para la ideación. Propuesta de soluciones creativas. Analizar y ajustar las soluciones a un contexto particular. El prototipo y su importancia en el proyecto. Métodos de modelado espacial y gráficos no verbales. Indicadores para comprobar validez de la solución. Validación del prototipo.",
      contenidosProcedimentales:
        "Identifica modelos y herramientas a utilizar. Reconoce y utiliza información secundaria disponible física y virtualmente. Conforma el equipo de proyecto. Identifica el contexto del problema, necesidades, publico objetivo, entorno y usuarios. Producto: Descubrimiento del problema. Analiza la información recabada e identifica oportunidades de mejora y prioriza acciones. Explora ideas. Usa diversas herramientas cualitativas. Producto: Idea de solución. Realiza actividades grupales y propuestas creativas. Desarrolla el prototipo. Producto: Diseño del primer prototipo. Realiza creación de prototipo en grupo. Realiza validación de prototipo. Producto: Evaluar prototipo.",
      actividadesAprendizaje:
        "Taller: Trabajo grupal en el proyecto – 2 h, Expone el proyecto final - 2 h, Reunión de coordinación diaria –3 h, Crea informe final de proyecto –3 h. De trabajo independiente: No aplica",
      horasLectivasTeoria: 0,
      horasLectivasPractica: 10,
      horasNoLectivasTeoria: 0,
      horasNoLectivasPractica: 0,
      semanas: [
        {
          id: 1,
          silaboUnidadId: 1,
          semana: 1,
          contenidosConceptuales: "Introducción",
          contenidosProcedimentales: "",
          actividadesAprendizaje: "",
          horasLectivasTeoria: 0,
          horasLectivasPractica: 2,
          horasNoLectivasTeoria: 0,
          horasNoLectivasPractica: 0,
        },
        {
          id: 2,
          silaboUnidadId: 1,
          semana: 2,
          contenidosConceptuales: "Planteamiento",
          contenidosProcedimentales: "",
          actividadesAprendizaje: "",
          horasLectivasTeoria: 0,
          horasLectivasPractica: 3,
          horasNoLectivasTeoria: 0,
          horasNoLectivasPractica: 0,
        },
        {
          id: 3,
          silaboUnidadId: 1,
          semana: 3,
          contenidosConceptuales: "Desarrollo",
          contenidosProcedimentales: "",
          actividadesAprendizaje: "",
          horasLectivasTeoria: 0,
          horasLectivasPractica: 3,
          horasNoLectivasTeoria: 0,
          horasNoLectivasPractica: 0,
        },
        {
          id: 4,
          silaboUnidadId: 1,
          semana: 4,
          contenidosConceptuales: "Validación",
          contenidosProcedimentales: "",
          actividadesAprendizaje: "",
          horasLectivasTeoria: 0,
          horasLectivasPractica: 2,
          horasNoLectivasTeoria: 0,
          horasNoLectivasPractica: 0,
        },
      ],
    },
    {
      id: 2,
      silaboId: 1,
      numero: 2,
      titulo: "GESTIÓN DE PROYECTOS Y APLICACIONES MODERNAS",
      contenidosConceptuales:
        "Organización y planificación de proyecto ágil. Planificación del sprint. Seguimiento del progreso del proyecto. Seguimiento del progreso. La revisión y retrospectiva del sprint. Negociación del alcance y el retrabajo. Sincerar la capacidad del equipo. Soluciones modernas, arquitectura y características tecnológicas. Evaluación del avance del proyecto. Semana de exámenes parciales. Este curso no tiene examen parcial.",
      contenidosProcedimentales:
        "Crea la pila de producto. Estima el esfuerzo de la historia de usuario. Define, prioriza y planifica los esprints y raleases. Crea informe semanal. Producto: Sprint backlog. Identifica y sigue el estado de las tareas. Actualiza diariamente la estimación de trabajo restante para ayudar al seguimiento de progreso hacia el objetivo. Crea y analiza el gráfico de evolución del trabajo. Producto: La pila de producto del Sprint. Identifica objetivos no cumplidos. Negocia el alcance del proyecto. Identifica los tipos de arquitectura y tecnología que involucra la solución que se está desarrollando. Producto: Arquitectura de la solución. Evaluación del avance del proyecto. Producto: Retrospectiva del y revisión del Sprint.",
      actividadesAprendizaje:
        "Taller: Trabajo grupal en el proyecto – 2 h, Expone el proyecto final - 2 h, Reunión de coordinación diaria –3 h, Crea informe final de proyecto –3 h. De trabajo independiente: No aplica",
      horasLectivasTeoria: 0,
      horasLectivasPractica: 10,
      horasNoLectivasTeoria: 0,
      horasNoLectivasPractica: 0,
      semanas: [
        {
          id: 5,
          silaboUnidadId: 2,
          semana: 5,
          contenidosConceptuales: "Planificación",
          contenidosProcedimentales: "",
          actividadesAprendizaje: "",
          horasLectivasTeoria: 0,
          horasLectivasPractica: 3,
          horasNoLectivasTeoria: 0,
          horasNoLectivasPractica: 0,
        },
        {
          id: 6,
          silaboUnidadId: 2,
          semana: 6,
          contenidosConceptuales: "Seguimiento",
          contenidosProcedimentales: "",
          actividadesAprendizaje: "",
          horasLectivasTeoria: 0,
          horasLectivasPractica: 2,
          horasNoLectivasTeoria: 0,
          horasNoLectivasPractica: 0,
        },
        {
          id: 7,
          silaboUnidadId: 2,
          semana: 7,
          contenidosConceptuales: "Revisión",
          contenidosProcedimentales: "",
          actividadesAprendizaje: "",
          horasLectivasTeoria: 0,
          horasLectivasPractica: 3,
          horasNoLectivasTeoria: 0,
          horasNoLectivasPractica: 0,
        },
        {
          id: 8,
          silaboUnidadId: 2,
          semana: 8,
          contenidosConceptuales: "Evaluación",
          contenidosProcedimentales: "",
          actividadesAprendizaje: "",
          horasLectivasTeoria: 0,
          horasLectivasPractica: 2,
          horasNoLectivasTeoria: 0,
          horasNoLectivasPractica: 0,
        },
      ],
    },
    {
      id: 3,
      silaboId: 1,
      numero: 3,
      titulo: "INTEGRACIÓN Y ENTREGA CONTINUA",
      contenidosConceptuales:
        "Integración continua en el proyecto. Herramientas de automatización de la integración. Entrega continua en el proyecto. Herramientas de entrega continua. Despliegue continuo en el proyecto. Herramientas de despliegue continuo. Técnicas de automatización de administración de infraestructura en nube. Herramientas de automatización de infraestructura.",
      contenidosProcedimentales:
        "Integra en la rama máster. Valida la funcionalidad y trazabilidad entre las historias de usuario, prototipos, mockup. Producto: Integración continúa implementada en repositorio compartido central. Automatiza la liberación del código y pruebas en el entorno de almacenamiento o no producción. Producto: Entrega continúa implementada. Realiza la implementación automática del incremento. Producto: Despliegue continúo en nube. Administra el entorno en nube. Configura servicios y componentes en la nube. Revisa la trazabilidad con la arquitectura propuesta en el proyecto. Producto: Reporte de costos y uso de nube.",
      actividadesAprendizaje:
        "Taller: Trabajo grupal en el proyecto – 2 h, Expone el proyecto final - 2 h, Reunión de coordinación diaria –3 h, Crea informe final de proyecto –3 h. De trabajo independiente: No aplica",
      horasLectivasTeoria: 0,
      horasLectivasPractica: 10,
      horasNoLectivasTeoria: 0,
      horasNoLectivasPractica: 0,
      semanas: [
        {
          id: 9,
          silaboUnidadId: 3,
          semana: 9,
          contenidosConceptuales: "Integración",
          contenidosProcedimentales: "",
          actividadesAprendizaje: "",
          horasLectivasTeoria: 0,
          horasLectivasPractica: 3,
          horasNoLectivasTeoria: 0,
          horasNoLectivasPractica: 0,
        },
        {
          id: 10,
          silaboUnidadId: 3,
          semana: 10,
          contenidosConceptuales: "Automatización",
          contenidosProcedimentales: "",
          actividadesAprendizaje: "",
          horasLectivasTeoria: 0,
          horasLectivasPractica: 2,
          horasNoLectivasTeoria: 0,
          horasNoLectivasPractica: 0,
        },
        {
          id: 11,
          silaboUnidadId: 3,
          semana: 11,
          contenidosConceptuales: "Entrega",
          contenidosProcedimentales: "",
          actividadesAprendizaje: "",
          horasLectivasTeoria: 0,
          horasLectivasPractica: 3,
          horasNoLectivasTeoria: 0,
          horasNoLectivasPractica: 0,
        },
        {
          id: 12,
          silaboUnidadId: 3,
          semana: 12,
          contenidosConceptuales: "Despliegue",
          contenidosProcedimentales: "",
          actividadesAprendizaje: "",
          horasLectivasTeoria: 0,
          horasLectivasPractica: 2,
          horasNoLectivasTeoria: 0,
          horasNoLectivasPractica: 0,
        },
      ],
    },
    {
      id: 4,
      silaboId: 1,
      numero: 4,
      titulo: "PRESENTACIÓN Y EVALUACIÓN DE RESULTADOS",
      contenidosConceptuales:
        "Estrategias para mostrar información a auspiciadores y e interesados. Estrategias para mostrar y encontrar el lugar adecuado para difundir. Transferir los resultados a la comunidad educativa. Publicaciones científicas. Presentación del producto. El informe final. Semana de exámenes finales. Este curso no tiene examen final. La evaluación del producto final presenta la nota del examen final. La nota W1, representa la evaluación final de todos los entregables que componen el producto final.",
      contenidosProcedimentales:
        "Crea poster de proyecto. Crea página web de proyecto. Crea wiki de proyecto. Producto: Wiki y página web del proyecto. Crear guías y manuales del conocimiento obtenido en el proyecto. Crear videos técnicos de interés en el proyecto. Revisa la importancia de crear artículos de difusión de resultados. Revisa la importancia de la autoría. Producto: Poster, video del proyecto. Crea el video del proyecto. Crea diapositiva de exposición final del proyecto. Producto: Artículo de revisión. Sustenta los resultados del proyecto. Producto: Presentación del proyecto.",
      actividadesAprendizaje:
        "Taller: Trabajo grupal en el proyecto – 2 h, Expone el proyecto final - 2 h, Reunión de coordinación diaria –3 h, Crea informe final de proyecto –3 h. De trabajo independiente: No aplica. Taller (L): Evaluación de final de proyecto – 4 h, Da de baja a los recursos configurados para el proyecto –6h. De trabajo Independiente (T.I): No aplica",
      horasLectivasTeoria: 0,
      horasLectivasPractica: 10,
      horasNoLectivasTeoria: 0,
      horasNoLectivasPractica: 0,
      semanas: [
        {
          id: 13,
          silaboUnidadId: 4,
          semana: 13,
          contenidosConceptuales: "Difusión",
          contenidosProcedimentales: "",
          actividadesAprendizaje: "",
          horasLectivasTeoria: 0,
          horasLectivasPractica: 3,
          horasNoLectivasTeoria: 0,
          horasNoLectivasPractica: 0,
        },
        {
          id: 14,
          silaboUnidadId: 4,
          semana: 14,
          contenidosConceptuales: "Transferencia",
          contenidosProcedimentales: "",
          actividadesAprendizaje: "",
          horasLectivasTeoria: 0,
          horasLectivasPractica: 2,
          horasNoLectivasTeoria: 0,
          horasNoLectivasPractica: 0,
        },
        {
          id: 15,
          silaboUnidadId: 4,
          semana: 15,
          contenidosConceptuales: "Presentación",
          contenidosProcedimentales: "",
          actividadesAprendizaje: "",
          horasLectivasTeoria: 0,
          horasLectivasPractica: 3,
          horasNoLectivasTeoria: 0,
          horasNoLectivasPractica: 0,
        },
        {
          id: 16,
          silaboUnidadId: 4,
          semana: 16,
          contenidosConceptuales: "Evaluación Final",
          contenidosProcedimentales: "",
          actividadesAprendizaje: "",
          horasLectivasTeoria: 0,
          horasLectivasPractica: 2,
          horasNoLectivasTeoria: 0,
          horasNoLectivasPractica: 0,
        },
      ],
    },
  ],

  estrategiasMetodologicas: [
    {
      nombre: "Método del pensamiento de diseño",
      descripcion:
        "Los estudiantes identifican el problema con mayor exactitud, son incluidos en un proceso de creación, innovación y colaboración constante, desarrolla habilidades de empatía y emprendimiento.",
    },
    {
      nombre: "Método basado en proyectos",
      descripcion:
        "Los estudiantes son enfrentados a una situación problemática real, promueve y fomenta el trabajo en equipo, la autocapacitación y la autogestión para el desarrollo de un producto final.",
    },
  ],

  recursosDidacticos: {
    notas: [
      {
        nombre: "Computadora y conexión a internet",
        descripcion: "Equipo necesario para las sesiones virtuales",
      },
    ],
    recursos: [
      {
        id: 1,
        recursoId: 1,
        recursoNombre: "Computadora, cámara web y conexión a internet",
        destino: "Herramientas básicas de trabajo",
        observaciones: "Equipamiento necesario para el desarrollo del curso",
      },
      {
        id: 2,
        recursoId: 2,
        recursoNombre: "Plataforma en nube",
        destino: "Gestión de contenido, gestión de proyecto e implementación",
        observaciones: "Plataforma principal de desarrollo",
      },
      {
        id: 3,
        recursoId: 3,
        recursoNombre: "Materiales",
        destino: "Material docente, textos bases",
        observaciones: "Ver fuentes de consultas",
      },
      {
        id: 4,
        recursoId: 4,
        recursoNombre: "Plataforma de soporte al aprendizaje remoto",
        destino: "Foros, chats, videos explicativos",
        observaciones: "Soporte para aprendizaje a distancia",
      },
      {
        id: 5,
        recursoId: 5,
        recursoNombre: "Biblioteca en línea USMP",
        destino: "Consulta de recursos bibliográficos",
        observaciones: "Acceso a recursos académicos",
      },
    ],
  },

  evaluacionAprendizaje: {
    descripcion:
      "El promedio final (PF) de la asignatura se obtiene con la siguiente fórmula:",
    formulaPF: "PF = (2*PE+EP+EF) / 4",
    componentesPF: [
      {
        codigo: "EP",
        descripcion: "Examen Parcial",
      },
      {
        codigo: "EF",
        descripcion: "Examen Final",
      },
      {
        codigo: "PE",
        descripcion: "Promedio de Evaluaciones",
      },
    ],
    descripcionPE:
      "El promedio de evaluaciones (PE) se obtiene de la siguiente manera:",
    formulaPE: "PE = ((P1+P2+P3+P4–MN) /3 + W1) /2",
    componentesPE: [
      {
        codigo: "P1, P2, P3, P4",
        descripcion: "Evaluaciones de los entregables",
      },
      {
        codigo: "MN",
        descripcion: "Menor nota",
      },
      {
        codigo: "W1",
        descripcion: "Trabajo final",
      },
    ],
  },

  fuentes: [
    {
      id: 1,
      tipo: "LIBRO",
      autores: "Chandrasekara, C., & Herath, P.",
      titulo:
        "Hands-on GitHub Actions: Implement CI/CD with GitHub Action Workflows for Your Applications",
      anio: 2021,
    },
    {
      id: 2,
      tipo: "LIBRO",
      autores:
        "Guijarro Olivares, J., Caparrós Ramírez, J., & Cubero Luque, L.",
      titulo: "DevOps y seguridad cloud",
      editorial: "Editorial UOC",
      anio: 2019,
      url: "https://elibro.net/es/lc/bibliotecafmh/titulos/128889",
    },
    {
      id: 3,
      tipo: "LIBRO",
      autores: "Humberto, Velasco-Elizondo, P., & Castro, L.",
      titulo: "Arquitectura de Software. Conceptos y Ciclo de Desarrollo",
      editorial: "CENGAGE",
      anio: 2015,
    },
    {
      id: 4,
      tipo: "LIBRO",
      autores: "Kim, G., Humble, J., Debois, P., Willis, J., & Forsgren, N.",
      titulo:
        "The DevOps Handbook: How to Create World-Class Agility, Reliability, & Security in Technology Organizations",
      anio: 2021,
    },
    {
      id: 5,
      tipo: "LIBRO",
      autores: "Modi, R.",
      titulo:
        "Deep-Dive Terraform on Azure: Automated Delivery and Deployment of Azure Solutions",
      anio: 2021,
    },
    {
      id: 6,
      tipo: "LIBRO",
      autores: "Monte Galiano, J.",
      titulo: "Implantar scrum con éxito",
      editorial: "Editorial UOC",
      anio: 2016,
      url: "https://elibro.net/es/lc/bibliotecafmh/titulos/58575",
    },
    {
      id: 7,
      tipo: "LIBRO",
      autores: "Moreau-Mathis, J.",
      titulo: "Babylon.js Essentials",
      anio: 2016,
    },
    {
      id: 8,
      tipo: "LIBRO",
      autores: "Serrano, M.",
      titulo: "Design Thinking",
      anio: 2014,
      url: "https://www.alpha-editorial.com/Papel/9789587780628/Design+Thinking",
    },
    {
      id: 9,
      tipo: "LIBRO",
      autores: "Swaraj, N.",
      titulo:
        "Accelerating DevSecOps on AWS: Create secure CI/CD pipelines using Chaos and AIOps",
      anio: 2022,
    },
    {
      id: 10,
      tipo: "WEB",
      autores: "AWS",
      titulo: "AWS | Cloud Computing—Servicios de informática en la nube",
      anio: 2023,
      url: "https://aws.amazon.com/es/",
    },
    {
      id: 11,
      tipo: "WEB",
      autores: "AWS",
      titulo: "AWS Educate",
      anio: 2023,
      url: "https://aws.amazon.com/es/education/awseducate/",
    },
    {
      id: 12,
      tipo: "WEB",
      autores: "Babylon",
      titulo:
        "Babylon.js: Powerful, Beautiful, Simple, Open - Web-Based 3D At Its Best",
      anio: 2023,
      url: "https://www.babylonjs.com",
    },
    {
      id: 13,
      tipo: "WEB",
      autores: "Foundation Blender",
      titulo:
        "Blender.org—Home of the Blender project—Free and Open 3D Creation Software",
      anio: 2023,
      url: "https://www.blender.org/",
    },
    {
      id: 14,
      tipo: "WEB",
      autores: "Microsoft",
      titulo: "Microsoft Azure Portal",
      anio: 2023,
      url: "https://azure.microsoft.com/es-es/get-started/azure-portal",
    },
    {
      id: 15,
      tipo: "WEB",
      autores: "Microsoft",
      titulo:
        "Microsoft Cloud Adoption Framework for Azure—Cloud Adoption Framework",
      anio: 2023,
      url: "https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/",
    },
    {
      id: 16,
      tipo: "WEB",
      autores: "Google",
      titulo: "Capacitaciones y cursos de Google Cloud",
      anio: 2023,
      url: "https://cloud.google.com/training?hl=es-419",
    },
    {
      id: 17,
      tipo: "WEB",
      autores: "Google",
      titulo: "Servicios de cloud computing",
      anio: 2023,
      url: "https://cloud.google.com/?hl=es",
    },
    {
      id: 18,
      tipo: "WEB",
      autores: "IBM",
      titulo: "IBM SkillsBuild Software Downloads",
      anio: 2019,
      url: "https://www.ibm.com/academic/www.ibm.com/academic/home",
    },
    {
      id: 19,
      tipo: "WEB",
      autores: "IBM",
      titulo: "IBM Cloud",
      anio: 2023,
      url: "https://cloud.ibm.com/login",
    },
    {
      id: 20,
      tipo: "WEB",
      autores: "USMP",
      titulo: "Sistema de Bibliotecas USMP",
      anio: 2023,
      url: "https://sibus.usmp.edu.pe/",
    },
    {
      id: 21,
      tipo: "WEB",
      autores: "Zotero",
      titulo: "Zotero",
      anio: 2023,
      url: "https://www.zotero.org/user/login/",
    },
  ],
  aportesResultadosPrograma: [
    {
      resultadoCodigo: "1",
      resultadoDescripcion:
        "Analizar un sistema complejo de computación y aplicar principios de computación y otras disciplinas relevantes para identificar soluciones.",
      aporteValor: "K",
    },
    {
      resultadoCodigo: "2",
      resultadoDescripcion:
        "Diseñar, implementar y evaluar una solución basada en computación para cumplir con un determinado conjunto de requerimientos de computación en el contexto de la disciplina del programa.",
      aporteValor: "R",
    },
    {
      resultadoCodigo: "3",
      resultadoDescripcion:
        "Comunicación efectiva en una variedad de contextos profesionales.",
      aporteValor: "R",
    },
    {
      resultadoCodigo: "4",
      resultadoDescripcion:
        "Reconocer la responsabilidad profesional y realizar juicios informados en la práctica de computación basados en principios éticos y legales.",
      aporteValor: "",
    },
    {
      resultadoCodigo: "5",
      resultadoDescripcion:
        "Trabajar de manera efectiva como miembro o líder de un equipo comprometido con actividades propias de la disciplina del programa.",
      aporteValor: "K",
    },
    {
      resultadoCodigo: "6",
      resultadoDescripcion:
        "Brindar soporte a la entrega, uso, y administración de sistemas de información en un entorno de sistemas de información.",
      aporteValor: "K",
    },
    {
      resultadoCodigo: "7",
      resultadoDescripcion:
        "Aprendizaje Continuo: Reconoce la necesidad y tiene la capacidad para dedicarse a un aprendizaje autónomo para el desarrollo profesional continuo.",
      aporteValor: "R",
    },
  ],
};
