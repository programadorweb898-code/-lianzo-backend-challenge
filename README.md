# Desafío del Proyecto

Esta es una aplicación backend construida con Node.js, Express, TypeORM y TypeScript.

## Configuración

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/your-username/project-challenge.git
    cd project_challenge
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Variables de Entorno:**
    Crea un archivo `.env` en el directorio raíz basado en `.env-example`.

    ```
    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_NAME=your_db_name
    JWT_SECRET=your_jwt_secret
    JWT_REFRESH_SECRET=your_jwt_refresh_secret
    PORT=3000
    ```

4.  **Configuración de la Base de Datos:**
    Asegúrate de tener una base de datos PostgreSQL en funcionamiento y actualiza el archivo `.env` con tus credenciales de base de datos.

## Ejecutar la Aplicación

1.  **Iniciar el servidor:**
    ```bash
    npm start
    ```

    El servidor se ejecutará en el puerto especificado en tu archivo `.env` (por defecto: 3000).

## Documentación de la API

Accede a la documentación de la API (Swagger UI) en `/api/docs` una vez que el servidor esté en funcionamiento.

## Ejecutar Pruebas

```bash
npm test
```

## Estructura de Carpetas

```
/data/data/com.termux/files/home/project_challenge/
├───.env
├───.env-example
├───.gitignore
├───agente.md
├───jest.config.js
├───jest.setup.js
├───package-lock.json
├───package.json
├───README.md
├───swagger.config.ts
├───tsconfig.json
├───node_modules/...
└───src/
    ├───index.ts
    ├───config/
    │   └───data-source.ts
    ├───controllers/
    │   ├───auth.controller.ts
    │   ├───pricing.controller.ts
    │   ├───project.controller.ts
    │   └───user.controller.ts
    ├───entities/
    │   ├───Project.ts
    │   └───User.ts
    ├───middlewares/
    │   ├───auth.middleware.ts
    │   └───auth.validation.ts
    ├───routes/
    │   ├───auth.ts
    │   ├───index.ts
    │   ├───pricing.ts
    │   ├───project.ts
    │   └───user.routes.ts
    ├───tests/
    │   ├───integration/
    │   │   ├───auth.routes.test.ts
    │   │   ├───pricing.routes.test.ts
    │   │   ├───project.routes.test.ts
    │   │   └───user.routes.test.ts
    │   └───unit/
    │       ├───auth.controller.test.ts
    │       └───user.controller.test.ts
    └───types/
        └───express.d.ts
```