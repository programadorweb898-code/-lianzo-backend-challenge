import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

export const register = async (req: Request, res: Response) => {
  const { nombre, email, password } = req.body;

  try {
    const userExists = await AppDataSource.getRepository(User).findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: "El email ya está en uso" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = AppDataSource.getRepository(User).create({
      nombre,
      email,
      password: hashedPassword,
    });

    await AppDataSource.getRepository(User).save(newUser);

    return res.status(201).json({ message: "Usuario creado exitosamente" });

  } catch (error) {
    console.error("Error en el registro:", error);
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await AppDataSource.getRepository(User).findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET no está definido en las variables de entorno.");
    }
    const accessToken = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: "1h" });

    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!jwtRefreshSecret) {
      throw new Error("JWT_REFRESH_SECRET no está definido en las variables de entorno.");
    }
    const refreshToken = jwt.sign({ userId: user.id }, jwtRefreshSecret, { expiresIn: "7d" });

    user.refreshToken = refreshToken;
    await AppDataSource.getRepository(User).save(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ accessToken });

  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }
  }
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "No autorizado: No se proporcionó token de actualización" });
  }

  try {
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!jwtRefreshSecret) {
      throw new Error("JWT_REFRESH_SECRET no está definido en las variables de entorno.");
    }

    const decoded: any = jwt.verify(refreshToken, jwtRefreshSecret);

    const user = await AppDataSource.getRepository(User).findOne({ where: { id: decoded.userId } });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "No autorizado: Token de actualización inválido" });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET no está definido en las variables de entorno.");
    }
    const newAccessToken = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: "1h" });

    const newRefreshToken = jwt.sign({ userId: user.id }, jwtRefreshSecret, { expiresIn: "7d" });

    user.refreshToken = newRefreshToken;
    await AppDataSource.getRepository(User).save(user);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ accessToken: newAccessToken });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ message: "No autorizado: Token de actualización inválido o expirado" });
    }
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }
  }
};

export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(204).send();
  }

  try {
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!jwtRefreshSecret) {
      throw new Error("JWT_REFRESH_SECRET no está definido en las variables de entorno.");
    }

    const decoded: any = jwt.verify(refreshToken, jwtRefreshSecret);

    const user = await AppDataSource.getRepository(User).findOne({ where: { id: decoded.userId } });

    if (user) {
      user.refreshToken = undefined;
      await AppDataSource.getRepository(User).save(user);
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(204).send();

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
      return res.status(204).send();
    }
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: "No autorizado: Usuario no autenticado" });
  }

  try {
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: req.user.userId },
      select: ["id", "nombre", "email", "createdAt", "updatedAt"],
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.status(200).json(user);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  }
};
