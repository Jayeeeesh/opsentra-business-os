const mongoose = require("mongoose");
const Project = require("../models/Project");

const requireProjectAccess = (allowedRoles) => {
  return async (req, res, next) => {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    try {
      const project = await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      const userId = String(req.user.id);

      const member = (project.members || []).find(
        (item) => String(item.user) === userId,
      );

      const role = String(project.owner) === userId ? "Owner" : member?.role;

      if (!role) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          message: "Access denied",
        });
      }

      req.project = project;
      req.projectRole = role;

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

module.exports = requireProjectAccess;
