import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import type {
  CurriculumCourse,
  CurriculumCourseCreate,
  CurriculumCourseUpdate,
} from "../hooks/curriculum-query";

type ModalMode = "create" | "edit";

type EditCurriculumCourseModalProps = {
  course: CurriculumCourse | null;
  open: boolean;
  mode: ModalMode;
  defaultPeriod: string;
  defaultCycle: number | null;
  isSaving?: boolean;
  isDeleting?: boolean;
  onClose: () => void;
  onSave: (
    payload: CurriculumCourseCreate | CurriculumCourseUpdate,
  ) => Promise<void> | void;
  onDelete?: (course: CurriculumCourse) => Promise<void> | void;
};

const MODALITIES = ["PRESENCIAL", "VIRTUAL", "SEMIPRESENCIAL"];

const AREAS = [
  "Matemática y Ciencias",
  "Estudios Generales",
  "Sistemas de Información",
  "Tecnologías de Información",
  "Ingeniería de Software",
  "Gestión de la Computación",
  "Investigación",
  "Electivos",
  "Formación Profesional",
];

const COURSE_TYPES = ["Obligatorio", "Electivo"];

function toPrerequisiteText(value: string[] | undefined) {
  return (value ?? []).join(", ");
}

function parsePrerequisites(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function EditCurriculumCourseModal({
  course,
  open,
  mode,
  defaultPeriod,
  defaultCycle,
  isSaving = false,
  isDeleting = false,
  onClose,
  onSave,
  onDelete,
}: EditCurriculumCourseModalProps) {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [ciclo, setCiclo] = useState<number | null>(defaultCycle);
  const [creditos, setCreditos] = useState(0);
  const [horasTeoria, setHorasTeoria] = useState(0);
  const [horasPractica, setHorasPractica] = useState(0);
  const [modalidad, setModalidad] = useState("PRESENCIAL");
  const [tipoCurso, setTipoCurso] = useState("Obligatorio");
  const [areaCurricular, setAreaCurricular] = useState("");
  const [prerrequisitos, setPrerrequisitos] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const title = useMemo(() => {
    return mode === "create"
      ? "Agregar curso a la malla"
      : "Modificar curso de la malla";
  }, [mode]);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && course) {
      setCodigo(course.codigo ?? "");
      setNombre(course.nombre ?? "");
      setCiclo(course.ciclo ?? null);
      setCreditos(course.creditos ?? 0);
      setHorasTeoria(course.horasTeoria ?? 0);
      setHorasPractica(course.horasPractica ?? 0);
      setModalidad(course.modalidad ?? "PRESENCIAL");
      setTipoCurso(course.tipoCurso ?? "Obligatorio");
      setAreaCurricular(course.areaCurricular ?? "");
      setPrerrequisitos(toPrerequisiteText(course.prerrequisitos));
      setConfirmDelete(false);
      return;
    }

    setCodigo("");
    setNombre("");
    setCiclo(defaultCycle);
    setCreditos(0);
    setHorasTeoria(0);
    setHorasPractica(0);
    setModalidad("PRESENCIAL");
    setTipoCurso("Obligatorio");
    setAreaCurricular("");
    setPrerrequisitos("");
    setConfirmDelete(false);
  }, [course, defaultCycle, mode, open]);

  if (!open) {
    return null;
  }

  const canSave =
    codigo.trim().length > 0 &&
    nombre.trim().length > 0 &&
    creditos >= 0 &&
    horasTeoria >= 0 &&
    horasPractica >= 0 &&
    !isSaving &&
    !isDeleting;

  const handleSubmit = async () => {
    if (!canSave) return;

    const payload = {
      periodo: defaultPeriod,
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      ciclo,
      creditos,
      horasTeoria,
      horasPractica,
      modalidad,
      tipoCurso: tipoCurso.trim() || null,
      areaCurricular: areaCurricular.trim() || null,
      prerrequisitos: parsePrerequisites(prerrequisitos),
    };

    await onSave(payload);
  };

  const handleDelete = async () => {
    if (!course || !onDelete) return;

    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    await onDelete(course);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-red-50 to-white px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase text-red-600">HU27</p>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {mode === "create"
                ? `Periodo ${defaultPeriod}`
                : `Código actual: ${course?.codigo ?? "-"}`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving || isDeleting}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-60"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-170px)] space-y-5 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-900">
                Código
              </label>
              <input
                value={codigo}
                onChange={(event) => setCodigo(event.target.value)}
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                placeholder="Ej. 09013707052"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-900">
                Ciclo
              </label>
              <select
                value={ciclo ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  setCiclo(value ? Number(value) : null);
                }}
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              >
                <option value="">Electivo / Sin ciclo</option>
                {Array.from({ length: 10 }, (_, index) => index + 1).map(
                  (item) => (
                    <option key={item} value={item}>
                      Ciclo {item}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-900">
              Nombre del curso
            </label>
            <input
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              placeholder="Nombre del curso"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-900">
                Créditos
              </label>
              <input
                type="number"
                min={0}
                value={creditos}
                onChange={(event) =>
                  setCreditos(Number(event.target.value || 0))
                }
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-900">
                HT
              </label>
              <input
                type="number"
                min={0}
                value={horasTeoria}
                onChange={(event) =>
                  setHorasTeoria(Number(event.target.value || 0))
                }
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-900">
                HP
              </label>
              <input
                type="number"
                min={0}
                value={horasPractica}
                onChange={(event) =>
                  setHorasPractica(Number(event.target.value || 0))
                }
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-900">
                Modalidad
              </label>
              <select
                value={modalidad}
                onChange={(event) => setModalidad(event.target.value)}
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              >
                {MODALITIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-900">
                Tipo
              </label>
              <select
                value={tipoCurso}
                onChange={(event) => setTipoCurso(event.target.value)}
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              >
                {COURSE_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-900">
                Área curricular
              </label>
              <select
                value={areaCurricular}
                onChange={(event) => setAreaCurricular(event.target.value)}
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              >
                <option value="">Sin área</option>
                {AREAS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-900">
              Prerrequisitos
            </label>
            <textarea
              value={prerrequisitos}
              onChange={(event) => setPrerrequisitos(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              placeholder="Separar por comas. Ej: Ingeniería de Software I, Inteligencia Artificial"
            />
            <p className="mt-1 text-xs text-gray-500">
              Usa comas para separar varios prerrequisitos.
            </p>
          </div>

          {mode === "edit" && confirmDelete && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
              <AlertTriangle className="mt-0.5 text-red-600" size={20} />
              <div>
                <p className="font-bold text-red-700">
                  Confirma que deseas quitar este curso
                </p>
                <p className="mt-1 text-sm text-red-600">
                  El curso será ocultado de la malla curricular, pero no se
                  eliminará físicamente de la base de datos.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50 px-6 py-5 sm:flex-row sm:justify-between">
          <div>
            {mode === "edit" && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving || isDeleting}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${
                  confirmDelete
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "border border-red-200 bg-white text-red-600 hover:bg-red-50"
                }`}
              >
                {isDeleting ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Trash2 size={17} />
                )}
                {confirmDelete ? "Confirmar quitar" : "Quitar curso"}
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isDeleting}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSave}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSaving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : mode === "create" ? (
                <Plus size={17} />
              ) : (
                <Save size={17} />
              )}
              {mode === "create" ? "Crear curso" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
