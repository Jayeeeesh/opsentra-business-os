const Project = require("../models/Project");

const getDashboardSummary = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Projects owned by or shared with the logged-in user
    const accessFilter = {
      $or: [{ owner: req.user.id }, { "members.user": req.user.id }],
    };

    const completedProjects = await Project.countDocuments({
      ...accessFilter,
      status: "Completed",
    });

    const activeProjects = await Project.countDocuments({
      ...accessFilter,
      status: "In Progress",
    });

    const highPriorityProjects = await Project.countDocuments({
      ...accessFilter,
      priority: "High",
    });

    const overdueProjects = await Project.countDocuments({
      ...accessFilter,
      status: { $ne: "Completed" },
      deadline: { $lt: today },
    });

    const totalProjects = await Project.countDocuments(accessFilter);

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
