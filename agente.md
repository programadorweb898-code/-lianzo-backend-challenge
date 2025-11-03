Objetivos principales
Diseñar y desarrollar una API estructurada, limpia y mantenible.
Implementar autenticación con JWT (mock o real, a elección).
Construir endpoints que permitan alimentar los datos de las siguientes vistas:
Auth -- Sign in
Project Overview
Pricing
Incluir documentación de la API (Swagger u OpenAPI).
Crear una base de datos (PostgreSQL preferido) con modelos consistentes.
Implementar validaciones, manejo de errores y controladores desacoplados.
Incluir tests automatizados de endpoints y servicios principales.
Stack técnica requerida
Node.js (versión 18 o superior)
NestJS (o Express.js con arquitectura modular)
TypeScript
PostgreSQL (puedes usar SQLite o un mock si prefieres simplificar)
ORM: Prisma o TypeORM
Autenticación JWT (login + logout + refresh)
Swagger u OpenAPI para documentar la API
Jest + Supertest para pruebas automáticas
Docker para contenedores
Endpoints mínimos requeridos
1. Autenticación (/auth)
POST /auth/login → Valida email y contraseña (mock o real).
POST /auth/register → Crea un usuario nuevo.
GET /auth/profile → Retorna datos del usuario autenticado.
2. Proyectos (/projects)
GET /projects → Lista de proyectos del usuario.
GET /projects/:id → Detalle de un proyecto (mock o real).
POST /projects → Crea un nuevo proyecto.
PATCH /projects/:id → Actualiza estado o datos del proyecto.
3. Planes (/pricing)
GET /pricing → Retorna los tres planes disponibles (Startup, Business, Enterprise).
POST /pricing/select → Simula la selección de un plan.
Testing
Incluye pruebas para las siguientes áreas: - Autenticación (login, registro, acceso protegido) - CRUD de proyectos - Endpoint de pricing - Validaciones y manejo de errores

Ejecutar tests:

npm run test
Evaluación
Criterio Descripción

Arquitectura Organización modular y separación de responsabilidades

Código limpio Uso correcto de TypeScript, convenciones, ESLint, Prettier

Documentación Swagger, README, ejemplos de uso

Testing Cobertura de pruebas y claridad de los casos

Seguridad Buenas prácticas en autenticación y manejo de datos

Performance Eficiencia y uso de asincronía

Escalabilidad Capacidad de extender la API fácilmente
Entrega
Crea un repositorio público en GitHub con el nombre lianzo-backend-challenge.

Incluye un README.md explicando tu arquitectura y decisiones técnicas.

Incluye el script para levantar el proyecto:

npm install
npm run start:dev
Incluye la documentación Swagger accesible en /api/docs.

Envía el enlace del repositorio al correo: kalebeoliveira.dev@gmail.com

