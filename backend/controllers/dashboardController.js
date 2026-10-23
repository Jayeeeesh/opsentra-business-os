const Project = require("../models/Project");

const getDashboardSummary = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedProjects = await Project.countDocuments({
      owner: req.user.id,
      status: "Completed",
    });
    const activeProjects = await Project.countDocuments({
      owner: req.user.id,
      status: "In Progress",
    });
    const highPriorityProjects = await Project.countDocuments({
      owner: req.user.id,
      priority: "High",
    });
    const overdueProjects = await Project.countDocuments({
      owner: req.user.id,
      status: { $ne: "Completed" },
      deadline: { $lt: today },
    });
    const totalProjects = await Project.countDocuments({ owner: req.user.id });

    return res.status(200).json({
      completedProjects,
      activeProjects,
      highPriorityProjects,
      overdueProjects,
      totalProjects,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getDashboardSummary };
