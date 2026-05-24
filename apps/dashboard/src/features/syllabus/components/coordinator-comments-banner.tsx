import { AlertTriangle } from "lucide-react";

type CoordinatorCommentsBannerProps = {
  stepNumber: number;
  comments: string[];
};

export function CoordinatorCommentsBanner({
  stepNumber,
  comments,
}: CoordinatorCommentsBannerProps) {
  if (comments.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
          <AlertTriangle size={20} />
        </div>

        <div>
          <p className="text-sm font-bold text-red-800">
            Observación del coordinador
          </p>

          <div className="mt-2 space-y-2">
            {comments.map((comment, index) => (
              <p
                key={`${stepNumber}-comment-${index}`}
                className="text-sm text-red-700"
              >
                {comment}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
