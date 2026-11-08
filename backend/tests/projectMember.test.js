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

test("Owner can add Editor to project", async () => {
  // 1. Create Owner
  const owner = await User.create({
    name: "Owner",
    email: "owner@example.com",
    password: "password123",
  });

  // 2. Create Editor
  const editor = await User.create({
    name: "Editor",
    email: "editor@example.com",
    password: "password123",
  });

  // 3. Create project
  const project = await Project.create({
    name: "Hotel Website",
    client: "ABC Hotel",
    deadline: "2026-12-31",
    budget: 50000,
    owner: owner._id,
  });

  // 4. Login as Owner
  const agent = request.agent(app);

  const login = await agent.post("/api/auth/login").send({
    email: "owner@example.com",
    password: "password123",
  });

  assert.equal(login.statusCode, 200);

  // 5. Add Editor
  const response = await agent
    .post(`/api/projects/${project._id}/members`)
    .send({
      email: "editor@example.com",
      role: "Editor",
    });

  assert.equal(response.statusCode, 201);

  // 6. Verify MongoDB
  const updatedProject = await Project.findById(project._id);

  const member = updatedProject.members.find(
    (item) => String(item.user) === String(editor._id),
  );

  assert.ok(member);
  assert.equal(member.role, "Editor");

  // Try adding the same Editor again
  const duplicateResponse = await agent
    .post(`/api/projects/${project._id}/members`)
    .send({
      email: "editor@example.com",
      role: "Editor",
    });

  assert.equal(duplicateResponse.statusCode, 409);

  // Verify only one membership exists
  const savedProject = await Project.findById(project._id);

  const memberships = savedProject.members.filter(
    (member) => String(member.user) === String(editor._id),
  );

  assert.equal(memberships.length, 1);
});

test("Editor cannot add project members", async () => {
  const owner = await User.create({
    name: "Owner",
    email: "owner@example.com",
    password: "password123",
  });

  const editor = await User.create({
    name: "Editor",
    email: "editor@example.com",
    password: "password123",
  });

  const newMember = await User.create({
    name: "New Member",
    email: "newmember@example.com",
    password: "password123",
  });

  const project = await Project.create({
    name: "Hotel Website",
    client: "ABC Hotel",
    deadline: "2026-12-31",
    budget: 50000,
    owner: owner._id,
    members: [{ user: editor._id, role: "Editor" }],
  });

  const agent = request.agent(app);

  const login = await agent.post("/api/auth/login").send({
    email: "editor@example.com",
    password: "password123",
  });

  assert.equal(login.statusCode, 200);

  const response = await agent
    .post(`/api/projects/${project._id}/members`)
    .send({
      email: "newmember@example.com",
      role: "Viewer",
    });

  assert.equal(response.statusCode, 403);

  const savedProject = await Project.findById(project._id);

  const wasAdded = savedProject.members.some(
    (member) => String(member.user) === String(newMember._id),
  );

  assert.equal(wasAdded, false);
});

test("Owner can change Viewer role to Editor", async () => {
  const owner = await User.create({
    name: "Owner",
    email: "owner@example.com",
    password: "password123",
  });

  const viewer = await User.create({
    name: "Viewer",
    email: "viewer@example.com",
    password: "password123",
  });

  const project = await Project.create({
    name: "Hotel Website",
    client: "ABC Hotel",
    deadline: "2026-12-31",
    budget: 50000,
    owner: owner._id,
    members: [{ user: viewer._id, role: "Viewer" }],
  });

  const agent = request.agent(app);

  const login = await agent.post("/api/auth/login").send({
    email: "owner@example.com",
    password: "password123",
  });

  assert.equal(login.statusCode, 200);

  const response = await agent
    .patch(`/api/projects/${project._id}/members/${viewer._id}`)
    .send({ role: "Editor" });

  assert.equal(response.statusCode, 200);

  const updatedProject = await Project.findById(project._id);

  const member = updatedProject.members.find(
    (item) => String(item.user) === String(viewer._id),
  );

  assert.ok(member);
  assert.equal(member.role, "Editor");
});

test("Owner can remove a project member", async () => {
  const owner = await User.create({
    name: "Owner",
    email: "owner@example.com",
    password: "password123",
  });

  const viewer = await User.create({
    name: "Viewer",
    email: "viewer@example.com",
    password: "password123",
  });

  const project = await Project.create({
    name: "Hotel Website",
    client: "ABC Hotel",
    deadline: "2026-12-31",
    budget: 50000,
    owner: owner._id,
    members: [{ user: viewer._id, role: "Viewer" }],
  });

  const ownerAgent = request.agent(app);

  const login = await ownerAgent.post("/api/auth/login").send({
    email: "owner@example.com",
    password: "password123",
  });

  assert.equal(login.statusCode, 200);

  const response = await ownerAgent.delete(
    `/api/projects/${project._id}/members/${viewer._id}`,
  );

  assert.equal(response.statusCode, 200);

  // Verify member removed from MongoDB
  const updatedProject = await Project.findById(project._id);

  const stillMember = updatedProject.members.some(
    (item) => String(item.user) === String(viewer._id),
  );

  assert.equal(stillMember, false);

  // Verify removed Viewer cannot access the project
  const viewerAgent = request.agent(app);

  const viewerLogin = await viewerAgent.post("/api/auth/login").send({
    email: "viewer@example.com",
    password: "password123",
  });

  assert.equal(viewerLogin.statusCode, 200);

  const accessResponse = await viewerAgent.get(`/api/projects/${project._id}`);

  assert.equal(accessResponse.statusCode, 404);
});

test("Editor cannot remove project members", async () => {
  const owner = await User.create({
    name: "Owner",
    email: "owner@example.com",
    password: "password123",
  });

  const editor = await User.create({
    name: "Editor",
    email: "editor@example.com",
    password: "password123",
  });

  const viewer = await User.create({
    name: "Viewer",
    email: "viewer@example.com",
    password: "password123",
  });

  const project = await Project.create({
    name: "Hotel Website",
    client: "ABC Hotel",
    deadline: "2026-12-31",
    budget: 50000,
    owner: owner._id,
    members: [
      { user: editor._id, role: "Editor" },
      { user: viewer._id, role: "Viewer" },
    ],
  });

  const agent = request.agent(app);

  const login = await agent.post("/api/auth/login").send({
    email: "editor@example.com",
    password: "password123",
  });

  assert.equal(login.statusCode, 200);

  const response = await agent.delete(
    `/api/projects/${project._id}/members/${viewer._id}`,
  );

  assert.equal(response.statusCode, 403);

  const savedProject = await Project.findById(project._id);

  const stillMember = savedProject.members.some(
    (member) => String(member.user) === String(viewer._id),
  );

  assert.equal(stillMember, true);
});

test("Editor cannot change member roles", async () => {
  const owner = await User.create({
    name: "Owner",
    email: "owner@example.com",
    password: "password123",
  });

  const editor = await User.create({
    name: "Editor",
    email: "editor@example.com",
    password: "password123",
  });

  const viewer = await User.create({
    name: "Viewer",
    email: "viewer@example.com",
    password: "password123",
  });

  const project = await Project.create({
    name: "Hotel Website",
    client: "ABC Hotel",
    deadline: "2026-12-31",
    budget: 50000,
    owner: owner._id,
    members: [
      { user: editor._id, role: "Editor" },
      { user: viewer._id, role: "Viewer" },
    ],
  });

  const agent = request.agent(app);

  const login = await agent.post("/api/auth/login").send({
    email: "editor@example.com",
    password: "password123",
  });

  assert.equal(login.statusCode, 200);

  const response = await agent
    .patch(`/api/projects/${project._id}/members/${viewer._id}`)
    .send({ role: "Editor" });

  assert.equal(response.statusCode, 403);

  const savedProject = await Project.findById(project._id);

  const member = savedProject.members.find(
    (item) => String(item.user) === String(viewer._id),
  );

  assert.ok(member);
  assert.equal(member.role, "Viewer");
});

test("Editor can see shared projects but not private projects", async () => {
  // 1. Create users
  const owner = await User.create({
    name: "Owner",
    email: "owner@example.com",
    password: "password123",
  });

  const editor = await User.create({
    name: "Editor",
    email: "editor@example.com",
    password: "password123",
  });

  // 2. Create shared project
  const sharedProject = await Project.create({
    name: "Hotel Website",
    client: "ABC Hotel",
    deadline: "2026-12-31",
    budget: 50000,
    owner: owner._id,
    members: [{ user: editor._id, role: "Editor" }],
  });

  // 3. Create private project
  await Project.create({
    name: "Private Finance",
    client: "ABC Company",
    deadline: "2026-12-31",
    budget: 10000,
    owner: owner._id,
  });

  // 4. Login as Editor
  const agent = request.agent(app);

  const login = await agent.post("/api/auth/login").send({
    email: "editor@example.com",
    password: "password123",
  });

  assert.equal(login.statusCode, 200);

  // 5. GET projects
  const response = await agent.get("/api/projects");

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.projects.length, 1);
  assert.equal(response.body.projects[0]._id, String(sharedProject._id));

  // 6. Search must not expose private projects
  const searchResponse = await agent.get("/api/projects?search=Private");

  assert.equal(searchResponse.statusCode, 200);
  assert.equal(searchResponse.body.projects.length, 0);
  assert.equal(searchResponse.body.pagination.total, 0);
});

test("Dashboard counts shared projects but excludes private projects", async () => {
  const owner = await User.create({
    name: "Owner",
    email: "owner@example.com",
    password: "password123",
  });

  const editor = await User.create({
    name: "Editor",
    email: "editor@example.com",
    password: "password123",
  });

  await Project.create([
    {
      name: "Hotel Website",
      client: "ABC Hotel",
      deadline: "2026-12-31",
      budget: 50000,
      owner: owner._id,
      members: [{ user: editor._id, role: "Editor" }],
      status: "In Progress",
      priority: "High",
    },
    {
      name: "Mobile App",
      client: "XYZ Company",
      deadline: "2026-12-31",
      budget: 30000,
      owner: owner._id,
      members: [{ user: editor._id, role: "Editor" }],
      status: "Completed",
    },
    {
      name: "Private Finance",
      client: "Private Client",
      deadline: "2026-12-31",
      budget: 10000,
      owner: owner._id,
      status: "In Progress",
      priority: "High",
    },
  ]);

  const agent = request.agent(app);

  const login = await agent.post("/api/auth/login").send({
    email: "editor@example.com",
    password: "password123",
  });

  assert.equal(login.statusCode, 200);

  // Use the dashboard summary endpoint configured in your app
  const response = await agent.get("/api/dashboard/summary");

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.totalProjects, 2);
  assert.equal(response.body.activeProjects, 1);
  assert.equal(response.body.completedProjects, 1);
  assert.equal(response.body.highPriorityProjects, 1);
});
