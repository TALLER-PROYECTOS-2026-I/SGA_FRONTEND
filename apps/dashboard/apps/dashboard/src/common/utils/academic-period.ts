/**
 * Utilidades para manejar periodos académicos de la USMP
 *
 * La Universidad de San Martín de Porres (USMP) en Lima, Perú tiene dos semestres académicos:
 * - Semestre I (2025-I): Marzo - Junio
 * - Semestre II (2025-II): Julio/Agosto - Diciembre
 *
 * Los meses de Enero y Febrero se consideran preparación para el Semestre I del año en curso.
 */

/**
 * Calcula el periodo académico actual basado en la fecha actual
 * y los ciclos académicos de la USMP en Lima, Perú
 *
 * @returns {string} El periodo académico en formato "YYYY-I" o "YYYY-II"
 *
 * @example
 * // Si estamos en marzo de 2025
 * getCurrentAcademicPeriod() // returns "2025-I"
 *
 * @example
 * // Si estamos en agosto de 2025
 * getCurrentAcademicPeriod() // returns "2025-II"
 */
export function getCurrentAcademicPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 0-11, por eso +1

  // USMP tiene 2 semestres:
  // Semestre I: Marzo - Junio (meses 3-6)
  // Semestre II: Julio/Agosto - Diciembre (meses 7-12)
  // Enero-Febrero se considera preparación para Semestre I

  if (month >= 1 && month <= 6) {
    // Enero a Junio = Semestre I
    return `${year}-I`;
  } else {
    // Julio a Diciembre = Semestre II
    return `${year}-II`;
  }
}

/**
 * Calcula el periodo académico para una fecha específica
 *
 * @param {Date} date - La fecha para la cual calcular el periodo
 * @returns {string} El periodo académico en formato "YYYY-I" o "YYYY-II"
 *
 * @example
 * getAcademicPeriodForDate(new Date('2025-03-15')) // returns "2025-I"
 * getAcademicPeriodForDate(new Date('2025-08-20')) // returns "2025-II"
 */
export function getAcademicPeriodForDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (month >= 1 && month <= 6) {
    return `${year}-I`;
  } else {
    return `${year}-II`;
  }
}

/**
 * Obtiene el nombre completo del semestre
 *
 * @param {string} period - El periodo en formato "YYYY-I" o "YYYY-II"
 * @returns {string} El nombre completo del semestre
 *
 * @example
 * getSemesterName("2025-I") // returns "Primer Semestre 2025"
 * getSemesterName("2025-II") // returns "Segundo Semestre 2025"
 */
export function getSemesterName(period: string): string {
  const [year, semester] = period.split("-");

  if (semester === "I") {
    return `Primer Semestre ${year}`;
  } else if (semester === "II") {
    return `Segundo Semestre ${year}`;
  }

  return period;
}

/**
 * Valida si un periodo académico tiene el formato correcto
 *
 * @param {string} period - El periodo a validar
 * @returns {boolean} true si el formato es válido, false en caso contrario
 *
 * @example
 * isValidAcademicPeriod("2025-I") // returns true
 * isValidAcademicPeriod("2025-II") // returns true
 * isValidAcademicPeriod("2025-III") // returns false
 * isValidAcademicPeriod("2025") // returns false
 */
export function isValidAcademicPeriod(period: string): boolean {
  const regex = /^\d{4}-(I|II)$/;
  return regex.test(period);
}

/**
 * Genera una lista de periodos académicos
 *
 * @param {number} yearsBack - Número de años hacia atrás
 * @param {number} yearsForward - Número de años hacia adelante
 * @returns {string[]} Array de periodos académicos
 *
 * @example
 * // Si estamos en 2025
 * generateAcademicPeriods(1, 1)
 * // returns ["2024-I", "2024-II", "2025-I", "2025-II", "2026-I", "2026-II"]
 */
export function generateAcademicPeriods(
  yearsBack: number = 1,
  yearsForward: number = 1,
): string[] {
  const currentYear = new Date().getFullYear();
  const periods: string[] = [];

  for (
    let year = currentYear - yearsBack;
    year <= currentYear + yearsForward;
    year++
  ) {
    periods.push(`${year}-I`);
    periods.push(`${year}-II`);
  }

  return periods;
}

/**
 * Obtiene las fechas aproximadas de inicio y fin de un periodo académico
 *
 * @param {string} period - El periodo académico
 * @returns {object} Objeto con fechas de inicio y fin aproximadas
 *
 * @example
 * getPeriodDates("2025-I")
 * // returns { start: "Marzo 2025", end: "Junio 2025" }
 */
export function getPeriodDates(period: string): { start: string; end: string } {
  const [year, semester] = period.split("-");

  if (semester === "I") {
    return {
      start: `Marzo ${year}`,
      end: `Junio ${year}`,
    };
  } else {
    return {
      start: `Agosto ${year}`,
      end: `Diciembre ${year}`,
    };
  }
}
