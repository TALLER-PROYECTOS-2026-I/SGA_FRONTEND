# SGA Frontend - Informe Operativo, Nube y Desarrollo

Este documento resume que contiene el frontend, que archivos deben revisar los equipos y que se debe configurar para trabajar localmente, en GitHub y en Azure Static Web Apps.

## Resumen Ejecutivo

El frontend es un monorepo npm workspaces con dos aplicaciones Vite + React:

- `apps/login`: pantalla de inicio de sesion con Microsoft.
- `apps/dashboard`: aplicacion principal por roles para docentes, coordinacion y direccion.

Estado actual validado:

- Login y dashboard compilan correctamente.
- React y React DOM quedaron alineados en la misma version para evitar pantalla blanca.
- Existen scripts para ejecutar ambas aplicaciones juntas o por separado.
- Los workflows de Azure Static Web Apps construyen desde el root para respetar workspaces.
- Login y dashboard tienen configuracion SPA para Azure Static Web Apps.
- Dashboard acepta el token emitido por backend y valida sesion contra `/api/auth/me`.

## Stack Tecnico

- Framework: React.
- Bundler: Vite.
- Lenguaje: TypeScript.
- Estilos: Tailwind CSS.
- Estado remoto/cache: TanStack React Query.
- Auth Microsoft: MSAL Browser / MSAL React.
- Monorepo: npm workspaces.
- Node.js esperado: 22 recomendado, compatible con `>=20.19.0`.
- Deploy: Azure Static Web Apps + GitHub Actions.

Archivos principales:

- `package.json`: workspaces, scripts globales y dependencias compartidas.
- `package-lock.json`: lockfile comun del monorepo.
- `apps/login/package.json`: scripts y dependencias de login.
- `apps/dashboard/package.json`: scripts y dependencias de dashboard.
- `apps/login/src/main.tsx`: configuracion MSAL de login.
- `apps/login/src/components/login/Login.tsx`: flujo de login y envio de token al backend.
- `apps/login/src/hooks/api/login.ts`: llamada a `/auth/login`.
- `apps/dashboard/src/main.tsx`: configuracion MSAL de dashboard.
- `apps/dashboard/src/features/auth/contexts/session-provider.tsx`: lectura de token, validacion de sesion y estado global.
- `apps/dashboard/src/features/auth/services/auth-service.ts`: llamada a `/auth/me`.
- `apps/dashboard/src/common/constants/roles.ts`: mapeo de roles usado por la UI.
- `apps/login/public/staticwebapp.config.json`: fallback SPA de login.
- `apps/dashboard/public/staticwebapp.config.json`: fallback SPA de dashboard.
- `.github/workflows/*`: despliegue a Azure Static Web Apps.

## Aplicaciones

### Login

Ubicacion:

- `apps/login`

Responsabilidad:

- Muestra inicio de sesion.
- Usa MSAL para autenticarse contra Microsoft Entra ID.
- Obtiene token Microsoft.
- Envia token al backend en `/api/auth/login`.
- Recibe redireccion hacia dashboard con JWT interno.

Variables Vite:

```text
VITE_AZURE_CLIENT_ID
VITE_AZURE_AUTHORITY
VITE_REDIRECT_URI
VITE_API_BASE_URL
VITE_AZURE_API_SCOPE
```

### Dashboard

Ubicacion:

- `apps/dashboard`

Responsabilidad:

- Recibe token desde login.
- Valida sesion con backend.
- Renderiza vistas segun rol.
- Consume endpoints de silabo, permisos, assignments, teacher y director.
- Permite generar/visualizar flujos de silabo y subir silabos firmados.

Variables Vite:

```text
VITE_AZURE_CLIENT_ID
VITE_AZURE_AUTHORITY
VITE_REDIRECT_URI
VITE_API_BASE_URL
VITE_AZURE_API_SCOPE
VITE_REDIRECT_LOGIN
```

## Ejecucion Local para Desarrolladores

### Requisitos

Instalar:

- Node.js 22 recomendado.
- npm.
- Backend levantado en `http://localhost:7071/api`, salvo que se configure otro puerto.

Instalacion:

```powershell
cd C:\TallerProyectos\SGA_FRONTEND
npm install
```

### Configuracion Local Login

Crear o revisar:

- `apps/login/.env`

Ejemplo:

```text
VITE_AZURE_CLIENT_ID=client-id-de-entra
VITE_AZURE_AUTHORITY=https://login.microsoftonline.com/tenant-id
VITE_REDIRECT_URI=http://localhost:5173
VITE_API_BASE_URL=http://localhost:7071/api
VITE_AZURE_API_SCOPE=api://client-id/access_as_user
```

### Configuracion Local Dashboard

Crear o revisar:

- `apps/dashboard/.env`

Ejemplo:

```text
VITE_AZURE_CLIENT_ID=client-id-de-entra
VITE_AZURE_AUTHORITY=https://login.microsoftonline.com/tenant-id
VITE_REDIRECT_URI=http://localhost:5174
VITE_API_BASE_URL=http://localhost:7071/api
VITE_AZURE_API_SCOPE=api://client-id/access_as_user
VITE_REDIRECT_LOGIN=http://localhost:5173
```

### Levantar Frontend

Login solamente:

```powershell
npm run dev:login
```

URL:

```text
http://localhost:5173
```

Dashboard solamente:

```powershell
npm run dev:dashboard
```

URL:

```text
http://localhost:5174
```

Ambos a la vez:

```powershell
npm run dev:frontend
```

Alias equivalente:

```powershell
npm run dev:all
```

### Levantar Todo Localmente

Usar dos terminales:

Terminal 1:

```powershell
cd C:\TallerProyectos\SGA_BACKEND
npm run start
```

Terminal 2:

```powershell
cd C:\TallerProyectos\SGA_FRONTEND
npm run dev:frontend
```

URLs:

```text
Backend:   http://localhost:7071/api
Login:     http://localhost:5173
Dashboard: http://localhost:5174
```

## Validacion Local

Build por aplicacion:

```powershell
npm run build:login
npm run build:dashboard
```

Build de todos los workspaces:

```powershell
npm run build --workspaces --if-present
```

Preview despues de build:

```powershell
npm run preview:login
npm run preview:dashboard
```

Puertos preview:

```text
Login preview:     http://localhost:5001
Dashboard preview: http://localhost:5002
```

## GitHub y CI/CD

Workflows:

- `.github/workflows/azure-static-web-apps-lemon-moss-0c832d30f.yml`
- `.github/workflows/azure-static-web-apps-zealous-forest-09c221e0f.yml`

Responsabilidad:

- Uno despliega login.
- Uno despliega dashboard.
- Ambos corren sobre rama `test`.
- Ambos usan Node.js 22.
- Ambos construyen desde el root del repo para que npm workspaces instale correctamente.
- Cada uno inyecta `.env` temporal dentro de su app antes de construir.

Configuracion de build:

Login:

```text
app_location=.
output_location=apps/login/dist
app_build_command=npm run build:login
```

Dashboard:

```text
app_location=.
output_location=apps/dashboard/dist
app_build_command=npm run build:dashboard
```

## Consideraciones para Nube y DevSecOps

### Azure Static Web Apps

Se recomienda usar dos Static Web Apps separadas:

- Una para login.
- Una para dashboard.

Cada una debe tener su token de despliegue:

- `AZURE_STATIC_WEB_APPS_API_TOKEN_LEMON_MOSS_0C832D30F`
- `AZURE_STATIC_WEB_APPS_API_TOKEN_ZEALOUS_FOREST_09C221E0F`

Secrets esperados:

```text
VITE_AZURE_CLIENT_ID
VITE_AZURE_AUTHORITY
VITE_LOGIN_REDIRECT_URI
VITE_DASHBOARD_REDIRECT_URI
VITE_REDIRECT_URI
VITE_API_BASE_URL
VITE_AZURE_API_SCOPE
VITE_REDIRECT_LOGIN
AZURE_STATIC_WEB_APPS_API_TOKEN_LEMON_MOSS_0C832D30F
AZURE_STATIC_WEB_APPS_API_TOKEN_ZEALOUS_FOREST_09C221E0F
```

Notas:

- `VITE_API_BASE_URL` debe apuntar al backend publicado, por ejemplo `https://<function-app>.azurewebsites.net/api`.
- `VITE_REDIRECT_LOGIN` debe apuntar a la URL publica del login.
- `VITE_LOGIN_REDIRECT_URI` debe coincidir con la redirect URI registrada en Microsoft Entra ID.
- `VITE_DASHBOARD_REDIRECT_URI` debe coincidir con la redirect URI registrada en Microsoft Entra ID.

### Microsoft Entra ID

Revisar en App Registration:

- Redirect URI login local: `http://localhost:5173`
- Redirect URI dashboard local: `http://localhost:5174`
- Redirect URI login nube: URL publica de Static Web App login.
- Redirect URI dashboard nube: URL publica de Static Web App dashboard.
- Exposed API scope si se usa `VITE_AZURE_API_SCOPE`.
- Permisos Microsoft Graph si se requiere foto/correo.

Notas funcionales:

- Si Graph devuelve `403` o `404` para foto, la UI debe seguir funcionando.
- Envio de correo por Graph depende de permisos y mailbox habilitado; no es solo tema de frontend.

### CORS

El backend debe permitir:

- URL local login.
- URL local dashboard.
- URL publica login.
- URL publica dashboard.

Esto se configura del lado del backend/Azure Functions con `CORS_ALLOWED_ORIGINS` o configuracion CORS de Azure segun despliegue.

## Archivos que Deben Revisar por Rol

### Nube/DevSecOps

- `.github/workflows/azure-static-web-apps-lemon-moss-0c832d30f.yml`
- `.github/workflows/azure-static-web-apps-zealous-forest-09c221e0f.yml`
- `apps/login/public/staticwebapp.config.json`
- `apps/dashboard/public/staticwebapp.config.json`
- Secrets de GitHub.
- App Registration de Microsoft Entra ID.
- URLs publicas de Static Web Apps.
- CORS del backend.

### Desarrolladores Frontend

- `package.json`
- `apps/login/src/main.tsx`
- `apps/login/src/components/login/Login.tsx`
- `apps/login/src/hooks/api/login.ts`
- `apps/dashboard/src/main.tsx`
- `apps/dashboard/src/features/auth/contexts/session-provider.tsx`
- `apps/dashboard/src/features/auth/services/auth-service.ts`
- `apps/dashboard/src/common/constants/roles.ts`
- `apps/dashboard/src/features/*`

## Funcionalidades Frontend Existentes

Login:

- Inicio de sesion Microsoft.
- Envio de token Microsoft al backend.
- Redireccion al dashboard con sesion del sistema.

Dashboard:

- Home por rol.
- Perfil.
- Flujo de silabo.
- Revision de silabos.
- Catalogo de silabos.
- Permisos.
- Asignaciones.
- Carga de silabo firmado para director.
- Generacion/visualizacion de PDF de silabo.

## Riesgos y Pendientes Conocidos

- No existen `.env.example` versionados actualmente para login y dashboard. Los valores esperados estan documentados en este archivo.
- El mapeo de roles se mantiene segun decision actual del proyecto. No se corrigio la inconsistencia ya identificada porque no esta bloqueando el flujo validado.
- Algunas vistas pueden depender de datos reales en base de datos; para pruebas locales usar el seed del backend.
- Funciones que usan Microsoft Graph pueden requerir permisos adicionales en Entra ID o mailbox habilitado.

## Checklist de Entrega Frontend

Para desarrolladores:

- Ejecutar `npm install`.
- Crear `apps/login/.env`.
- Crear `apps/dashboard/.env`.
- Levantar backend.
- Ejecutar `npm run dev:frontend`.
- Probar login Microsoft.
- Confirmar llegada al dashboard.
- Probar vistas principales por rol con datos seed.

Para DevSecOps/Nube:

- Confirmar dos Static Web Apps o estrategia equivalente.
- Configurar tokens de despliegue.
- Configurar secrets Vite.
- Configurar redirect URIs en Entra ID.
- Configurar CORS en backend.
- Ejecutar workflows.
- Validar que login redirige a dashboard publicado.
- Validar que dashboard consume backend publicado.
