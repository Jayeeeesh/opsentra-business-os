const express = require("express");
const validateRequest = require("../middleware/validateRequest");
const {
  createProjectSchema,
  updateProjectSchema,
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

routes.get("/", getProjects);

routes.post("/", validateRequest(createProjectSchema), createProject);

routes.get("/:projectId", getProjectById);

routes.patch(
  "/:projectId",
  validateRequest(updateProjectSchema),
  updateProject,
);

routes.delete("/:projectId", deleteProject);

module.exports = routes;
