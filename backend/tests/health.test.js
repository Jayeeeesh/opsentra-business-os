const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { connectTestDb, disconnectTestDb } = require("./helpers/testDb");
const app = require("../app");

test("GET /api/health returns API health status", async () => {
  const response = await request(app).get("/api/health");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    status: "ok",
  });
});

test("GET /api/ready returns 503 when MongoDB is disconnected", async () => {
  const response = await request(app).get("/api/ready");

  assert.equal(response.status, 503);
  assert.deepEqual(response.body, {
    status: "not_ready",
  });
});

test("GET /api/ready returns 200 when MongoDB is connected", async () => {
  await connectTestDb();

  try {
    const response = await request(app).get("/api/ready");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      status: "ready",
    });
  } finally {
    await disconnectTestDb();
  }
});
