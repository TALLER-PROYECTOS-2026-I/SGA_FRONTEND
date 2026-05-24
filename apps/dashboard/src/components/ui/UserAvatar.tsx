import { useState } from "react";
import { useUserPhoto } from "@/common/hooks/useUserPhoto";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserAvatar(props: React.HTMLAttributes<HTMLDivElement>) {
  const { data: photoUrl, isLoading } = useUserPhoto();
  const [imageError, setImageError] = useState(false);

  const shouldShowImage =
    !!photoUrl &&
    !imageError &&
    !String(photoUrl).startsWith("blob:");

  if (isLoading) {
    return (
      <Avatar {...props}>
        <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold">
          ...
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar {...props}>
      {shouldShowImage && (
        <AvatarImage
          src={photoUrl}
          alt="User photo"
          onError={() => setImageError(true)}
        />
      )}

      <AvatarFallback className="bg-slate-100 text-slate-700 font-semibold">
        U
      </AvatarFallback>
    </Avatar>
  );
}