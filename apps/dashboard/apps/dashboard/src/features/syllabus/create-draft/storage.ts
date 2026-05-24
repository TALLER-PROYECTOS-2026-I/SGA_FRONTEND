import { CREATE_DRAFT_STORAGE_KEY, type SyllabusCreateDraft } from "./types";

export function createEmptyDraft(): SyllabusCreateDraft {
  return {
    version: 1,
    generalData: null,
    sumilla: null,
    updatedAt: new Date().toISOString(),
  };
}

export function loadCreateDraft(): SyllabusCreateDraft | null {
  try {
    const raw = localStorage.getItem(CREATE_DRAFT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SyllabusCreateDraft;
    if (parsed?.version !== 1) return null;

    return parsed;
  } catch {
    return null;
  }
}

export function saveCreateDraft(draft: SyllabusCreateDraft): void {
  localStorage.setItem(
    CREATE_DRAFT_STORAGE_KEY,
    JSON.stringify({
      ...draft,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export function clearCreateDraftStorage(): void {
  localStorage.removeItem(CREATE_DRAFT_STORAGE_KEY);
}

export { CREATE_DRAFT_STORAGE_KEY };
