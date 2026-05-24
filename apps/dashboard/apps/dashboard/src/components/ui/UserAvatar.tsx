import { useUserPhoto } from "@/common/hooks/useUserPhoto";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserAvatar(props: React.HTMLAttributes<HTMLDivElement>) {
  const { data: photoUrl, isLoading } = useUserPhoto();

  // Si está cargando, mostramos un placeholder
  if (isLoading) {
    return (
      <Avatar {...props}>
        <AvatarFallback>...</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar {...props}>
      <AvatarImage src={photoUrl || undefined} alt="User photo" />
      <AvatarFallback>
        {/* Mostrar iniciales o icono por defecto cuando no hay foto */}U
      </AvatarFallback>
    </Avatar>
  );
}
