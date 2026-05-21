// Mock data para revisión de sílabos
// Este archivo será reemplazado por una llamada al API cuando el backend esté listo

export interface SyllabusReview {
  id: string;
  courseName: string;
  courseCode: string;
  teacherName: string;
  docenteId: number;
  syllabusId: number;
  status: "ANALIZANDO" | "VALIDADO" | "DESAPROBADO";
  submittedDate: string;
}

export const mockSyllabiInReview: SyllabusReview[] = [
  {
    id: "1",
    courseName: "Taller de Proyectos",
    courseCode: "09072108042",
    teacherName: "Norma Birginia Leon Lescano",
    docenteId: 1,
    syllabusId: 101,
    status: "ANALIZANDO",
    submittedDate: "2024-01-15",
  },
  {
    id: "2",
    courseName: "Programación Orientada a Objetos",
    courseCode: "09072108043",
    teacherName: "Juan Manuel Huapalla García",
    docenteId: 2,
    syllabusId: 102,
    status: "VALIDADO",
    submittedDate: "2024-01-16",
  },
  {
    id: "3",
    courseName: "Base de Datos",
    courseCode: "09072108044",
    teacherName: "María Elena García López",
    docenteId: 3,
    syllabusId: 103,
    status: "DESAPROBADO",
    submittedDate: "2024-01-17",
  },
  {
    id: "4",
    courseName: "Desarrollo de Aplicaciones Web",
    courseCode: "09072108045",
    teacherName: "Carlos Alberto Pérez Ramos",
    docenteId: 4,
    syllabusId: 104,
    status: "ANALIZANDO",
    submittedDate: "2024-01-18",
  },
  {
    id: "5",
    courseName: "Inteligencia Artificial",
    courseCode: "09072108046",
    teacherName: "Ana María Torres Silva",
    docenteId: 5,
    syllabusId: 105,
    status: "VALIDADO",
    submittedDate: "2024-01-19",
  },
];
