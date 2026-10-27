const express = require("express");
const validateQuery = require("../middleware/validateQuery");
const validateRequest = require("../middleware/validateRequest");
const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

const {
  createTaskSchema,
  updateTaskSchema,
} = require("../validation/taskValidation");

const {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
} = require("../validation/projectValidation");

const {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

const protect = require("../middleware/authMiddleware");

const routes = express.Router();

routes.use(protect);

routes.get("/", validateQuery(projectQuerySchema), getProjects);

routes.post("/", validateRequest(createProjectSchema), createProject);

routes.get("/:projectId", getProjectById);

routes.patch(
  "/:projectId",
  validateRequest(updateProjectSchema),
  updateProject,
);

routes.delete("/:projectId", deleteProject);

routes.post("/:projectId/tasks", validateRequest(createTaskSchema), createTask);

routes.get("/:projectId/tasks", getTasks);

routes.patch(
  "/:projectId/tasks/:taskId",
  validateRequest(updateTaskSchema),
  updateTask,
);

routes.delete("/:projectId/tasks/:taskId", deleteTask);

module.exports = routes;
