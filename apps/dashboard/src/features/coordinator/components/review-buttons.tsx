import { useState, useEffect } from "react";
import { Check, X, MessageSquare } from "lucide-react";

interface ReviewButtonsProps {
  fieldId: string;
  onStatusChange?: (
    fieldId: string,
    status: "approved" | "rejected" | null,
  ) => void;
  onCommentChange?: (fieldId: string, comment: string) => void;
  initialStatus?: "approved" | "rejected" | null;
  initialComment?: string;
}

export function ReviewButtons({
  fieldId,
  onStatusChange,
  onCommentChange,
  initialStatus = null,
  initialComment = "",
}: ReviewButtonsProps) {
  const [status, setStatus] = useState<"approved" | "rejected" | null>(
    initialStatus,
  );
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comment, setComment] = useState(initialComment);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    setComment(initialComment);

    if (initialComment && initialComment.trim() !== "") {
      setShowCommentBox(true);
    }
  }, [initialComment]);

  const handleApprove = () => {
    const newStatus = status === "approved" ? null : "approved";

    setStatus(newStatus);
    onStatusChange?.(fieldId, newStatus);
  };

  const handleReject = () => {
    const newStatus = status === "rejected" ? null : "rejected";

    setStatus(newStatus);
    onStatusChange?.(fieldId, newStatus);
  };

  const handleToggleComment = () => {
    setShowCommentBox((prev) => !prev);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newComment = e.target.value;

    setComment(newComment);
    onCommentChange?.(fieldId, newComment);
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-review-button="true"
          onClick={handleApprove}
          className={`h-10 w-10 rounded-xl transition-all flex items-center justify-center ${
            status === "approved"
              ? "bg-green-600 text-white shadow-md"
              : "bg-white text-green-600 border border-green-500 hover:bg-green-50"
          }`}
          title="Aprobar"
        >
          <Check size={18} />
        </button>

        <button
          type="button"
          data-review-button="true"
          onClick={handleReject}
          className={`h-10 w-10 rounded-xl transition-all flex items-center justify-center ${
            status === "rejected"
              ? "bg-red-600 text-white shadow-md"
              : "bg-white text-red-600 border border-red-500 hover:bg-red-50"
          }`}
          title="Rechazar"
        >
          <X size={18} />
        </button>

        <button
          type="button"
          data-review-button="true"
          onClick={handleToggleComment}
          className={`h-10 w-10 rounded-xl transition-all flex items-center justify-center ${
            showCommentBox || comment
              ? "bg-blue-600 text-white shadow-md"
              : "bg-white text-blue-600 border border-blue-500 hover:bg-blue-50"
          }`}
          title="Agregar comentario"
        >
          <MessageSquare size={18} />
        </button>

        {comment.trim() !== "" && !showCommentBox && (
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">
            Comentario agregado
          </span>
        )}
      </div>

      {showCommentBox && (
        <div className="mt-4 w-full max-w-xl rounded-2xl border border-gray-100 bg-white shadow-md overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">Comentario</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Agrega una observación para este campo o paso.
              </p>
            </div>

            <button
              type="button"
              data-review-button="true"
              onClick={handleToggleComment}
              className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors"
              title="Cerrar comentario"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-4">
            <textarea
              data-review-comment="true"
              value={comment}
              onChange={handleCommentChange}
              placeholder="Escribe un comentario..."
              rows={4}
              className="w-full min-h-[120px] px-4 py-3 border border-gray-200 rounded-xl resize-y outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-400"
              autoFocus
            />

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-400">
                El comentario se guarda automáticamente.
              </p>

              <button
                type="button"
                data-review-button="true"
                onClick={handleToggleComment}
                className="h-9 px-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-semibold"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
