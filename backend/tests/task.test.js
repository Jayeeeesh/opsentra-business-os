const { test, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.JWT_SECRET = "test-jwt-secret";

const app = require("../app");
const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");

const { connectTestDb, disconnectTestDb } = require("./helpers/testDb");
const browserAgent = require("./helpers/browserAgent");

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

  const agent = browserAgent(app);

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

  const agent = browserAgent(app);

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

  const agent = browserAgent(app);

  await agent.post("/api/auth/login").send({
    email: "gettasks@example.com",
    password: "password123",
  });

  const response = await agent.get(`/api/projects/${project._id}/tasks`);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.tasks.length, 1);
  assert.equal(response.body.tasks[0].title, "Build Login API");
});

test("Viewer can read tasks in a shared project", async () => {
  // 1. Create owner and viewer
  const user = await User.create({
    name: "Test User",
    email: "gettasks@example.com",
    password: "password123",
  });

  const viewer = await User.create({
    name: "Viewer",
    email: "viewer-shared@example.com",
    password: "password123",
  });

  // 2. Create project with viewer membership
  const project = await Project.create({
    name: "Hotel Website",
    client: "ABC Hotel",
    deadline: "2026-12-31",
    budget: 50000,
    owner: user._id,
    members: [
      {
        user: viewer._id,
        role: "Viewer",
      },
    ],
  });
  // 3. Create task in that project
  await Task.create({
    title: "Build Login API",
    project: project._id,
  });
  // 4. Login as viewer
  const agent = browserAgent(app);

  await agent.post("/api/auth/login").send({
    email: "viewer-shared@example.com",
    password: "password123",
  });

  // 5. Fetch project tasks
  const response = await agent.get(`/api/projects/${project._id}/tasks`);

  // 6. Assert response status and task data
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

  const agent = browserAgent(app);

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

  const agent = browserAgent(app);

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

test("Editor can update a shared project task", async () => {
  // 1. Create Owner and Editor users
  const user = await User.create({
    name: "Test User",
    email: "patch@example.com",
    password: "password123",
  });

  const editor = await User.create({
    name: "Editor",
    email: "editor-shared@example.com",
    password: "password123",
  });

  // 2. Create project with Editor membership
  const project = await Project.create({
    name: "Hotel Website",
    client: "ABC Hotel",
    deadline: "2026-12-31",
    budget: 50000,
    owner: user._id,
    members: [
      {
        user: editor._id,
        role: "Editor",
      },
    ],
  });

  // 3. Create a task
  const task = await Task.create({
    title: "Build Login API",
    project: project._id,
  });

  // 4. Login as Editor
  const agent = browserAgent(app);

  await agent.post("/api/auth/login").send({
    email: "editor-shared@example.com",
    password: "password123",
  });

  // 5. PATCH task status to "Completed"
  const response = await agent
    .patch(`/api/projects/${project._id}/tasks/${task._id}`)
    .send({
      status: "Completed",
    });

  // 6. Verify response.statusCode === 200
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "Completed");

  // 7. Verify task status === "Completed"
  const updatedTask = await Task.findById(task._id);
  assert.equal(updatedTask.status, "Completed");
});

test("Editor can create a task in a shared project", async () => {
  // 1. Create Owner and Editor
  const user = await User.create({
    name: "Test User",
    email: "patch@example.com",
    password: "password123",
  });

  const editor = await User.create({
    name: "Editor",
    email: "editor-shared@example.com",
    password: "password123",
  });

  // 2. Create project with Editor membership
  const project = await Project.create({
    name: "Hotel Website",
    client: "ABC Hotel",
    deadline: "2026-12-31",
    budget: 50000,
    owner: user._id,
    members: [
      {
        user: editor._id,
        role: "Editor",
      },
    ],
  });
  // 3. Login as Editor
  const agent = browserAgent(app);
  const login = await agent.post("/api/auth/login").send({
    email: "editor-shared@example.com",
    password: "password123",
  });

  assert.equal(login.statusCode, 200);

  // 4. POST a new task
  const response = await agent.post(`/api/projects/${project._id}/tasks`).send({
    title: "Build Dashboard",
    priority: "High",
  });

  // 5. Verify HTTP 201
  assert.equal(response.statusCode, 201);
  assert.equal(response.body.title, "Build Dashboard");

  // 6. Verify task is saved in MongoDB
  const savedTask = await Task.findById(response.body._id);
  assert.ok(savedTask);
  assert.equal(savedTask.project.toString(), project._id.toString());
});

test("Editor can delete a shared project task", async () => {
  // 1. Create Owner and Editor users
  const user = await User.create({
    name: "Test User",
    email: "patch@example.com",
    password: "password123",
  });

  const editor = await User.create({
    name: "Editor",
    email: "editor-shared@example.com",
    password: "password123",
  });

  // 2. Create project with Editor membership
  const project = await Project.create({
    name: "Hotel Website",
    client: "ABC Hotel",
    deadline: "2026-12-31",
    budget: 50000,
    owner: user._id,
    members: [
      {
        user: editor._id,
        role: "Editor",
      },
    ],
  });

  // 3. Create task in the project
  const task = await Task.create({
    title: "Build Login API",
    project: project._id,
  });
  // 4. Login as Editor

  const agent = browserAgent(app);

  const login = await agent.post("/api/auth/login").send({
    email: "editor-shared@example.com",
    password: "password123",
  });

  assert.equal(login.statusCode, 200);

  // 5. DELETE task
  const response = await agent.delete(
    `/api/projects/${project._id}/tasks/${task._id}`,
  );
  // 6. Verify HTTP 200

  assert.equal(response.statusCode, 200);
  // 7. Verify task removed from MongoDB

  const deletedTask = await Task.findById(task._id);
  assert.equal(deletedTask, null);
});

test("Viewer cannot update a shared project task", async () => {
  // 1. Create Owner and Viewer
  const user = await User.create({
    name: "Test User",
    email: "patch@example.com",
    password: "password123",
  });

  const viewer = await User.create({
    name: "Viewer",
    email: "Viewer-shared@example.com",
    password: "password123",
  });

  // 2. Create project with Viewer membership
  const project = await Project.create({
    name: "Hotel Website",
    client: "ABC Hotel",
    deadline: "2026-12-31",
    budget: 50000,
    owner: user._id,
    members: [
      {
        user: viewer._id,
        role: "Viewer",
      },
    ],
  });

  // 3. Create task
  const task = await Task.create({
    title: "Build Login API",
    project: project._id,
  });
  // 4. Login as Viewer
  const agent = browserAgent(app);

  const login = await agent.post("/api/auth/login").send({
    email: "Viewer-shared@example.com",
    password: "password123",
  });

  assert.equal(login.statusCode, 200);

  // 5. PATCH task status to "Completed"
  const response = await agent
    .patch(`/api/projects/${project._id}/tasks/${task._id}`)
    .send({
      status: "Completed",
    });
  // 6. Expect HTTP 403
  assert.equal(response.statusCode, 403);

  // 7. Verify MongoDB task status remains "To Do"
  const unchangedTask = await Task.findById(task._id);
  assert.equal(unchangedTask.status, "To Do");
});

test("Viewer cannot create a task in a shared project", async () => {
  // 1. Create Owner and Viewer users
  const user = await User.create({
    name: "Test User",
    email: "patch@example.com",
    password: "password123",
  });

  const viewer = await User.create({
    name: "Viewer",
    email: "Viewer-shared@example.com",
    password: "password123",
  });
  // 2. Create project with Viewer membership
  const project = await Project.create({
    name: "Hotel Website",
    client: "ABC Hotel",
    deadline: "2026-12-31",
    budget: 50000,
    owner: user._id,
    members: [
      {
        user: viewer._id,
        role: "Viewer",
      },
    ],
  });

  // 3. Login as Viewer and verify 200
  const agent = browserAgent(app);

  const login = await agent.post("/api/auth/login").send({
    email: "Viewer-shared@example.com",
    password: "password123",
  });

  assert.equal(login.statusCode, 200);

  // 4. POST a new task
  const response = await agent.post(`/api/projects/${project._id}/tasks`).send({
    title: "Build Dashboard",
    priority: "High",
  });

  // 5. Assert response status is 403
  assert.equal(response.statusCode, 403);

  // 6. Verify no task was created in MongoDB
  const taskCount = await Task.countDocuments({
    project: project._id,
  });

  assert.equal(taskCount, 0);
});

test("Viewer cannot delete a shared project task", async () => {
  const user = await User.create({
    name: "Test User",
    email: "patch@example.com",
    password: "password123",
  });

  const viewer = await User.create({
    name: "Viewer",
    email: "Viewer-shared@example.com",
    password: "password123",
  });

  const project = await Project.create({
    name: "Hotel Website",
    client: "ABC Hotel",
    deadline: "2026-12-31",
    budget: 50000,
    owner: user._id,
    members: [
      {
        user: viewer._id,
        role: "Viewer",
      },
    ],
  });

  const task = await Task.create({
    title: "Build Login API",
    project: project._id,
  });

  const agent = browserAgent(app);

  const login = await agent.post("/api/auth/login").send({
    email: "Viewer-shared@example.com",
    password: "password123",
  });

  assert.equal(login.statusCode, 200);

  const response = await agent.delete(
    `/api/projects/${project._id}/tasks/${task._id}`,
  );

  assert.equal(response.statusCode, 403);

  const existingTask = await Task.findById(task._id);
  assert.ok(existingTask);
  assert.equal(existingTask.title, "Build Login API");
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

  const agent = browserAgent(app);

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

  const agent = browserAgent(app);

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

  const agent = browserAgent(app);

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

  const agent = browserAgent(app);

  // 1. Login first
  const login = await agent.post("/api/auth/login").send({
    email: "cleanup@example.com",
    password: "password123",
  });

  // 2. Verify authentication
  assert.equal(login.statusCode, 200);

  // 3. Delete project
  const response = await agent.delete(`/api/projects/${project._id}`);

  assert.equal(response.statusCode, 200);

  // 4. Verify tasks were deleted
  const remainingTasks = await Task.countDocuments({
    project: project._id,
  });

  assert.equal(remainingTasks, 0);
});
