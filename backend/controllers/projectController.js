const mongoose = require("mongoose");
const Project = require("../models/Project");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "All",
      priority = "All",
      sort = "newest",
    } = req.validatedQuery;

    const skip = (page - 1) * limit;

    const filter = {
      owner: req.user.id,
    };
    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      "deadline-soonest": { deadline: 1 },
      "budget-high": { budget: -1 },
      "budget-low": { budget: 1 },
    };

    const sortOption = sortOptions[sort] || sortOptions.newest;
    if (search) {
      const escapedSearch = escapeRegex(search);

      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { client: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    if (status && status !== "All") {
      filter.status = status;
    }
    if (priority && priority !== "All") {
      filter.priority = priority;
    }

    const [projects, total] = await Promise.all([
      Project.find(filter).sort(sortOption).skip(skip).limit(limit),

      Project.countDocuments(filter),
    ]);

    res.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch projects",
    });
  }
};

const createProject = async (req, res) => {
  try {
    const project = await Project.create({
      ...req.body,
      owner: req.user.id,
    });
    res.status(201).json(project);
  } catch (error) {
    if (error.name === "ValidationError") {
      const validationErrors = {};

      Object.values(error.errors).forEach((validationError) => {
        validationErrors[validationError.path] = validationError.message;
      });

      return res.status(400).json({
        message: "Project validation failed",
        errors: validationErrors,
      });
    }
    res.status(500).json({
      message: "Failed to create project",
    });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    const project = await Project.findOne({
      _id: projectId,
      owner: req.user.id,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    res.json(project);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to fetch project",
    });
  }
};

const updateProject = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.owner;
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }
    const updatedProject = await Project.findOneAndUpdate(
      {
        _id: projectId,
        owner: req.user.id,
      },
      {
        $set: updates,
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );
    if (!updatedProject) {
      return res.status(404).json({
        message: "Project not found",
      });
    }
    res.json(updatedProject);
  } catch (error) {
    if (error.name === "ValidationError") {
      const validationErrors = {};

      Object.values(error.errors).forEach((validationError) => {
        validationErrors[validationError.path] = validationError.message;
      });

      return res.status(400).json({
        message: "Project validation failed",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      message: "Failed to update project",
    });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    const deletedProject = await Project.findOneAndDelete({
      _id: projectId,
      owner: req.user.id,
    });

    if (!deletedProject) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    return res.status(200).json({
      message: "Project deleted successfully",
      project: deletedProject,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete project",
    });
  }
};

module.exports = {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
};
