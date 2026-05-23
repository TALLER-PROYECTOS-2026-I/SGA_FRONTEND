import type {
  ActitudesData,
  CompetenciasData,
  ComponentesData,
} from "../hooks/third-step-query";
import type { DraftThirdStepData } from "./types";

export function buildThirdStepPayloadsFromDraft(data: DraftThirdStepData): {
  competencias: CompetenciasData;
  componentes: ComponentesData;
  actitudes: ActitudesData;
} {
  const showCodes = data.showCodes ?? false;

  const codePayload = (code: string) => {
    if (!showCodes) return {};
    const trimmed = code.trim();
    return trimmed ? { code: trimmed } : {};
  };

  const mapItems = (items: DraftThirdStepData["competencias"]) =>
    items.map((item, index) => ({
      text: item.text.trim(),
      ...codePayload(item.code),
      order: index + 1,
    }));

  return {
    competencias: { items: mapItems(data.competencias) },
    componentes: { items: mapItems(data.componentes) },
    actitudes: { items: mapItems(data.contenidosActitudinales) },
  };
}
