const mongoose = require("mongoose");
const Task = require("../models/Task");

const createTask = async (req, res) => {
  try {
    const task = await Task.create({
      ...req.body,
      project: req.project._id,
    });

    return res.status(201).json(task);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create task",
    });
  }
};

const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      project: req.project._id,
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
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    const task = await Task.findOneAndUpdate(
      {
        _id: taskId,
        project: req.project._id,
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
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    const task = await Task.findOneAndDelete({
      _id: taskId,
      project: req.project._id,
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
