import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const validateRegister = [
  body("nombre")
    .trim()
    .notEmpty().withMessage("El nombre es requerido"),

  body("email")
    .isEmail().withMessage("Debe ser un email válido")
    .normalizeEmail(),

  body("password")
    .trim()
    .notEmpty().withMessage("La contraseña es requerida")
    .isLength({ min: 8, max: 20 }).withMessage("La contraseña debe tener entre 8 y 20 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .withMessage("La contraseña debe contener al menos una mayúscula, una minúscula y un número"),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateLogin = [
  body("email")
    .isEmail().withMessage("Debe ser un email válido")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("La contraseña es requerida"),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];