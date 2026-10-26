const { test, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.JWT_SECRET = "test-jwt-secret";

const app = require("../app");
const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");

const { connectTestDb, disconnectTestDb } = require("./helpers/testDb");

before(connectTestDb);

beforeEach(async () => {
  await Task.deleteMany({});
  await Project.deleteMany({});
  await User.deleteMany({});
});

after(disconnectTestDb);

test("User can create task in own project", async () => {
  const user = await User.create({
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  });

  const project = await Project.create({
    name: "Hotel Website",
    client: "ABC Hotel",
    deadline: "2026-12-31",
    budget: 50000,
    owner: user._id,
  });

  const agent = request.agent(app);

  const login = await agent.post("/api/auth/login").send({
    email: "test@example.com",
    password: "password123",
  });

  assert.equal(login.statusCode, 200);

  const response = await agent.post(`/api/projects/${project._id}/tasks`).send({
    title: "Build Login API",
    priority: "High",
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.title, "Build Login API");
  assert.equal(response.body.priority, "High");
  assert.equal(response.body.status, "To Do");

  const savedTask = await Task.findById(response.body._id);

  assert.ok(savedTask);
  assert.equal(savedTask.project.toString(), project._id.toString());
});

test("User cannot create task in another user's project", async () => {
  const owner = await User.create({
    name: "Owner",
    email: "owner@example.com",
    password: "password123",
  });

  await User.create({
    name: "Other User",
    email: "other@example.com",
    password: "password123",
  });

  const project = await Project.create({
    name: "Private Project",
    client: "ABC Company",
    deadline: "2026-12-31",
    budget: 10000,
    owner: owner._id,
  });

  const agent = request.agent(app);

  await agent.post("/api/auth/login").send({
    email: "other@example.com",
    password: "password123",
  });

  const response = await agent.post(`/api/projects/${project._id}/tasks`).send({
    title: "Unauthorized Task",
  });

  assert.equal(response.statusCode, 404);
  assert.equal(await Task.countDocuments({}), 0);
});

test("GET tasks returns project tasks", async () => {
  const user = await User.create({
    name: "Test User",
    email: "gettasks@example.com",
    password: "password123",
  });

  const project = await Project.create({
    name: "Hotel Website",
    client: "ABC Hotel",
    deadline: "2026-12-31",
    budget: 50000,
    owner: user._id,
  });

  await Task.create({
    title: "Build Login API",
    project: project._id,
  });

  const agent = request.agent(app);

  await agent.post("/api/auth/login").send({
    email: "gettasks@example.com",
    password: "password123",
  });

  const response = await agent.get(`/api/projects/${project._id}/tasks`);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.tasks.length, 1);
  assert.equal(response.body.tasks[0].title, "Build Login API");
});

test("GET tasks blocks another user's project", async () => {
  const owner = await User.create({
    name: "Owner",
    email: "taskowner@example.com",
    password: "password123",
  });

  await User.create({
    name: "Other User",
    email: "taskother@example.com",
    password: "password123",
  });

  const project = await Project.create({
    name: "Private Project",
    client: "ABC Company",
    deadline: "2026-12-31",
    budget: 10000,
    owner: owner._id,
  });

  await Task.create({
    title: "Private Task",
    project: project._id,
  });

  const agent = request.agent(app);

  await agent.post("/api/auth/login").send({
    email: "taskother@example.com",
    password: "password123",
  });

  const response = await agent.get(`/api/projects/${project._id}/tasks`);

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.message, "Project not found");
});

test("PATCH updates task status", async () => {
  const user = await User.create({
    name: "Test User",
    email: "patch@example.com",
    password: "password123",
  });

  const project = await Project.create({
    name: "Hotel Website",
    client: "ABC Hotel",
    deadline: "2026-12-31",
    budget: 50000,
    owner: user._id,
  });

  const task = await Task.create({
    title: "Build Login API",
    project: project._id,
  });

  const agent = request.agent(app);

  await agent.post("/api/auth/login").send({
    email: "patch@example.com",
    password: "password123",
  });

  const response = await agent
    .patch(`/api/projects/${project._id}/tasks/${task._id}`)
    .send({
      status: "In Progress",
    });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "In Progress");

  const updatedTask = await Task.findById(task._id);

  assert.equal(updatedTask.status, "In Progress");
});

test("PATCH blocks another user's task update", async () => {
  const owner = await User.create({
    name: "Owner",
    email: "owner@example.com",
    password: "password123",
  });

  await User.create({
    name: "Other User",
    email: "taskother@example.com",
    password: "password123",
  });

  const project = await Project.create({
    name: "Private Project",
    client: "ABC Company",
    deadline: "2026-12-31",
    budget: 10000,
    owner: owner._id,
  });

  const task = await Task.create({
    title: "Private Task",
    project: project._id,
  });

  const agent = request.agent(app);

  await agent.post("/api/auth/login").send({
    email: "taskother@example.com",
    password: "password123",
  });

  const response = await agent
    .patch(`/api/projects/${project._id}/tasks/${task._id}`)
    .send({ status: "Completed" });

  assert.equal(response.statusCode, 404);

  const unchangedTask = await Task.findById(task._id);

  assert.equal(unchangedTask.status, "To Do");
});

test("DELETE removes task from own project", async () => {
  const user = await User.create({
    name: "Test User",
    email: "delete@example.com",
    password: "password123",
  });

  const project = await Project.create({
    name: "Hotel Website",
    client: "ABC Hotel",
    deadline: "2026-12-31",
    budget: 50000,
    owner: user._id,
  });

  const task = await Task.create({
    title: "Old Task",
    project: project._id,
  });

  const agent = request.agent(app);

  await agent.post("/api/auth/login").send({
    email: "delete@example.com",
    password: "password123",
  });

  const response = await agent.delete(
    `/api/projects/${project._id}/tasks/${task._id}`,
  );

  assert.equal(response.statusCode, 200);

  const deletedTask = await Task.findById(task._id);

  assert.equal(deletedTask, null);
});

test("DELETE blocks another user's task", async () => {
  const owner = await User.create({
    name: "Owner",
    email: "deleteowner@example.com",
    password: "password123",
  });

  await User.create({
    name: "Other User",
    email: "deleteother@example.com",
    password: "password123",
  });

  const project = await Project.create({
    name: "Private Project",
    client: "ABC Company",
    deadline: "2026-12-31",
    budget: 10000,
    owner: owner._id,
  });

  const task = await Task.create({
    title: "Private Task",
    project: project._id,
  });

  const agent = request.agent(app);

  await agent.post("/api/auth/login").send({
    email: "deleteother@example.com",
    password: "password123",
  });

  const response = await agent.delete(
    `/api/projects/${project._id}/tasks/${task._id}`,
  );

  assert.equal(response.statusCode, 404);

  const existingTask = await Task.findById(task._id);

  assert.ok(existingTask);
  assert.equal(existingTask.title, "Private Task");
});

test("Deleting a project removes its tasks", async () => {
  const user = await User.create({
    name: "Test User",
    email: "cleanup@example.com",
    password: "password123",
  });

  const project = await Project.create({
    name: "Hotel Website",
    client: "ABC Hotel",
    deadline: "2026-12-31",
    budget: 50000,
    owner: user._id,
  });

  await Task.create({
    title: "Build Login API",
    project: project._id,
  });

  const agent = request.agent(app);

  await agent.post("/api/auth/login").send({
    email: "cleanup@example.com",
    password: "password123",
  });

  const response = await agent.delete(`/api/projects/${project._id}`);

  assert.equal(response.statusCode, 200);

  const remainingTasks = await Task.countDocuments({
    project: project._id,
  });

  assert.equal(remainingTasks, 0);
});
