import { getRoleName } from "../../../common/constants/roles";
import { useSession } from "../../auth/hooks/use-session";
import CoordinatorHome from "./coordinator-home";
import DirectorHome from "./director-home";
import TeacherHome from "./teacher-home";

export default function HomePage() {
  const { user } = useSession();
  const role = getRoleName(user?.role);

  const roleContent = {
    docente: <TeacherHome />,
    coordinadora_academica: <CoordinatorHome />,
    director_escuela: <DirectorHome />,
  } as const;

  return (
    <div>
      {roleContent[role as keyof typeof roleContent] ?? (
        <div className="p-6">
          <p className="text-gray-700">Rol no autorizado o sin contenido.</p>
        </div>
      )}
    </div>
  );
}
