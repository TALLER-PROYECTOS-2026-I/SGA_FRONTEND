import {
  PROGRAMACION_STATUS_LABELS,
  PROGRAMACION_STATUS_STYLES,
  type ProgramacionStatus,
} from "../utils/programacion-status";

type ProgramacionStatusBadgeProps = {
  status: ProgramacionStatus;
  showDot?: boolean;
  className?: string;
};

export function ProgramacionStatusBadge({
  status,
  showDot = true,
  className = "",
}: ProgramacionStatusBadgeProps) {
  const styles = PROGRAMACION_STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${styles.badge} ${className}`}
    >
      {showDot ? (
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${styles.dot}`}
          aria-hidden
        />
      ) : null}
      {PROGRAMACION_STATUS_LABELS[status]}
    </span>
  );
}
