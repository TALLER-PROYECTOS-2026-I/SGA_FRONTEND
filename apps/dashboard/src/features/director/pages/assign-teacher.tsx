import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE_URL;

type Teacher = {
  id: number;
  correo?: string;
  email?: string;
  nombre_docente?: string;
  nombreDocente?: string;
};

type Syllabus = {
  id: number;
  curso_codigo?: string;
  cursoCodigo?: string;
  curso_nombre?: string;
  cursoNombre?: string;
  name?: string;
  semestre_academico?: string;
  semestreAcademico?: string;
};

type NormalizedSyllabus = {
  id: number;
  cursoNombre: string;
  cursoCodigo: string;
  semestreAcademico: string;
};

export default function AssignTeacherPage() {
  const navigate = useNavigate();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);

  const [docenteId, setDocenteId] = useState("");
  const [searchCourse, setSearchCourse] = useState("");
  const [selectedSyllabusId, setSelectedSyllabusId] = useState("");
  const [periodoAcademico, setPeriodoAcademico] = useState("2026-I");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const teachersRes = await fetch(`${API}/teacher/`);
        if (!teachersRes.ok) {
          throw new Error(`Error cargando docentes: ${teachersRes.status}`);
        }
        const teachersData = await teachersRes.json();

        const syllabiRes = await fetch(`${API}/syllabus/revision`);
        if (!syllabiRes.ok) {
          throw new Error(`Error cargando sílabos: ${syllabiRes.status}`);
        }
        const syllabiData = await syllabiRes.json();

        const teacherItems = Array.isArray(teachersData?.data)
          ? teachersData.data
          : Array.isArray(teachersData)
            ? teachersData
            : [];

        const syllabusItems = Array.isArray(syllabiData?.data)
          ? syllabiData.data
          : Array.isArray(syllabiData)
            ? syllabiData
            : [];

        setTeachers(teacherItems);
        setSyllabi(syllabusItems);
      } catch (error) {
        console.error("Error cargando datos:", error);
        alert(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar docentes o sílabos",
        );
      }
    };

    loadData();
  }, []);

  const normalizedSyllabi: NormalizedSyllabus[] = useMemo(() => {
    return syllabi
      .map((s) => ({
        id: s.id,
        cursoNombre: (s.cursoNombre || s.curso_nombre || s.name || "").trim(),
        cursoCodigo: (s.cursoCodigo || s.curso_codigo || "").trim(),
        semestreAcademico: (
          s.semestreAcademico ||
          s.semestre_academico ||
          ""
        ).trim(),
      }))
      .filter(
        (s) =>
          Number.isFinite(s.id) &&
          s.id > 0 &&
          s.cursoNombre.length > 0 &&
          s.cursoCodigo.length > 0,
      );
  }, [syllabi]);

  const query = searchCourse.trim().toLowerCase();

  const filteredSyllabi = useMemo(() => {
    if (!query) return normalizedSyllabi;

    if (query.length < 5) return [];

    return normalizedSyllabi.filter(
      (s) =>
        s.cursoNombre.toLowerCase().includes(query) ||
        s.cursoCodigo.toLowerCase().includes(query),
    );
  }, [query, normalizedSyllabi]);

  useEffect(() => {
    if (query.length > 0 && query.length < 5) {
      setSelectedSyllabusId("");
      return;
    }

    if (
      selectedSyllabusId &&
      !filteredSyllabi.some((s) => String(s.id) === String(selectedSyllabusId))
    ) {
      setSelectedSyllabusId("");
    }
  }, [query, filteredSyllabi, selectedSyllabusId]);

  const selectedSyllabus = useMemo(() => {
    return filteredSyllabi.find(
      (s) => String(s.id) === String(selectedSyllabusId),
    );
  }, [selectedSyllabusId, filteredSyllabi]);

  const resetForm = () => {
    setDocenteId("");
    setSearchCourse("");
    setSelectedSyllabusId("");
    setPeriodoAcademico("2026-I");
    setMensaje("");
  };

  const clearTeacher = () => setDocenteId("");
  const clearCourseSearch = () => {
    setSearchCourse("");
    setSelectedSyllabusId("");
  };
  const clearMessage = () => setMensaje("");

  const handleSubmit = async () => {
    if (!docenteId) {
      alert("Seleccione un docente");
      return;
    }

    if (!selectedSyllabusId) {
      alert("Seleccione una asignatura");
      return;
    }

    if (!periodoAcademico) {
      alert("Seleccione un periodo académico");
      return;
    }

    if (mensaje.length > 400) {
      alert("El mensaje no puede superar los 400 caracteres");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/syllabus/assign-teacher`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          docenteId: Number(docenteId),
          silaboId: Number(selectedSyllabusId),
          periodoAcademico,
          mensaje,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = data?.message ?? "Error al asignar docente";
        alert(message);
        return;
      }

      alert("Docente asignado correctamente");
      resetForm();
      navigate("/");
    } catch (error) {
      console.error(error);
      alert("Error al asignar docente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-2 text-3xl font-bold text-slate-900">
        Asignar Docente
      </h1>
      <p className="mb-6 text-slate-500">
        Selecciona un docente y asígnalo a un sílabo académico
      </p>

      <div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-semibold text-slate-700">
              Seleccionar docente
            </label>
            <button
              type="button"
              onClick={clearTeacher}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              Borrar
            </button>
          </div>

          <select
            value={docenteId}
            onChange={(e) => setDocenteId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">Seleccione un docente</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.nombreDocente ||
                  teacher.nombre_docente ||
                  teacher.correo ||
                  teacher.email}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-semibold text-slate-700">
              Nombre de la asignatura
            </label>
            <button
              type="button"
              onClick={clearCourseSearch}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              Borrar
            </button>
          </div>

          <input
            type="text"
            value={searchCourse}
            onChange={(e) => setSearchCourse(e.target.value)}
            placeholder="Ingrese las primeras letras o código"
            className="mb-3 w-full rounded-xl border border-slate-300 px-4 py-3"
          />

          <select
            value={selectedSyllabusId}
            onChange={(e) => setSelectedSyllabusId(e.target.value)}
            disabled={query.length > 0 && query.length < 5}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">Seleccione una asignatura</option>
            {filteredSyllabi.map((syllabus) => (
              <option key={syllabus.id} value={syllabus.id}>
                {syllabus.cursoNombre}
              </option>
            ))}
          </select>

          {searchCourse.trim().length > 0 && searchCourse.trim().length < 5 && (
            <p className="mt-2 text-sm text-amber-600">
              Ingrese al menos 5 caracteres para realizar la búsqueda.
            </p>
          )}

          {searchCourse.trim().length >= 5 && filteredSyllabi.length === 0 && (
            <p className="mt-2 text-sm text-slate-500">
              No se encontraron asignaturas con ese criterio.
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Código de Asignatura
          </label>
          <input
            type="text"
            value={selectedSyllabus?.cursoCodigo ?? ""}
            readOnly
            className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-600"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Periodo Académico
          </label>
          <select
            value={periodoAcademico}
            onChange={(e) => setPeriodoAcademico(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="2026-I">2026-I</option>
            <option value="2026-II">2026-II</option>
          </select>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-semibold text-slate-700">
              Mensaje al Docente
            </label>
            <button
              type="button"
              onClick={clearMessage}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              Borrar
            </button>
          </div>

          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            maxLength={400}
            rows={5}
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
            placeholder="Ingrese un mensaje personalizado"
          />
          <p className="mt-2 text-right text-sm text-slate-500">
            {mensaje.length}/400
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="rounded-xl border border-red-300 px-5 py-3 text-red-600 hover:bg-red-50"
          >
            Borrar datos
          </button>

          <button
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-300 px-5 py-3 text-slate-700 hover:bg-slate-50"
          >
            Volver
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-xl bg-red-600 px-5 py-3 text-white hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
