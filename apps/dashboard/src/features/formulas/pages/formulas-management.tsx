import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Calculator, Loader2, Plus, Sigma, Trash2, X } from "lucide-react";
import { getRoleName } from "../../../common/constants/roles";
import { useSession } from "../../auth/hooks/use-session";
import {
  useCatalogFormulas,
  useCreateCatalogFormula,
  useDeleteCatalogFormula,
  type FormulaCatalogItem,
  type FormulaCatalogTipo,
} from "../hooks/formulas-query";

type FormulaFilter = "TODAS" | FormulaCatalogTipo;

const initialForm = {
  tipo: "PE" as FormulaCatalogTipo,
  nombre: "",
  expresion: "",
  descripcion: "",
};

export default function FormulasManagement() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [filter, setFilter] = useState<FormulaFilter>("TODAS");
  const [form, setForm] = useState(initialForm);
  const [deleteTarget, setDeleteTarget] = useState<FormulaCatalogItem | null>(
    null,
  );

  const {
    data: formulas = [],
    isLoading,
    isError,
    error,
  } = useCatalogFormulas();
  const createFormula = useCreateCatalogFormula();
  const deleteFormula = useDeleteCatalogFormula();

  const roleName = getRoleName(user?.role);
  const canManage = roleName === "director_escuela";

  const filteredFormulas = useMemo(() => {
    if (filter === "TODAS") return formulas;
    return formulas.filter((formula) => formula.tipo === filter);
  }, [filter, formulas]);

  const peCount = formulas.filter((formula) => formula.tipo === "PE").length;
  const pfCount = formulas.filter((formula) => formula.tipo === "PF").length;

  if (!isSessionLoading && !canManage) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nombre = form.nombre.trim();
    const expresion = form.expresion.trim();
    const descripcion = form.descripcion.trim();

    if (!nombre || !form.tipo || !expresion) {
      toast.error("Nombre, tipo y expresion son obligatorios.");
      return;
    }

    try {
      await createFormula.mutateAsync({
        tipo: form.tipo,
        nombre,
        expresion,
        descripcion: descripcion || null,
        activo: true,
      });

      toast.success("Formula creada correctamente.");
      setForm(initialForm);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo crear la formula.",
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteFormula.mutateAsync(deleteTarget.id);
      toast.success("Formula eliminada correctamente.");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo eliminar la formula.",
      );
    }
  };

  if (isSessionLoading) {
    return (
      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
        <Loader2 size={18} className="animate-spin" />
        Validando acceso...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Formulas de evaluacion
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Administra las formulas PE y PF disponibles para el paso 6 del
            silabo.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:w-[360px]">
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase">Total</p>
            <p className="text-2xl font-bold text-gray-900">
              {formulas.length}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase">PE</p>
            <p className="text-2xl font-bold text-gray-900">{peCount}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase">PF</p>
            <p className="text-2xl font-bold text-gray-900">{pfCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-100 bg-white shadow-md overflow-hidden"
        >
          <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center">
              <Plus size={20} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Nueva formula</h2>
              <p className="text-sm text-gray-500">PE o PF</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Tipo
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["PE", "PF"] as FormulaCatalogTipo[]).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, tipo }))}
                    className={`h-11 rounded-xl border text-sm font-bold transition ${
                      form.tipo === tipo
                        ? "border-red-600 bg-red-50 text-red-700"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Nombre
              </label>
              <input
                value={form.nombre}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    nombre: event.target.value,
                  }))
                }
                className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                placeholder="Promedio de evaluaciones"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Expresion
              </label>
              <textarea
                value={form.expresion}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    expresion: event.target.value,
                  }))
                }
                className="min-h-28 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                placeholder="PE = (P1 + P2 + P3 + P4) / 4"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Descripcion
              </label>
              <textarea
                value={form.descripcion}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    descripcion: event.target.value,
                  }))
                }
                className="min-h-20 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                placeholder="Detalle opcional"
              />
            </div>

            <button
              type="submit"
              disabled={createFormula.isPending}
              className="w-full h-11 rounded-xl bg-red-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {createFormula.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Plus size={18} />
              )}
              Guardar
            </button>
          </div>
        </form>

        <section className="rounded-2xl border border-gray-100 bg-white shadow-md overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Calculator size={20} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">
                  Catalogo de formulas
                </h2>
                <p className="text-sm text-gray-500">
                  Formulas activas disponibles
                </p>
              </div>
            </div>

            <div className="flex rounded-xl border border-gray-200 bg-white p-1">
              {(["TODAS", "PE", "PF"] as FormulaFilter[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`h-9 px-4 rounded-lg text-xs font-bold transition ${
                    filter === item
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {isLoading && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Cargando formulas...
              </div>
            )}

            {isError && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error instanceof Error
                  ? error.message
                  : "No se pudieron cargar las formulas."}
              </div>
            )}

            {!isLoading && filteredFormulas.length === 0 && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-8 text-center">
                <Sigma size={32} className="mx-auto text-gray-400" />
                <p className="text-sm font-semibold text-gray-700 mt-3">
                  No hay formulas registradas.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {filteredFormulas.map((formula) => (
                <article
                  key={formula.id}
                  className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex h-7 items-center rounded-lg px-2.5 text-xs font-bold ${
                            formula.tipo === "PE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                          }`}
                        >
                          {formula.tipo}
                        </span>
                        <h3 className="font-bold text-gray-900 break-words">
                          {formula.nombre}
                        </h3>
                      </div>
                      <p className="mt-3 rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm font-semibold text-gray-800 break-words">
                        {formula.expresion}
                      </p>
                      {formula.descripcion && (
                        <p className="mt-2 text-sm text-gray-600 break-words">
                          {formula.descripcion}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(formula)}
                      className="h-10 w-10 shrink-0 rounded-xl border border-red-100 bg-white text-red-600 flex items-center justify-center hover:bg-red-50"
                      aria-label={`Eliminar ${formula.nombre}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">Eliminar formula</h2>
                <p className="text-sm text-gray-500">
                  Esta accion desactivara la formula.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="h-9 w-9 rounded-xl border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-700">
                ¿Seguro que deseas eliminar{" "}
                <span className="font-bold text-gray-900">
                  {deleteTarget.nombre}
                </span>
                ?
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteFormula.isPending}
                  className="h-10 px-4 rounded-xl bg-red-600 text-white text-sm font-bold flex items-center gap-2 hover:bg-red-700 disabled:opacity-60"
                >
                  {deleteFormula.isPending && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
