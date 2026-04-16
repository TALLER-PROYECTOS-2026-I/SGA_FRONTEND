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

        // ⚠️ CAMBIA ESTA RUTA POR LA QUE SÍ EXISTA EN TU BACKEND
        // Ejemplo temporal: syllabus/revision
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

  const normalizedSyllabi = useMemo(() => {
    return syllabi.map((s) => ({
      id: s.id,
      cursoNombre: s.cursoNombre || s.curso_nombre || s.name || "",
      cursoCodigo: s.cursoCodigo || s.curso_codigo || "",
      semestreAcademico: s.semestreAcademico || s.semestre_academico || "",
    }));
  }, [syllabi]);

  const filteredSyllabi = useMemo(() => {
    if (!searchCourse.trim()) return normalizedSyllabi;

    return normalizedSyllabi.filter((s) =>
      s.cursoNombre.toLowerCase().includes(searchCourse.toLowerCase()),
    );
  }, [searchCourse, normalizedSyllabi]);

  const selectedSyllabus = useMemo(() => {
    return normalizedSyllabi.find(
      (s) => String(s.id) === String(selectedSyllabusId),
    );
  }, [selectedSyllabusId, normalizedSyllabi]);

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

        if (message.toLowerCase().includes("ya está asignado")) {
          setDocenteId("");
          setSearchCourse("");
          setSelectedSyllabusId("");
          setPeriodoAcademico("2026-I");
          setMensaje("");
          navigate("/");
        }

        return;
      }

      alert("Docente asignado correctamente");

      setDocenteId("");
      setSearchCourse("");
      setSelectedSyllabusId("");
      setPeriodoAcademico("2026-I");
      setMensaje("");

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
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Seleccionar docente
          </label>
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
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Nombre de la asignatura
          </label>
          <input
            type="text"
            value={searchCourse}
            onChange={(e) => setSearchCourse(e.target.value)}
            placeholder="Ingrese las primeras letras"
            className="mb-3 w-full rounded-xl border border-slate-300 px-4 py-3"
          />

          <select
            value={selectedSyllabusId}
            onChange={(e) => setSelectedSyllabusId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">Seleccione una asignatura</option>
            {filteredSyllabi.map((syllabus) => (
              <option key={syllabus.id} value={syllabus.id}>
                {syllabus.cursoNombre}
              </option>
            ))}
          </select>
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
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Mensaje al Docente
          </label>
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
