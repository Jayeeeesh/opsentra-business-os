const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    client: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Planning", "In Progress", "On Hold", "Completed"],
      default: "Planning",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    deadline: {
      type: Date,
      required: true,
    },
    budget: {
      type: Number,
      required: true,
      min: 1,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);
projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ owner: 1, status: 1, priority: 1 });
projectSchema.index({ owner: 1, deadline: 1 });
projectSchema.index({ owner: 1, budget: 1 });

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
