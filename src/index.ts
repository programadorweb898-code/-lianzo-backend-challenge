import "reflect-metadata";
import express,{Request,Response} from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import { AppDataSource } from "./config/data-source";

import router from "./routes/user.routes";
import routes from "./routes/auth";
import pricing from "./routes/pricing";
import project from "./routes/project";
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from '../swagger.config';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api", routes);
app.use("/",router);
app.use("/api/pricing",pricing);
app.use("/api/projects",project);

AppDataSource.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Conexión establecida y servidor corriendo en el puerto ${PORT}`);
    });
  })
  .catch((error: any) => console.error("Error al inicializar la base de datos: ", error.message));