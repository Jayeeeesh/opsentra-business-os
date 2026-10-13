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
const updateProjectSchema = createProjectSchema.partial();

module.exports = {
  createProjectSchema,
  updateProjectSchema,
};
