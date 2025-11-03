import { Router } from "express";
import authRoutes from "./auth";
import userRoutes from "./user.routes";
import projectRoutes from "./project";
import pricingRoutes from "./pricing";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/projects", projectRoutes);
router.use("/pricing", pricingRoutes);

export default router;
