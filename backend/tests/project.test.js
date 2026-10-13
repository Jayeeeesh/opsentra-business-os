const { test, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.JWT_SECRET = "test-jwt-secret";

const User = require("../models/User");
const Project = require("../models/Project");

const { connectTestDb, disconnectTestDb } = require("./helpers/testDb");

const app = require("../app");

before(connectTestDb);

beforeEach(async () => {
  await User.deleteMany({});
  await Project.deleteMany({});
});

after(disconnectTestDb);

test("GET /api/projects returns 401 when unauthenticated", async () => {
  const response = await request(app).get("/api/projects");

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.message, "Authentication required");
});

test("POST /api/projects creates a project for authenticated user", async () => {
  const user = await User.create({
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  });

  const agent = request.agent(app);

  const loginResponse = await agent.post("/api/auth/login").send({
    email: "test@example.com",
    password: "password123",
  });

  assert.equal(loginResponse.statusCode, 200);

  const response = await agent.post("/api/projects").send({
    name: "Opsentra Website",
    client: "Acme Corp",
    deadline: "2026-12-31",
    budget: 50000,
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.name, "Opsentra Website");
  assert.equal(response.body.priority, "Medium");
  assert.equal(response.body.owner.toString(), user._id.toString());
});

test("POST /api/projects rejects invalid priority", async () => {
  await User.create({
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  });

  const agent = request.agent(app);

  await agent.post("/api/auth/login").send({
    email: "test@example.com",
    password: "password123",
  });

  const response = await agent.post("/api/projects").send({
    name: "Invalid Priority Project",
    client: "Acme Corp",
    priority: "Urgent",
    deadline: "2026-12-31",
    budget: 50000,
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.message, "Invalid request data");

  assert.ok(
    response.body.errors.some((error) => error.path.includes("priority")),
  );
});

test("GET /api/projects returns only the authenticated user's projects", async () => {
  const userA = await User.create({
    name: "User A",
    email: "usera@example.com",
    password: "password123",
  });

  const userB = await User.create({
    name: "User B",
    email: "userb@example.com",
    password: "password123",
  });

  await Project.create({
    name: "User A Project",
    client: "Client A",
    deadline: "2026-12-31",
    budget: 10000,
    owner: userA._id,
  });

  await Project.create({
    name: "User B Project",
    client: "Client B",
    deadline: "2026-12-31",
    budget: 20000,
    owner: userB._id,
  });

  const agent = request.agent(app);

  const loginResponse = await agent.post("/api/auth/login").send({
    email: "usera@example.com",
    password: "password123",
  });

  assert.equal(loginResponse.statusCode, 200);

  const response = await agent.get("/api/projects");

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.length, 1);
  assert.equal(response.body[0].name, "User A Project");
});

test("GET /api/projects/:id blocks access to another user's project", async () => {
  const userA = await User.create({
    name: "User A",
    email: "usera@example.com",
    password: "password123",
  });

  await User.create({
    name: "User B",
    email: "userb@example.com",
    password: "password123",
  });

  const projectA = await Project.create({
    name: "Private Project",
    client: "Client A",
    deadline: "2026-12-31",
    budget: 25000,
    owner: userA._id,
  });

  const agent = request.agent(app);

  const loginResponse = await agent.post("/api/auth/login").send({
    email: "userb@example.com",
    password: "password123",
  });

  assert.equal(loginResponse.statusCode, 200);
  const response = await agent.get(`/api/projects/${projectA._id}`);

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.message, "Project not found");
});

test("PATCH /api/projects/:id updates the authenticated user's project", async () => {
  const user = await User.create({
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  });

  const project = await Project.create({
    name: "Old Project Name",
    client: "Client A",
    deadline: "2026-12-31",
    budget: 10000,
    owner: user._id,
  });

  const agent = request.agent(app);

  const loginResponse = await agent.post("/api/auth/login").send({
    email: "test@example.com",
    password: "password123",
  });

  assert.equal(loginResponse.statusCode, 200);
  const response = await agent.patch(`/api/projects/${project._id}`).send({
    name: "Updated Project Name",
    priority: "High",
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.name, "Updated Project Name");
  assert.equal(response.body.priority, "High");
});

test("PATCH /api/projects/:id rejects invalid priority", async () => {
  const user = await User.create({
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  });

  const project = await Project.create({
    name: "Test Project",
    client: "Client A",
    deadline: "2026-12-31",
    budget: 10000,
    owner: user._id,
  });

  const agent = request.agent(app);

  await agent.post("/api/auth/login").send({
    email: "test@example.com",
    password: "password123",
  });

  const response = await agent.patch(`/api/projects/${project._id}`).send({
    priority: "Urgent",
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.message, "Invalid request data");

  assert.ok(
    response.body.errors.some((error) => error.path.includes("priority")),
  );
});

test("DELETE /api/projects/:id deletes the authenticated user's project", async () => {
  const user = await User.create({
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  });

  const project = await Project.create({
    name: "Project To Delete",
    client: "Client A",
    deadline: "2026-12-31",
    budget: 10000,
    owner: user._id,
  });

  const agent = request.agent(app);

  const loginResponse = await agent.post("/api/auth/login").send({
    email: "test@example.com",
    password: "password123",
  });

  assert.equal(loginResponse.statusCode, 200);
  const response = await agent.delete(`/api/projects/${project._id}`);

  assert.equal(response.statusCode, 200);
  const deletedProject = await Project.findById(project._id);

  assert.equal(deletedProject, null);
});
