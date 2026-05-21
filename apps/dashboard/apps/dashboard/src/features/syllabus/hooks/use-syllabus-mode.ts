import { useSearchParams } from "react-router-dom";

export type SyllabusMode = "create" | "edit";

export const useSyllabusMode = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const codigo = searchParams.get("codigo");
  const id = searchParams.get("id");
  const mode = (searchParams.get("mode") as SyllabusMode) || "create";

  const syllabusId = id ? Number(id) : null;
  const isCreating = mode === "create" && !syllabusId;
  const isContinuing = mode === "create" && !!syllabusId;
  const isEditing = mode === "edit";

  const updateUrlWithId = (newId: number) => {
    setSearchParams({
      codigo: codigo || "",
      id: String(newId),
      mode: "create",
    });
  };

  return {
    codigo,
    syllabusId,
    mode,
    isCreating,
    isContinuing,
    isEditing,
    updateUrlWithId,
  };
};
