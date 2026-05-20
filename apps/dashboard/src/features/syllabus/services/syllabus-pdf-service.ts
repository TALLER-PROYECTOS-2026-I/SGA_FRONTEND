import type { CompleteSyllabus } from "../types/complete-syllabus";
import { authFetch } from "../../../common/utils/auth-fetch";

class SyllabusPDFService {
  private readonly baseUrl: string;

  constructor() {
    const apiBase =
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL ||
      "http://localhost:7071";

    this.baseUrl = apiBase.endsWith("/api") ? apiBase : `${apiBase}/api`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private normalizeCompleteSyllabus(raw: any): CompleteSyllabus {
    const data = raw?.data ?? raw?.content ?? raw ?? {};

    const datosGenerales =
      data.datosGenerales ||
      data.datos_generales ||
      data.generalData ||
      data.general ||
      {};

    const sumillaRaw = data.sumilla ?? data.summary ?? data.contenido ?? "";

    const sumilla =
      typeof sumillaRaw === "string"
        ? sumillaRaw
        : sumillaRaw?.sumilla || sumillaRaw?.contenido || "";

    const unidadesRaw =
      data.unidadesDidacticas ||
      data.unidades ||
      data.programacion ||
      data.programacionContenidos ||
      [];

    const unidadesDidacticas = Array.isArray(unidadesRaw)
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        unidadesRaw.map((unidad: any, unidadIndex: number) => {
          const semanasRaw =
            unidad.semanas ||
            unidad.semanasUnidad ||
            unidad.detalles ||
            unidad.contenidos ||
            [];

          return {
            id: Number(unidad.id ?? unidad.unidadId ?? unidadIndex + 1),
            silaboId: Number(
              unidad.silaboId ?? unidad.syllabusId ?? datosGenerales.id ?? 0,
            ),
            numero: Number(unidad.numero ?? unidadIndex + 1),
            titulo:
              unidad.titulo ?? unidad.nombre ?? `Unidad ${unidadIndex + 1}`,
            capacidadesText:
              unidad.capacidadesText ??
              unidad.capacidad ??
              unidad.capacidades ??
              "",
            contenidosConceptuales: unidad.contenidosConceptuales ?? "",
            contenidosProcedimentales: unidad.contenidosProcedimentales ?? "",
            actividadesAprendizaje: unidad.actividadesAprendizaje ?? "",
            horasLectivasTeoria: Number(unidad.horasLectivasTeoria ?? 0),
            horasLectivasPractica: Number(unidad.horasLectivasPractica ?? 0),
            horasNoLectivasTeoria: Number(unidad.horasNoLectivasTeoria ?? 0),
            horasNoLectivasPractica: Number(
              unidad.horasNoLectivasPractica ?? 0,
            ),
            semanas: Array.isArray(semanasRaw)
              ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                semanasRaw.map((semana: any, semanaIndex: number) => ({
                  id: Number(
                    semana.id ??
                      semana.semanaId ??
                      `${unidadIndex + 1}${semanaIndex + 1}`,
                  ),
                  silaboUnidadId: Number(
                    semana.silaboUnidadId ?? semana.unidadId ?? unidad.id ?? 0,
                  ),
                  semana: Number(
                    semana.semana ??
                      semana.numeroSemana ??
                      semana.numero ??
                      semanaIndex + 1,
                  ),
                  contenidosConceptuales:
                    semana.contenidosConceptuales ??
                    semana.contenidoConceptual ??
                    semana.conceptual ??
                    "",
                  contenidosProcedimentales:
                    semana.contenidosProcedimentales ??
                    semana.contenidoProcedimental ??
                    semana.procedimental ??
                    "",
                  actividadesAprendizaje:
                    semana.actividadesAprendizaje ??
                    semana.actividadAprendizaje ??
                    semana.actividades ??
                    "",
                  horasLectivasTeoria: Number(semana.horasLectivasTeoria ?? 0),
                  horasLectivasPractica: Number(
                    semana.horasLectivasPractica ?? 0,
                  ),
                  horasNoLectivasTeoria: Number(
                    semana.horasNoLectivasTeoria ?? 0,
                  ),
                  horasNoLectivasPractica: Number(
                    semana.horasNoLectivasPractica ?? 0,
                  ),
                  creadoEn: semana.creadoEn,
                  actualizadoEn: semana.actualizadoEn,
                }))
              : [],
          };
        })
      : [];

    const recursosRaw = data.recursosDidacticos || data.recursos || {};

    const evaluacionRaw =
      data.evaluacionAprendizaje ||
      data.evaluacion ||
      data.evaluacionDelAprendizaje ||
      {};

    return {
      datosGenerales: {
        nombreAsignatura:
          datosGenerales.nombreAsignatura ||
          datosGenerales.curso_nombre ||
          datosGenerales.nombre ||
          "",
        departamentoAcademico:
          datosGenerales.departamentoAcademico ||
          datosGenerales.departamento_academico ||
          "",
        escuelaProfesional:
          datosGenerales.escuelaProfesional ||
          datosGenerales.escuela_profesional ||
          "",
        programaAcademico:
          datosGenerales.programaAcademico ||
          datosGenerales.programa_academico ||
          "",
        semestreAcademico:
          datosGenerales.semestreAcademico ||
          datosGenerales.semestre_academico ||
          "",
        tipoAsignatura:
          datosGenerales.tipoAsignatura || datosGenerales.tipo_asignatura || "",
        tipoEstudios:
          datosGenerales.tipoEstudios || datosGenerales.tipo_de_estudios || "",
        modalidad:
          datosGenerales.modalidad ||
          datosGenerales.modalidadAsignatura ||
          datosGenerales.modalidad_de_asignatura ||
          "",
        codigoAsignatura:
          datosGenerales.codigoAsignatura ||
          datosGenerales.curso_codigo ||
          datosGenerales.codigo ||
          "",
        ciclo: datosGenerales.ciclo || "",
        requisitos: datosGenerales.requisitos || "",
        creditosTeoria: Number(
          datosGenerales.creditosTeoria ?? datosGenerales.creditos_teoria ?? 0,
        ),
        creditosPractica: Number(
          datosGenerales.creditosPractica ??
            datosGenerales.creditos_practica ??
            0,
        ),
        creditosTotales: Number(
          datosGenerales.creditosTotales ??
            datosGenerales.creditos_totales ??
            0,
        ),
        docentes:
          datosGenerales.docentes ||
          datosGenerales.docente ||
          datosGenerales.nombreDocente ||
          "",
        horasTeoria: Number(
          datosGenerales.horasTeoria ?? datosGenerales.horas_teoria ?? 0,
        ),
        horasPractica: Number(
          datosGenerales.horasPractica ?? datosGenerales.horas_practica ?? 0,
        ),
        horasTotales: Number(
          datosGenerales.horasTotales ??
            datosGenerales.horas_totales ??
            Number(
              datosGenerales.horasTeoria ?? datosGenerales.horas_teoria ?? 0,
            ) +
              Number(
                datosGenerales.horasPractica ??
                  datosGenerales.horas_practica ??
                  0,
              ),
        ),
        areaCurricular:
          datosGenerales.areaCurricular ||
          datosGenerales.area_curricular ||
          null,
      },

      sumilla,

      competenciasCurso: Array.isArray(data.competenciasCurso)
        ? data.competenciasCurso
        : Array.isArray(data.competencias)
          ? data.competencias
          : [],

      componentesConceptuales: Array.isArray(data.componentesConceptuales)
        ? data.componentesConceptuales
        : Array.isArray(data.componentes)
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.componentes.filter((item: any) => item.grupo === "COMP")
          : [],

      componentesProcedimentales: Array.isArray(data.componentesProcedimentales)
        ? data.componentesProcedimentales
        : Array.isArray(data.componentes)
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.componentes.filter((item: any) => item.grupo === "PROC")
          : [],

      componentesActitudinales: Array.isArray(data.componentesActitudinales)
        ? data.componentesActitudinales
        : Array.isArray(data.actitudinales)
          ? data.actitudinales
          : Array.isArray(data.componentes)
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data.componentes.filter((item: any) => item.grupo === "ACT")
            : [],

      resultadosAprendizaje: Array.isArray(data.resultadosAprendizaje)
        ? data.resultadosAprendizaje
        : [],

      unidadesDidacticas,

      estrategiasMetodologicas: Array.isArray(data.estrategiasMetodologicas)
        ? data.estrategiasMetodologicas
        : [],

      recursosDidacticos: {
        notas: Array.isArray(recursosRaw.notas) ? recursosRaw.notas : [],
        recursos: Array.isArray(recursosRaw.recursos)
          ? recursosRaw.recursos
          : Array.isArray(recursosRaw)
            ? recursosRaw
            : [],
      },

      evaluacionAprendizaje: {
        planEvaluacion: Array.isArray(evaluacionRaw.planEvaluacion)
          ? evaluacionRaw.planEvaluacion
          : [],
        formulaEvaluacion: evaluacionRaw.formulaEvaluacion,
        descripcion: evaluacionRaw.descripcion || "",
        formulaPF: evaluacionRaw.formulaPF || "",
        componentesPF: Array.isArray(evaluacionRaw.componentesPF)
          ? evaluacionRaw.componentesPF
          : [],
        descripcionPE: evaluacionRaw.descripcionPE || "",
        formulaPE: evaluacionRaw.formulaPE || "",
        componentesPE: Array.isArray(evaluacionRaw.componentesPE)
          ? evaluacionRaw.componentesPE
          : [],
      },

      fuentes: Array.isArray(data.fuentes)
        ? data.fuentes
        : Array.isArray(data.fuentesInformacion)
          ? data.fuentesInformacion
          : [],

      aportesResultadosPrograma: Array.isArray(data.aportesResultadosPrograma)
        ? data.aportesResultadosPrograma
        : Array.isArray(data.aportes)
          ? data.aportes
          : [],
    };
  }

  async fetchCompleteSyllabus(syllabusId: number): Promise<CompleteSyllabus> {
    const url = `${this.baseUrl}/syllabus/${syllabusId}/complete`;

    const res = await authFetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Error al obtener sílabo completo: ${res.status}`);
    }

    const response = await res.json();
    const normalized = this.normalizeCompleteSyllabus(response);

    return normalized;
  }

  async loadTemplate(templateName: string): Promise<string> {
    const response = await fetch(`/assets/${templateName}`);

    if (!response.ok) {
      throw new Error(`Error al cargar plantilla: ${response.status}`);
    }

    return response.text();
  }

  fillTemplate(htmlTemplate: string, data: CompleteSyllabus): string {
    let filledHtml = htmlTemplate;

    const dg = data.datosGenerales;

    filledHtml = filledHtml
      .replace(/{{nombreAsignatura}}/g, dg.nombreAsignatura || "")
      .replace(/{{codigoAsignatura}}/g, dg.codigoAsignatura || "")
      .replace(/{{departamentoAcademico}}/g, dg.departamentoAcademico || "")
      .replace(/{{escuelaProfesional}}/g, dg.escuelaProfesional || "")
      .replace(/{{programaAcademico}}/g, dg.programaAcademico || "")
      .replace(/{{semestreAcademico}}/g, dg.semestreAcademico || "")
      .replace(/{{tipoAsignatura}}/g, dg.tipoAsignatura || "")
      .replace(/{{tipoEstudios}}/g, dg.tipoEstudios || "")
      .replace(/{{modalidad}}/g, dg.modalidad || "")
      .replace(/{{ciclo}}/g, dg.ciclo || "")
      .replace(/{{requisitos}}/g, dg.requisitos || "Sin requisitos")
      .replace(/{{creditosTeoria}}/g, String(dg.creditosTeoria || 0))
      .replace(/{{creditosPractica}}/g, String(dg.creditosPractica || 0))
      .replace(/{{creditosTotales}}/g, String(dg.creditosTotales || 0))
      .replace(/{{horasTeoria}}/g, String(dg.horasTeoria || 0))
      .replace(/{{horasPractica}}/g, String(dg.horasPractica || 0))
      .replace(/{{horasTotales}}/g, String(dg.horasTotales || 0))
      .replace(/{{docentes}}/g, dg.docentes || "");

    filledHtml = filledHtml.replace(/{{sumilla}}/g, data.sumilla || "");

    const competenciasHtml = data.competenciasCurso
      .map((comp) => `<li>${comp.codigo}. ${comp.descripcion}</li>`)
      .join("\n");

    filledHtml = filledHtml.replace(/{{competenciasCurso}}/g, competenciasHtml);

    const conceptualesHtml = data.componentesConceptuales
      .map((comp) => `<li>${comp.codigo}. ${comp.descripcion}</li>`)
      .join("\n");

    filledHtml = filledHtml.replace(
      /{{componentesConceptuales}}/g,
      conceptualesHtml,
    );

    const procedimentalesHtml = data.componentesProcedimentales
      .map((comp) => `<li>${comp.codigo}. ${comp.descripcion}</li>`)
      .join("\n");

    filledHtml = filledHtml.replace(
      /{{componentesProcedimentales}}/g,
      procedimentalesHtml,
    );

    const actitudinalesHtml = data.componentesActitudinales
      .map((comp) => `<li>${comp.codigo}. ${comp.descripcion}</li>`)
      .join("\n");

    filledHtml = filledHtml.replace(
      /{{componentesActitudinales}}/g,
      actitudinalesHtml,
    );

    const resultadosHtml = data.resultadosAprendizaje
      .map((ra, index) => `<li>RA${index + 1}. ${ra.descripcion}</li>`)
      .join("\n");

    filledHtml = filledHtml.replace(
      /{{resultadosAprendizaje}}/g,
      resultadosHtml,
    );

    const unidadesHtml = data.unidadesDidacticas
      .map((unidad) => {
        const semanas = unidad.semanas || [];
        const semanaMin =
          semanas.length > 0 ? Math.min(...semanas.map((s) => s.semana)) : 0;
        const semanaMax =
          semanas.length > 0 ? Math.max(...semanas.map((s) => s.semana)) : 0;
        const rangoSemanas =
          semanas.length > 0 ? `${semanaMin} - ${semanaMax}` : "";

        return `
        <tr>
          <td>${unidad.numero}</td>
          <td>${unidad.titulo}</td>
          <td>${rangoSemanas}</td>
          <td>${unidad.contenidosConceptuales || ""}</td>
          <td>${unidad.contenidosProcedimentales || ""}</td>
          <td>${unidad.actividadesAprendizaje || ""}</td>
          <td>${unidad.horasLectivasTeoria || 0}</td>
          <td>${unidad.horasLectivasPractica || 0}</td>
        </tr>
      `;
      })
      .join("\n");

    filledHtml = filledHtml.replace(/{{unidadesDidacticas}}/g, unidadesHtml);

    const estrategiasHtml = (data.estrategiasMetodologicas || [])
      .map(
        (est) => `
        <div class="estrategia">
          <h4>${est.nombre}</h4>
          <p>${est.descripcion}</p>
        </div>
      `,
      )
      .join("\n");

    filledHtml = filledHtml.replace(
      /{{estrategiasMetodologicas}}/g,
      estrategiasHtml || "No se han definido estrategias metodológicas",
    );

    const notasHtml = (data.recursosDidacticos.notas || [])
      .map(
        (nota) =>
          `<li><strong>${nota.nombre}:</strong> ${nota.descripcion}</li>`,
      )
      .join("\n");

    const recursosHtml = (data.recursosDidacticos.recursos || [])
      .map(
        (rec) =>
          `<li>${rec.recursoNombre} - ${rec.destino}${
            rec.observaciones ? ` (${rec.observaciones})` : ""
          }</li>`,
      )
      .join("\n");

    const todosRecursosHtml = `
      ${notasHtml ? `<h4>Notas:</h4><ul>${notasHtml}</ul>` : ""}
      ${recursosHtml ? `<h4>Recursos:</h4><ul>${recursosHtml}</ul>` : ""}
    `;

    filledHtml = filledHtml.replace(
      /{{recursosDidacticos}}/g,
      todosRecursosHtml || "No se han definido recursos",
    );

    const planEvaluacionHtml = (data.evaluacionAprendizaje.planEvaluacion || [])
      .map(
        (item) => `
        <tr>
          <td>${item.componenteNombre}</td>
          <td>${item.instrumentoNombre}</td>
          <td>Semana ${item.semana}</td>
          <td>${item.instrucciones || ""}</td>
        </tr>
      `,
      )
      .join("\n");

    filledHtml = filledHtml.replace(
      /{{planEvaluacion}}/g,
      planEvaluacionHtml || "<tr><td colspan='4'>No definido</td></tr>",
    );

    const formula = data.evaluacionAprendizaje.formulaEvaluacion;

    if (formula) {
      filledHtml = filledHtml.replace(
        /{{nombreReglaEvaluacion}}/g,
        formula.nombreRegla || "",
      );

      filledHtml = filledHtml.replace(
        /{{expresionFinal}}/g,
        `${formula.variableFinalCodigo} = ${formula.expresionFinal}`,
      );

      const variablesHtml = (formula.variables || [])
        .map((v) => `<li><strong>${v.codigo}:</strong> ${v.descripcion}</li>`)
        .join("\n");

      filledHtml = filledHtml.replace(
        /{{variablesFormula}}/g,
        variablesHtml || "",
      );

      const subformulasHtml = (formula.subformulas || [])
        .map((sf) => `<li>${sf.variableCodigo} = ${sf.expresion}</li>`)
        .join("\n");

      filledHtml = filledHtml.replace(
        /{{subformulas}}/g,
        subformulasHtml || "",
      );
    } else {
      filledHtml = filledHtml.replace(/{{nombreReglaEvaluacion}}/g, "");

      filledHtml = filledHtml.replace(
        /{{expresionFinal}}/g,
        data.evaluacionAprendizaje.formulaPF || "",
      );

      filledHtml = filledHtml.replace(/{{variablesFormula}}/g, "");
      filledHtml = filledHtml.replace(/{{subformulas}}/g, "");
    }

    filledHtml = filledHtml.replace(
      /{{descripcionPF}}/g,
      data.evaluacionAprendizaje.descripcion || "",
    );

    filledHtml = filledHtml.replace(
      /{{formulaPF}}/g,
      data.evaluacionAprendizaje.formulaPF || "",
    );

    const componentesPFHtml = (data.evaluacionAprendizaje.componentesPF || [])
      .map((comp) => `<li>${comp.codigo} = ${comp.descripcion}</li>`)
      .join("\n");

    filledHtml = filledHtml.replace(/{{componentesPF}}/g, componentesPFHtml);

    filledHtml = filledHtml.replace(
      /{{descripcionPE}}/g,
      data.evaluacionAprendizaje.descripcionPE || "",
    );

    filledHtml = filledHtml.replace(
      /{{formulaPE}}/g,
      data.evaluacionAprendizaje.formulaPE || "",
    );

    const componentesPEHtml = (data.evaluacionAprendizaje.componentesPE || [])
      .map((comp) => `<li>${comp.codigo} = ${comp.descripcion}</li>`)
      .join("\n");

    filledHtml = filledHtml.replace(/{{componentesPE}}/g, componentesPEHtml);

    const fuentesHtml = data.fuentes
      .map((fuente) => {
        let citation = `${fuente.autores} (${fuente.anio || "s.f."}). <i>${
          fuente.titulo
        }</i>.`;

        if (fuente.editorial) citation += ` ${fuente.editorial}.`;
        if (fuente.ciudad) citation += ` ${fuente.ciudad}.`;
        if (fuente.url)
          citation += ` <a href="${fuente.url}">${fuente.url}</a>`;

        return `<li>${citation}</li>`;
      })
      .join("\n");

    filledHtml = filledHtml.replace(/{{fuentes}}/g, fuentesHtml);

    const aportesHtml = data.aportesResultadosPrograma
      .map(
        (aporte) => `
        <tr>
          <td>${aporte.resultadoCodigo}</td>
          <td>${aporte.resultadoDescripcion}</td>
          <td>${aporte.aporteValor}</td>
        </tr>
      `,
      )
      .join("\n");

    filledHtml = filledHtml.replace(
      /{{aportesResultadosPrograma}}/g,
      aportesHtml,
    );

    return filledHtml;
  }
}

export const syllabusPDFService = new SyllabusPDFService();
