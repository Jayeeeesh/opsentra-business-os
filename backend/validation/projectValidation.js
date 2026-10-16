const { z } = require("zod");

const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required"),
  client: z.string().trim().min(1, "Client name is required"),

  status: z
    .enum(["Planning", "In Progress", "On Hold", "Completed"])
    .optional(),

  priority: z.enum(["Low", "Medium", "High"]).optional(),

  deadline: z.coerce.date(),

  budget: z.number().min(1, "Budget must be at least 1"),

  progress: z.number().min(0).max(100).optional(),

  description: z.string().trim().optional(),
});
const projectQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),

  search: z.string().trim().max(100).optional(),

  status: z
    .enum(["All", "Planning", "In Progress", "On Hold", "Completed"])
    .optional(),

  priority: z.enum(["All", "Low", "Medium", "High"]).optional(),

  sort: z
    .enum(["newest", "oldest", "deadline-soonest", "budget-high", "budget-low"])
    .optional(),
});
const updateProjectSchema = createProjectSchema.partial();

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
};
