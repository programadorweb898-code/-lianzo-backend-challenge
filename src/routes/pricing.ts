import express from "express";
import { getPricingPlans, selectPlan } from "../controllers/pricing.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Pricing
 *   description: Endpoints de Planes de Precios
 */

router.use(authenticateToken);

/**
 * @swagger
 * /pricing:
 *   get:
 *     summary: Obtiene los planes de precios disponibles
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Una lista de planes de precios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   price:
 *                     type: string
 *                   features:
 *                     type: array
 *                     items:
 *                       type: string
 *       401:
 *         description: No autorizado
 */
router.get("/", getPricingPlans);

/**
 * @swagger
 * /pricing/select:
 *   post:
 *     summary: Selecciona un plan de precios
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 description: El ID del plan a seleccionar
 *     responses:
 *       200:
 *         description: Plan seleccionado exitosamente
 *       400:
 *         description: Solicitud incorrecta, ej. falta planId
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Plan no encontrado
 */
router.post("/select", selectPlan);

export default router;
