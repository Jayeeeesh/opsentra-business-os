const { test, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const User = require("../models/User");
const Project = require("../models/Project");

const { connectTestDb, disconnectTestDb } = require("./helpers/testDb");

process.env.JWT_SECRET = "test-jwt-secret";
const app = require("../app");

before(connectTestDb);

beforeEach(async () => {
  await Project.deleteMany({});
  await User.deleteMany({});
});

after(disconnectTestDb);

test("GET /api/dashboard/summary requires authentication", async () => {
  const response = await request(app).get("/api/dashboard/summary");

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.message, "Authentication required");
});

test("returns only the logged-in user's completed count", async () => {
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

  await Project.create([
    {
      name: "Project A1",
      client: "Client A",
      status: "Completed",
      deadline: "2020-01-01",
      budget: 1000,
      owner: userA._id,
    },
    {
      name: "Project A2",
      client: "Client A",
      status: "Completed",
      deadline: "2099-12-31",
      budget: 2000,
      owner: userA._id,
    },
    {
      name: "Project B1",
      client: "Client B",
      status: "Completed",
      priority: "High",
      deadline: "2099-12-31",
      budget: 3000,
      owner: userB._id,
    },
    {
      name: "Project A3",
      client: "Client A",
      status: "In Progress",
      priority: "High",
      deadline: "2020-01-01",
      budget: 1500,
      owner: userA._id,
    },
  ]);

  const agent = request.agent(app);

  const loginResponse = await agent.post("/api/auth/login").send({
    email: "usera@example.com",
    password: "password123",
  });

  assert.equal(loginResponse.statusCode, 200);

  const response = await agent.get("/api/dashboard/summary");

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.completedProjects, 2);
  assert.equal(response.body.activeProjects, 1);
  assert.equal(response.body.highPriorityProjects, 1);
  assert.equal(response.body.overdueProjects, 1);

  assert.equal(response.body.totalProjects, 3);
});
