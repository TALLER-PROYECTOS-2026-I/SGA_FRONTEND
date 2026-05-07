// syllabus-review-query.ts
// Archivo encargado de manejar la consulta, guardado, aprobación y desaprobación
// de sílabos que se encuentran en revisión.
// Usa React Query para manejar caché, estados de carga, errores y mutaciones.

// =====================================================
// IMPORTS
// =====================================================

// Importa hooks de React Query.
// useQuery sirve para consultar datos.
// useMutation sirve para ejecutar acciones que modifican datos.
// useQueryClient permite invalidar, eliminar o refrescar consultas guardadas en caché.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Importa el tipo UseQueryOptions.
// Sirve para permitir que los hooks personalizados reciban opciones extra de React Query.
import type { UseQueryOptions } from "@tanstack/react-query";

// =====================================================
// TIPOS DE ESTADO Y RESPUESTAS
// =====================================================

// Define el estado usado para sílabos que están en revisión.
// En este caso solo se maneja EN_REVISIÓN.
export type SyllabusReviewStatus = "EN_REVISIÓN";

// Define la estructura de un sílabo mostrado en la lista de revisión.
export interface SyllabusReview {
  // Identificador del registro de revisión o del sílabo.
  id: string;

  // Nombre del curso.
  courseName: string;

  // Código del curso.
  courseCode: string;

  // Nombre del docente asignado.
  teacherName: string;

  // Id del docente asignado.
  docenteId: number;

  // Id del sílabo.
  syllabusId: number;

  // Estado del sílabo en revisión.
  status: SyllabusReviewStatus;

  // Periodo académico del sílabo.
  academicPeriod: string;

  // Fecha en que fue enviado o actualizado.
  submittedDate: string;
}

// Define la estructura de los datos de revisión.
// Cada fieldId representa una sección o campo revisado.
// Cada campo puede estar aprobado, rechazado o pendiente.
export interface ReviewData {
  [fieldId: string]: {
    // Estado de revisión del campo.
    status: "approved" | "rejected" | null;

    // Comentario asociado al campo revisado.
    comment: string;
  };
}

// Define la estructura enviada al aprobar o desaprobar un sílabo.
export interface ApproveRejectRequest {
  // Id del sílabo que se aprobará o desaprobará.
  syllabusId: number;

  // Estado final que se enviará al backend.
  estado: "VALIDADO" | "DESAPROBADO";

  // Datos de revisión de las secciones.
  reviewData: ReviewData;
}

// Define posibles formas en que puede llegar el periodo académico
// desde el endpoint de datos generales.
interface DatosGeneralesResponse {
  semestreAcademico?: string;
  semestre_academico?: string;
  periodoAcademico?: string;
  periodo_academico?: string;

  // Algunos endpoints pueden devolver la información dentro de data.
  data?: {
    semestreAcademico?: string;
    semestre_academico?: string;
    periodoAcademico?: string;
    periodo_academico?: string;
  };
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

// Relaciona un fieldId del frontend con una o más secciones numéricas del sílabo.
// Se usa principalmente cuando se desaprueba un sílabo para enviar observaciones
// por número de sección.
function mapFieldToSections(fieldId: string): number[] {
  // Mapa que indica a qué sección pertenece cada paso del formulario.
  const mapping: Record<string, number[]> = {
    "step-1": [1],
    "step-2": [2],
    "step-3": [3],
    "step-4": [4],
    "step-5": [5, 6],
    "step-6": [7],
    "step-7": [8],
  };

  // Devuelve las secciones correspondientes al fieldId.
  // Si no existe en el mapa, devuelve [0] como valor por defecto.
  return mapping[fieldId] || [0];
}

// Verifica si un estado corresponde a un sílabo en revisión.
// Normaliza el valor para aceptar variantes como EN_REVISION o ANALIZANDO.
function isInReviewStatus(value: unknown) {
  // Convierte el valor recibido a texto, elimina espacios y lo pasa a mayúsculas.
  const status = String(value ?? "").trim().toUpperCase();

  // Devuelve true si el estado representa revisión.
  return (
    status === "EN_REVISIÓN" ||
    status === "EN_REVISION" ||
    status === "ANALIZANDO"
  );
}

// Obtiene el periodo académico desde un objeto genérico.
// Se revisan varios nombres posibles porque el backend puede devolver
// el mismo dato con diferentes formatos.
function getAcademicPeriodFromItem(item: Record<string, unknown>) {
  return (
    (item.periodoAcademico as string) ||
    (item.periodo_academico as string) ||
    (item.semestreAcademico as string) ||
    (item.semestre_academico as string) ||
    (item.academicPeriod as string) ||
    (item.periodo as string) ||
    ""
  );
}

// Obtiene el periodo académico desde la respuesta de datos generales.
// También revisa si el dato viene directamente o dentro de data.
function getAcademicPeriodFromDatosGenerales(data: DatosGeneralesResponse) {
  return (
    data.semestreAcademico ||
    data.semestre_academico ||
    data.periodoAcademico ||
    data.periodo_academico ||
    data.data?.semestreAcademico ||
    data.data?.semestre_academico ||
    data.data?.periodoAcademico ||
    data.data?.periodo_academico ||
    ""
  );
}

// =====================================================
// MANAGER DE REVISIÓN DE SÍLABOS
// =====================================================

// Clase encargada de centralizar las peticiones HTTP relacionadas con revisión.
// Aquí se consultan sílabos en revisión, datos de revisión,
// guardado de revisión, aprobación y desaprobación.
class SyllabusReviewManager {
  // Obtiene la URL base de la API.
  // Si se recibe baseUrl, usa esa.
  // Si no, usa VITE_API_BASE_URL.
  // Si tampoco existe, usa localhost como valor por defecto.
  private getApiBase(baseUrl?: string) {
    return (
      baseUrl ??
      import.meta.env.VITE_API_BASE_URL ??
      "http://localhost:7071/api"
    );
  }

  // =====================================================
  // OBTENER PERIODO ACADÉMICO DESDE DATOS GENERALES
  // =====================================================

  // Consulta el endpoint de datos generales para obtener el periodo académico
  // cuando no viene incluido en la lista principal de sílabos en revisión.
  private async fetchAcademicPeriodFromGeneralData(
    syllabusId: number,
    baseUrl?: string,
  ): Promise<string> {
    // Si no existe syllabusId, no se puede consultar el periodo.
    if (!syllabusId) return "";

    // Construye la URL del endpoint de datos generales.
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/datos-generales`;

    try {
      // Realiza la petición GET al endpoint de datos generales.
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Si la respuesta no es correcta, devuelve texto vacío.
      // No se lanza error porque este dato solo enriquece la respuesta.
      if (!res.ok) {
        return "";
      }

      // Convierte la respuesta a JSON y extrae el periodo académico.
      const json = (await res.json()) as DatosGeneralesResponse;
      return getAcademicPeriodFromDatosGenerales(json);
    } catch {
      // Si ocurre un error de red o parsing, devuelve texto vacío.
      return "";
    }
  }

  // =====================================================
  // LISTAR SÍLABOS EN REVISIÓN
  // =====================================================

  // Consulta todos los sílabos y devuelve solo los que están en revisión.
  // También normaliza los nombres de campos para que el frontend trabaje
  // con una estructura consistente.
  async fetchAllInReview(baseUrl?: string): Promise<SyllabusReview[]> {
    // Construye la URL del endpoint de revisión.
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/revision`;

    // Realiza la petición al backend.
    const res = await fetch(url);

    // Si la respuesta falla, lee el texto del error y lanza una excepción.
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status} ${t}`);
    }

    // Convierte la respuesta a JSON.
    const json = await res.json();

    // Soporta dos formatos:
    // 1. Que el backend devuelva un arreglo directamente.
    // 2. Que devuelva un objeto con data.
    const rawData = Array.isArray(json) ? json : json?.data ?? [];

    // Filtra los sílabos que están en revisión y los transforma
    // al formato SyllabusReview usado por el frontend.
    const mappedSyllabi: SyllabusReview[] = rawData
      .filter((item: Record<string, unknown>) =>
        isInReviewStatus(
          item.estadoRevision ??
            item.estado_revision ??
            item.status ??
            item.estado,
        ),
      )
      .map((item: Record<string, unknown>) => {
        // Busca un identificador posible usando varios nombres de campo.
        const possibleId =
          item.id ??
          item._id ??
          item.idRevision ??
          item.syllabusId ??
          item.silaboId ??
          item.silabo_id ??
          item.silaboID ??
          "";

        // Busca el id del sílabo usando varios nombres posibles.
        const possibleSyllabusId =
          item.syllabusId ??
          item.silaboId ??
          item.silabo_id ??
          item.silaboID ??
          item.idSyllabus ??
          item.id ??
          0;

        // Devuelve el sílabo normalizado.
        return {
          id: String(possibleId ?? ""),

          courseName:
            (item.cursoNombre as string) ||
            (item.curso_nombre as string) ||
            (item.courseName as string) ||
            "Sin nombre",

          courseCode:
            (item.cursoCodigo as string) ||
            (item.curso_codigo as string) ||
            (item.courseCode as string) ||
            "N/A",

          teacherName:
            (item.nombreDocente as string) ||
            (item.docenteNombre as string) ||
            (item.docente_nombre as string) ||
            (item.docente as string) ||
            (item.correoDocente as string) ||
            (item.correo_docente as string) ||
            (item.correo as string) ||
            (item.teacherName as string) ||
            (item.teacherEmail as string) ||
            "No asignado",

          docenteId:
            Number(
              item.asignadoADocenteId ??
                item.asignado_a_docente_id ??
                item.docenteId ??
                item.docente_id ??
                0,
            ) || 0,

          syllabusId: Number(possibleSyllabusId) || 0,

          status: "EN_REVISIÓN" as const,

          academicPeriod: getAcademicPeriodFromItem(item),

          submittedDate:
            (item.fechaEnvio as string) ||
            (item.fecha_envio as string) ||
            (item.updatedAt as string) ||
            (item.updated_at as string) ||
            (item.createdAt as string) ||
            (item.created_at as string) ||
            new Date().toISOString(),
        };
      });

    // Enriquece los sílabos que no tienen periodo académico.
    // Para cada sílabo sin periodo, consulta datos generales y completa academicPeriod.
    const enrichedSyllabi = await Promise.all(
      mappedSyllabi.map(async (syllabus) => {
        // Si ya tiene periodo académico, se devuelve sin cambios.
        if (syllabus.academicPeriod) {
          return syllabus;
        }

        // Si no tiene periodo, se consulta desde datos generales.
        const academicPeriod =
          await this.fetchAcademicPeriodFromGeneralData(
            syllabus.syllabusId,
            baseUrl,
          );

        // Devuelve el sílabo con periodo académico o "No informado".
        return {
          ...syllabus,
          academicPeriod: academicPeriod || "No informado",
        };
      }),
    );

    // Devuelve la lista final de sílabos en revisión.
    return enrichedSyllabi;
  }

  // =====================================================
  // OBTENER DATOS DE REVISIÓN
  // =====================================================

  // Consulta los datos de revisión de un sílabo específico.
  // Si no existen datos, devuelve null.
  async fetchReviewData(
    syllabusId: number,
    baseUrl?: string,
  ): Promise<ReviewData | null> {
    // Construye la URL del endpoint de revisión del sílabo.
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/revision`;

    // Realiza la petición al backend.
    const res = await fetch(url);

    // Si el backend responde 404, significa que aún no hay revisión guardada.
    if (res.status === 404) {
      return null;
    }

    // Si ocurre otro error, se lanza excepción.
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status} ${t}`);
    }

    // Devuelve los datos de revisión.
    return (await res.json()) as ReviewData;
  }

  // =====================================================
  // GUARDAR DATOS DE REVISIÓN
  // =====================================================

  // Guarda los datos de revisión de un sílabo.
  // Envía reviewData al backend mediante POST.
  async saveReviewData(
    syllabusId: number,
    reviewData: ReviewData,
    baseUrl?: string,
  ): Promise<void> {
    // Construye la URL del endpoint de revisión.
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/revision`;

    // Envía los datos de revisión al backend.
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reviewData),
    });

    // Si la respuesta falla, lanza error con el contenido devuelto por backend.
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status} ${t}`);
    }
  }

  // =====================================================
  // APROBAR O DESAPROBAR SÍLABO
  // =====================================================

  // Envía la decisión final de revisión.
  // Si el estado es DESAPROBADO, construye observaciones por sección.
  // Si no, envía los datos como aprobación.
  async approveSyllabus(
    data: ApproveRejectRequest,
    baseUrl?: string,
  ): Promise<void> {
    // Obtiene la URL base de la API.
    const apiBase = this.getApiBase(baseUrl);

    // Determina si la acción es desaprobar.
    const isDisapprove = data.estado === "DESAPROBADO";

    // Define el endpoint según la acción.
    const endpoint = isDisapprove ? "desaprobar" : "aprobar";

    // Construye la URL final.
    const url = `${apiBase}/syllabus/${data.syllabusId}/${endpoint}`;

    // Variable donde se armará el cuerpo de la petición.
    let body: Record<string, unknown>;

    // Si se desaprueba, se deben enviar observaciones por sección.
    if (isDisapprove) {
      // Arreglo donde se guardarán las observaciones rechazadas.
      const observacionesArray: Array<{
        numeroSeccion: number;
        nombreSeccion: string;
        comentario: string;
      }> = [];

      // Recorre los campos revisados.
      // Solo toma los campos rechazados que tengan comentario.
      Object.entries(data.reviewData || {}).forEach(([fieldId, value]) => {
        if (value.status === "rejected" && value.comment?.trim()) {
          // Convierte el fieldId a número de sección.
          const sections = mapFieldToSections(fieldId);

          // Un campo puede representar más de una sección.
          // Por eso se agrega una observación por cada número de sección.
          sections.forEach((numeroSeccion) => {
            observacionesArray.push({
              numeroSeccion,
              nombreSeccion: fieldId,
              comentario: value.comment || "",
            });
          });
        }
      });

      // Cuerpo enviado al endpoint de desaprobación.
      body = {
        silaboId: data.syllabusId,
        observaciones: observacionesArray,
      };
    } else {
      // Cuerpo enviado al endpoint de aprobación.
      body = {
        estado: data.estado,
        reviewData: data.reviewData,
      };
    }

    // Envía la solicitud al backend.
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Si la respuesta falla, lanza error con el detalle.
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status} ${t}`);
    }
  }
}

// =====================================================
// INSTANCIA DEL MANAGER
// =====================================================

// Crea una instancia del manager de revisión.
// Se exporta para que los hooks puedan usar sus métodos.
export const syllabusReviewManager = new SyllabusReviewManager();

// =====================================================
// HOOK PARA LISTAR SÍLABOS EN REVISIÓN
// =====================================================

// Hook que consulta los sílabos en revisión.
// Permite recibir opciones extra de React Query.
export const useSyllabusInReview = (
  options?: UseQueryOptions<SyllabusReview[], Error>,
) => {
  return useQuery<SyllabusReview[], Error>({
    // Clave de caché usada por React Query.
    queryKey: ["syllabus", "in-review"],

    // Función que obtiene los sílabos en revisión.
    queryFn: () => syllabusReviewManager.fetchAllInReview(),

    // staleTime en 0 indica que los datos se consideran desactualizados inmediatamente.
    staleTime: 0,

    // Refresca la consulta cada vez que se monta el componente.
    refetchOnMount: "always",

    // Refresca la consulta cuando el usuario vuelve a enfocar la ventana.
    refetchOnWindowFocus: true,

    // No usa refresco automático por intervalo.
    refetchInterval: false,

    // No reintenta automáticamente si falla.
    retry: false,

    // Permite sobrescribir o agregar opciones desde fuera.
    ...options,
  });
};

// =====================================================
// HOOK PARA OBTENER DATOS DE REVISIÓN
// =====================================================

// Hook que consulta la revisión guardada de un sílabo específico.
export const useReviewData = (
  syllabusId: number | null | undefined,
  options?: UseQueryOptions<ReviewData | null, Error>,
) => {
  return useQuery<ReviewData | null, Error>({
    // Clave de caché específica por sílabo.
    queryKey: ["syllabus", syllabusId, "review-data"],

    // Función que obtiene los datos de revisión.
    queryFn: () => syllabusReviewManager.fetchReviewData(syllabusId as number),

    // Solo ejecuta la consulta si existe syllabusId.
    enabled: syllabusId !== null && syllabusId !== undefined,

    // No reintenta automáticamente si falla.
    retry: false,

    // Mantiene los datos frescos por 10 segundos.
    staleTime: 10_000,

    // Permite opciones extra desde el componente que use el hook.
    ...options,
  });
};

// =====================================================
// HOOK PARA GUARDAR DATOS DE REVISIÓN
// =====================================================

// Hook que guarda los datos de revisión de un sílabo.
// Después de guardar, invalida la consulta para refrescar la información.
export const useSaveReviewData = () => {
  // Obtiene el cliente de React Query para manejar caché.
  const queryClient = useQueryClient();

  return useMutation({
    // Función que ejecuta el guardado de revisión.
    mutationFn: ({
      syllabusId,
      reviewData,
    }: {
      syllabusId: number;
      reviewData: ReviewData;
    }) => syllabusReviewManager.saveReviewData(syllabusId, reviewData),

    // Cuando se guarda correctamente, invalida la consulta de review-data
    // para que React Query vuelva a obtener información actualizada.
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "review-data"],
      });
    },
  });
};

// =====================================================
// HOOK PARA APROBAR O DESAPROBAR SÍLABO
// =====================================================

// Hook que permite aprobar o desaprobar un sílabo.
// Después de ejecutar la acción, refresca la lista de sílabos en revisión.
export const useApproveSyllabus = () => {
  // Obtiene el cliente de React Query para modificar el caché.
  const queryClient = useQueryClient();

  return useMutation({
    // Función que envía la aprobación o desaprobación al backend.
    mutationFn: (data: ApproveRejectRequest) =>
      syllabusReviewManager.approveSyllabus(data),

    // Al completar correctamente, limpia y vuelve a consultar la lista en revisión.
    onSuccess: async () => {
      // Cancela consultas activas de sílabos en revisión.
      await queryClient.cancelQueries({
        queryKey: ["syllabus", "in-review"],
      });

      // Elimina la consulta del caché para evitar mostrar datos antiguos.
      queryClient.removeQueries({
        queryKey: ["syllabus", "in-review"],
      });

      // Vuelve a consultar la lista de sílabos en revisión.
      await queryClient.refetchQueries({
        queryKey: ["syllabus", "in-review"],
        type: "all",
      });
    },
  });
};