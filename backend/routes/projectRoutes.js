const express = require("express");
const validateQuery = require("../middleware/validateQuery");
const validateRequest = require("../middleware/validateRequest");
const requireProjectAccess = require("../middleware/requireProjectAccess");
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

const {
  addProjectMember,
  updateMemberRole,
  removeProjectMember,
} = require("../controllers/projectMemberController");

const protect = require("../middleware/authMiddleware");

const routes = express.Router();

routes.use(protect);

// ========== PROJECT ROUTES ==========

routes.get("/", validateQuery(projectQuerySchema), getProjects);

routes.post("/", validateRequest(createProjectSchema), createProject);

routes.get(
  "/:projectId",
  requireProjectAccess(["Owner", "Editor", "Viewer"]),
  getProjectById,
);

routes.patch(
  "/:projectId",
  requireProjectAccess(["Owner"]),
  validateRequest(updateProjectSchema),
  updateProject,
);

// Only project owner can delete a project
routes.delete("/:projectId", requireProjectAccess(["Owner"]), deleteProject);

// ========== TASK ROUTES ==========

routes.post(
  "/:projectId/tasks",
  requireProjectAccess(["Owner", "Editor"]),
  validateRequest(createTaskSchema),
  createTask,
);

routes.get(
  "/:projectId/tasks",
  requireProjectAccess(["Owner", "Editor", "Viewer"]),
  getTasks,
);

routes.patch(
  "/:projectId/tasks/:taskId",
  requireProjectAccess(["Owner", "Editor"]),
  validateRequest(updateTaskSchema),
  updateTask,
);

routes.delete(
  "/:projectId/tasks/:taskId",
  requireProjectAccess(["Owner", "Editor"]),
  deleteTask,
);

// ========== MEMBER ROUTES ==========

routes.post(
  "/:projectId/members",
  requireProjectAccess(["Owner"]),
  addProjectMember,
);

routes.patch(
  "/:projectId/members/:userId",
  requireProjectAccess(["Owner"]),
  updateMemberRole,
);

routes.delete(
  "/:projectId/members/:userId",
  requireProjectAccess(["Owner"]),
  removeProjectMember,
);

module.exports = routes;
