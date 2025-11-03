import { Request, Response } from "express";

const plans = [
  {
    id: "startup",
    name: "Startup",
    price: "$10/month",
    features: ["10 projects", "5 users", "Basic analytics"],
  },
  {
    id: "business",
    name: "Business",
    price: "$50/month",
    features: ["Unlimited projects", "20 users", "Advanced analytics", "Support"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Contact us",
    features: ["Unlimited everything", "Dedicated support", "Custom integrations"],
  },
];

export const getPricingPlans = (req: Request, res: Response) => {
  res.status(200).json(plans);
};

export const selectPlan = (req: Request, res: Response) => {
  const { planId } = req.body;
  if (!planId) {
    return res.status(400).json({ message: "El planId es requerido" });
  }

  const planExists = plans.some(p => p.id === planId);
  if (!planExists) {
    return res.status(404).json({ message: "Plan no encontrado" });
  }
  
  res.status(200).json({ message: `Plan seleccionado exitosamente: ${planId}` });
};