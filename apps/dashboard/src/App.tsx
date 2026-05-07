// App.tsx
// Archivo principal de la aplicación.
// Aquí se configuran los providers globales y las rutas principales del sistema.

// =====================================================
// IMPORTS
// =====================================================

// Importa herramientas de react-router-dom.
// Permiten manejar la navegación entre páginas dentro de la aplicación.
import {
  // BrowserRouter habilita el uso de rutas en el navegador.
  BrowserRouter as Router,

  // Routes agrupa todas las rutas disponibles.
  Routes,

  // Route define una ruta específica y el componente que debe mostrarse.
  Route,

  // Navigate permite redirigir al usuario a otra ruta.
  Navigate,
} from "react-router-dom";

// Importa Toaster.
// Sirve para mostrar notificaciones emergentes dentro de la aplicación.
import { Toaster } from "sonner";

// Importa la página donde el usuario ve sus asignaciones o sílabos asignados.
import MyAssignmentsPage from "./features/assignments/pages/my-assignments";

// Importa la página de gestión para asignar docentes.
import ManagementPage from "./features/assignments/pages/management";

// Importa la página donde se muestran los sílabos aprobados.
import ApprovedSyllabiPage from "./features/assignments/pages/approved-syllabus";

// Importa la página del proceso para crear o editar un sílabo.
import SyllabusProcessPage from "./features/syllabus/pages/syllabus-process";

// Importa SessionProvider.
// Este provider permite compartir la sesión del usuario en toda la aplicación.
import { SessionProvider } from "./features/auth/contexts/session-provider";

// Importa CoordinatorProvider.
// Este provider permite compartir estados o datos relacionados con el módulo de coordinador.
import { CoordinatorProvider } from "./features/coordinator/contexts/coordinator-context";

// Importa MainLayout.
// Es el layout principal que envuelve las páginas con una estructura común.
import MainLayout from "./common/layouts/main-layout";

// Importa la página principal o página de inicio.
import { HomePage } from "./features/home";

// Importa la página de perfil del usuario.
import { ProfilePage } from "./features/auth";

// Importa herramientas de React Query.
// QueryClient crea el cliente de consultas.
// QueryClientProvider permite usar React Query en toda la aplicación.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// =====================================================
// IMPORTS DE PÁGINAS DEL COORDINADOR
// =====================================================

// Importa la página donde se listan los permisos del coordinador.
import PermissionsList from "./features/coordinator/pages/permissions-list";

// Importa la página donde se gestionan permisos.
import PermissionsManage from "./features/coordinator/pages/permissions-manage";

// Importa la página para enviar correos.
import SendEmail from "./features/coordinator/pages/send-email";

// Importa la página donde se listan los sílabos pendientes de revisión.
import ReviewSyllabusList from "./features/coordinator/pages/review-syllabus-list";

// Importa la página de detalle para revisar un sílabo específico.
import ReviewSyllabusDetail from "./features/coordinator/pages/review-syllabus-detail";

// Importa la página de resumen de revisión de un sílabo.
import ReviewSyllabusSummary from "./features/coordinator/pages/review-syllabus-summary";

// Importa la página del catálogo de sumillas.
import SyllabusCatalog from "./features/coordinator/pages/syllabus-catalog";

// Importa la página de seguimiento de sílabos.
import SyllabusTracking from "./features/coordinator/pages/syllabus-tracking";

// =====================================================
// CONFIGURACIÓN DE REACT QUERY
// =====================================================

// Crea una instancia de QueryClient.
// Este cliente administra las consultas, caché y estados de datos del servidor.
const queryClient = new QueryClient();

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

// App es el componente principal de la aplicación.
// Aquí se envuelven las rutas con los providers necesarios.
export default function App() {
  return (
    // Router habilita el sistema de rutas en toda la aplicación.
    <Router>
      {/* SessionProvider permite que las páginas accedan a la sesión del usuario. */}
      <SessionProvider>
        {/* QueryClientProvider habilita React Query en toda la aplicación. */}
        <QueryClientProvider client={queryClient}>
          {/* CoordinatorProvider comparte datos del módulo coordinador entre páginas. */}
          <CoordinatorProvider>
            {/* Toaster muestra notificaciones en la esquina superior derecha. */}
            <Toaster position="top-right" richColors closeButton />

            {/* Routes contiene todas las rutas disponibles de la aplicación. */}
            <Routes>
              {/* =====================================================
                  RUTAS GENERALES
                  ===================================================== */}

              {/* Ruta principal: muestra la página de inicio. */}
              <Route
                path="/"
                element={
                  <MainLayout title="Inicio">
                    <HomePage />
                  </MainLayout>
                }
              />

              {/* Ruta de mis asignaciones: muestra los sílabos o cursos asignados al usuario. */}
              <Route
                path="/mis-asignaciones"
                element={
                  <MainLayout title="Mis sílabos">
                    <MyAssignmentsPage />
                  </MainLayout>
                }
              />

              {/* Ruta de creación de sílabo: lleva al proceso para crear un nuevo curso o sílabo. */}
              <Route
                path="/syllabus"
                element={
                  <MainLayout title="Crear nuevo curso">
                    <SyllabusProcessPage />
                  </MainLayout>
                }
              />

              {/* Ruta de perfil: muestra la información del usuario. */}
              <Route
                path="/perfil"
                element={
                  <MainLayout title="Perfil">
                    <ProfilePage />
                  </MainLayout>
                }
              />

              {/* Ruta de gestión: permite asignar docentes. */}
              <Route
                path="/management"
                element={
                  <MainLayout title="Asignar Docente">
                    <ManagementPage />
                  </MainLayout>
                }
              />

              {/* Ruta de sílabos aprobados. */}
              <Route
                path="/approved-syllabus"
                element={
                  <MainLayout title="Sílabos Aprobados">
                    <ApprovedSyllabiPage />
                  </MainLayout>
                }
              />

              {/* Ruta alternativa para sílabos aprobados.
                  Lleva a la misma página que /approved-syllabus. */}
              <Route
                path="/silabus"
                element={
                  <MainLayout title="Sílabo Aprobados">
                    <ApprovedSyllabiPage />
                  </MainLayout>
                }
              />

              {/* =====================================================
                  RUTAS DEL COORDINADOR
                  ===================================================== */}

              {/* Ruta de asignaturas del coordinador. */}
              <Route
                path="/coordinator/assignments"
                element={
                  <MainLayout title="Asignaturas">
                    <HomePage />
                  </MainLayout>
                }
              />

              {/* Ruta para activar permisos. */}
              <Route
                path="/coordinator/permissions"
                element={
                  <MainLayout title="Activar Permisos">
                    <PermissionsList />
                  </MainLayout>
                }
              />

              {/* Ruta para gestionar permisos. */}
              <Route
                path="/coordinator/permissions/manage"
                element={
                  <MainLayout title="Gestionar Permisos">
                    <PermissionsManage />
                  </MainLayout>
                }
              />

              {/* Ruta para enviar correos. */}
              <Route
                path="/coordinator/send-email"
                element={
                  <MainLayout title="Enviar Correo">
                    <SendEmail />
                  </MainLayout>
                }
              />

              {/* Ruta que muestra la lista de sílabos pendientes o disponibles para revisión. */}
              <Route
                path="/coordinator/review-syllabus"
                element={
                  <MainLayout title="Revisión de Sílabos">
                    <ReviewSyllabusList />
                  </MainLayout>
                }
              />

              {/* Ruta dinámica para revisar un sílabo específico.
                  :id representa el identificador del sílabo en la URL. */}
              <Route
                path="/coordinator/review-syllabus/:id"
                element={
                  <MainLayout title="Revisar Sílabo">
                    <ReviewSyllabusDetail />
                  </MainLayout>
                }
              />

              {/* Ruta dinámica para ver el resumen de revisión de un sílabo específico. */}
              <Route
                path="/coordinator/review-syllabus/:id/summary"
                element={
                  <MainLayout title="Resumen de Revisión">
                    <ReviewSyllabusSummary />
                  </MainLayout>
                }
              />

              {/* Ruta del catálogo de sumillas. */}
              <Route
                path="/coordinator/syllabus-catalog"
                element={
                  <MainLayout title="Catálogo de Sumilla">
                    <SyllabusCatalog />
                  </MainLayout>
                }
              />

              {/* Ruta para hacer seguimiento del estado de los sílabos. */}
              <Route
                path="/coordinator/syllabus-tracking"
                element={
                  <MainLayout title="Seguimiento de Sílabos">
                    <SyllabusTracking />
                  </MainLayout>
                }
              />

              {/* =====================================================
                  RUTA DE RESPALDO
                  ===================================================== */}

              {/* Si el usuario entra a una ruta inexistente,
                  Navigate lo redirige automáticamente al inicio. */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CoordinatorProvider>
        </QueryClientProvider>
      </SessionProvider>
    </Router>
  );
}