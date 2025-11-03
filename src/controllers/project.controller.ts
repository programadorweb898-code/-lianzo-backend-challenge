import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Project } from "../entities/Project";
import { User } from "../entities/User";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

export const getProjects = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectRepository = AppDataSource.getRepository(Project);
    const projects = await projectRepository.find({
      where: { user: { id: req.user!.userId } },
    });
    res.status(200).json(projects);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }
};

export const getProjectById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const projectRepository = AppDataSource.getRepository(Project);
    const project = await projectRepository.findOne({
      where: { id, user: { id: req.user!.userId } },
    });

    if (!project) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    res.status(200).json(project);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }
};

export const createProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    const projectRepository = AppDataSource.getRepository(Project);
    
    const user = await AppDataSource.getRepository(User).findOneBy({ id: req.user!.userId });

    if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const newProject = projectRepository.create({
      name,
      description,
      user,
    });

    await projectRepository.save(newProject);
    res.status(201).json(newProject);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }
};

export const updateProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const projectRepository = AppDataSource.getRepository(Project);

    const project = await projectRepository.findOne({
        where: { id, user: { id: req.user!.userId } },
    });

    if (!project) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    project.name = name ?? project.name;
    project.description = description ?? project.description;

    await projectRepository.save(project);
    res.status(200).json(project);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }
};