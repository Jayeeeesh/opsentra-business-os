const { test, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.JWT_SECRET = "test-jwt-secret";
const jwt = require("jsonwebtoken");

const app = require("../app");
const User = require("../models/User");

const { connectTestDb, disconnectTestDb } = require("./helpers/testDb");
const browserAgent = require("./helpers/browserAgent");

before(connectTestDb);

beforeEach(async () => {
  await User.deleteMany({});
});

after(disconnectTestDb);

test("GET /api/auth/me returns 401 when unauthenticated", async () => {
  const response = await request(app).get("/api/auth/me");

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.message, "Authentication required");
});

test("GET /api/auth/me returns current user when authenticated", async () => {
  await User.create({
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  });

  const agent = browserAgent(app);

  const loginResponse = await agent.post("/api/auth/login").send({
    email: "test@example.com",
    password: "password123",
  });

  assert.equal(loginResponse.statusCode, 200);

  const response = await agent.get("/api/auth/me");

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.user.email, "test@example.com");
});

test("POST /api/auth/login returns 401 for invalid password", async () => {
  await User.create({
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  });

  const response = await request(app)
    .post("/api/auth/login")
    .set("Origin", process.env.CLIENT_URL || "http://localhost:5173")
    .send({
      email: "test@example.com",
      password: "wrongpassword",
    });

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.message, "Invalid email or password");
});

test("POST /api/auth/register creates a new user", async () => {
  const response = await request(app).post("/api/auth/register").send({
    name: "New User",
    email: "newuser@example.com",
    password: "password123",
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.user.email, "newuser@example.com");
});

test("POST /api/auth/register returns 409 for duplicate email", async () => {
  await User.create({
    name: "Existing User",
    email: "newuser@example.com",
    password: "password123",
  });

  const response = await request(app).post("/api/auth/register").send({
    name: "New User",
    email: "newuser@example.com",
    password: "password123",
  });

  assert.equal(response.statusCode, 409);
  assert.equal(response.body.message, "User with this email already exists");
});

test("POST /api/auth/logout clears the authenticated session", async () => {
  await User.create({
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  });

  const agent = browserAgent(app);

  const loginResponse = await agent.post("/api/auth/login").send({
    email: "test@example.com",
    password: "password123",
  });
  assert.equal(loginResponse.statusCode, 200);

  const logoutResponse = await agent
    .post("/api/auth/logout")
    .set("Origin", process.env.CLIENT_URL || "http://localhost:5173");

  assert.equal(logoutResponse.statusCode, 200);

  const response = await agent.get("/api/auth/me");

  assert.equal(response.statusCode, 401);
});

test("GET /api/auth/me rejects expired JWT", async () => {
  const expiredToken = jwt.sign(
    { userId: "test-user-id" },
    process.env.JWT_SECRET,
    { expiresIn: -10 },
  );

  const response = await request(app)
    .get("/api/auth/me")
    .set("Cookie", `token=${expiredToken}`);

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.message, "Invalid or expired token");
});

test("GET /api/auth/me rejects invalid JWT", async () => {
  const invalidToken = jwt.sign({ userId: "test-user-id" }, "wrong-secret", {
    expiresIn: "1h",
  });

  const response = await request(app)
    .get("/api/auth/me")
    .set("Cookie", `token=${invalidToken}`);

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.message, "Invalid or expired token");
});

test("POST /api/auth/login sets secure cookie attributes", async () => {
  await User.create({
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  });

  const response = await request(app)
    .post("/api/auth/login")
    .set("Origin", process.env.CLIENT_URL || "http://localhost:5173")
    .send({
      email: "test@example.com",
      password: "password123",
    });

  assert.equal(response.statusCode, 200);

  const cookie = response.headers["set-cookie"]?.[0];

  assert.ok(cookie);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
});

test("POST /api/auth/login sets production cookie attributes", async () => {
  await User.create({
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  });

  const originalNodeEnv = process.env.NODE_ENV;

  try {
    process.env.NODE_ENV = "production";

    const response = await request(app)
      .post("/api/auth/login")
      .set("Origin", process.env.CLIENT_URL || "http://localhost:5173")
      .send({
        email: "test@example.com",
        password: "password123",
      });

    assert.equal(response.statusCode, 200);

    const cookie = response.headers["set-cookie"]?.[0];

    assert.ok(cookie);
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /;\s*Secure(?:;|$)/i);
    assert.match(cookie, /SameSite=None/i);
  } finally {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  }
});

test("POST /api/auth/logout rejects untrusted origin", async () => {
  const response = await request(app)
    .post("/api/auth/logout")
    .set("Origin", "https://attacker.example");

  assert.equal(response.statusCode, 403);
});

test("POST /api/auth/logout allows trusted origin", async () => {
  const trustedOrigin = process.env.CLIENT_URL || "http://localhost:5173";

  const response = await request(app)
    .post("/api/auth/logout")
    .set("Origin", new URL(trustedOrigin).origin);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.message, "Logged out successfully");
});

test("POST /api/auth/logout rejects cross-site request without Origin", async () => {
  const response = await request(app)
    .post("/api/auth/logout")
    .set("Sec-Fetch-Site", "cross-site")
    .set("Cookie", "token=test-token");

  assert.equal(response.statusCode, 403);
});

test("POST /api/auth/logout rejects cookie request without origin metadata", async () => {
  const response = await request(app)
    .post("/api/auth/logout")
    .set("Cookie", "token=test-token");

  assert.equal(response.statusCode, 403);
});

test("POST /api/auth/login rejects missing Origin", async () => {
  await User.create({
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  });

  const response = await request(app).post("/api/auth/login").send({
    email: "test@example.com",
    password: "password123",
  });

  assert.equal(response.statusCode, 403);
});
