const { z } = require("zod");

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(120),

  description: z.string().trim().max(2000).optional(),

  status: z.enum(["To Do", "In Progress", "Completed"]).optional(),

  priority: z.enum(["Low", "Medium", "High"]).optional(),

  dueDate: z.coerce.date().optional(),
});

const updateTaskSchema = createTaskSchema.partial();

module.exports = {
  createTaskSchema,
  updateTaskSchema,
};
