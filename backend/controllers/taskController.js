const mongoose = require("mongoose");
const Project = require("../models/Project");
const Task = require("../models/Task");
const { id } = require("zod/v4/locales");

const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;

    // 1. Check project ID
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    // 2. Verify project ownership
    const project = await Project.findOne({
      _id: projectId,
      owner: req.user.id,
    });

    // 3. Project not found
    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // 4. Create task
    const task = await Task.create({
      ...req.body,
      project: projectId,
    });

    // 5. Send successful response
    return res.status(201).json(task);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create task",
    });
  }
};

const getTasks = async (req, res) => {
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

    const tasks = await Task.find({
      project: projectId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({ tasks });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch tasks",
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const { taskId, projectId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(taskId) ||
      !mongoose.Types.ObjectId.isValid(projectId)
    ) {
      return res.status(400).json({
        message: "Invalid task or project Id",
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

    const task = await Task.findOneAndUpdate(
      {
        _id: taskId,
        project: projectId,
      },
      { $set: req.body },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }
    return res.status(200).json(task);
  } catch (error) {
    console.error("UPDATE TASK ERROR:", error);
    return res.status(500).json({
      message: "Failed to update task",
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(projectId) ||
      !mongoose.Types.ObjectId.isValid(taskId)
    ) {
      return res.status(400).json({
        message: "Invalid project or task ID",
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

    const task = await Task.findOneAndDelete({
      _id: taskId,
      project: projectId,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete task",
    });
  }
};

module.exports = { createTask, getTasks, updateTask, deleteTask };
