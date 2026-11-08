const User = require("../models/User");
const mongoose = require("mongoose");

const addProjectMember = async (req, res, next) => {
  try {
    const { email, role } = req.body ?? {};

    if (
      typeof email !== "string" ||
      !email.trim() ||
      !["Editor", "Viewer"].includes(role)
    ) {
      return res.status(400).json({
        message: "Valid email and role are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const project = req.project;

    if (String(project.owner) === String(user._id)) {
      return res.status(409).json({
        message: "Project owner is already a member",
      });
    }

    const alreadyMember = project.members.some(
      (member) => String(member.user) === String(user._id),
    );

    if (alreadyMember) {
      return res.status(409).json({
        message: "User is already a project member",
      });
    }

    project.members.push({
      user: user._id,
      role,
    });

    await project.save();

    return res.status(201).json({
      message: "Member added successfully",
      member: {
        user: user._id,
        role,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const updateMemberRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body ?? {};

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    if (!["Editor", "Viewer"].includes(role)) {
      return res.status(400).json({
        message: "Invalid member role",
      });
    }

    const project = req.project;

    if (String(project.owner) === userId) {
      return res.status(403).json({
        message: "Cannot change project owner role",
      });
    }

    const member = project.members.find((item) => String(item.user) === userId);

    if (!member) {
      return res.status(404).json({
        message: "Member not found",
      });
    }

    member.role = role;
    await project.save();

    return res.status(200).json({
      message: "Member role updated successfully",
      member: {
        user: member.user,
        role: member.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const removeProjectMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const project = req.project;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    if (String(project.owner) === userId) {
      return res.status(403).json({
        message: "Cannot remove project owner",
      });
    }

    const member = project.members.find((item) => String(item.user) === userId);

    if (!member) {
      return res.status(404).json({
        message: "Member not found",
      });
    }

    project.members = project.members.filter(
      (item) => String(item.user) !== userId,
    );

    await project.save();

    return res.status(200).json({
      message: "Member removed successfully",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { addProjectMember, updateMemberRole, removeProjectMember };
