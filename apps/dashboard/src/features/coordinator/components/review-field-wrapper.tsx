import React from "react";
import { useReviewMode } from "../contexts/review-mode-context";
import { ReviewButtons } from "./review-buttons";

interface ReviewFieldWrapperProps {
  fieldId: string;
  children: React.ReactNode;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export const ReviewFieldWrapper: React.FC<ReviewFieldWrapperProps> = ({
  fieldId,
  children,
  className = "",
  orientation = "horizontal",
}) => {
  const { isReviewMode, onFieldReview, onFieldComment, reviewData } =
    useReviewMode();

  if (!isReviewMode) {
    return <>{children}</>;
  }

  const fieldReviewData = reviewData?.[fieldId];
  const initialStatus = fieldReviewData?.status || null;
  const initialComment = fieldReviewData?.comment || "";

  const reviewButtons = (
    <ReviewButtons
      fieldId={fieldId}
      onStatusChange={onFieldReview}
      onCommentChange={onFieldComment}
      initialStatus={initialStatus}
      initialComment={initialComment}
    />
  );

  if (orientation === "vertical") {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="w-full">{children}</div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Revisión del campo
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Aprueba, rechaza o agrega una observación.
              </p>
            </div>

            {reviewButtons}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 items-start ${className}`}
    >
      <div className="min-w-0">{children}</div>

      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Revisión
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Marca el estado del campo.
            </p>
          </div>

          {reviewButtons}
        </div>
      </div>
    </div>
  );
};
