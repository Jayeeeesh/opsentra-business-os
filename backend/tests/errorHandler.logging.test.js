const { test } = require("node:test");
const assert = require("node:assert/strict");
const { errorHandler } = require("../middleware/errorHandler");

function testLogging(statusCode) {
  const loggedLevels = [];

  const req = {
    path: "/api/example",
    log: {
      warn: () => loggedLevels.push("warn"),
      error: () => loggedLevels.push("error"),
    },
  };

  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  const error = new Error("Test error");
  error.statusCode = statusCode;

  const previousEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";

  try {
    errorHandler(error, req, res, () => {});
  } finally {
    if (previousEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousEnv;
    }
  }

  return { loggedLevels, res };
}

test("404 errors are logged as WARN", () => {
  const { loggedLevels, res } = testLogging(404);

  assert.deepEqual(loggedLevels, ["warn"]);
  assert.equal(res.statusCode, 404);
});

test("500 errors are logged as ERROR", () => {
  const { loggedLevels, res } = testLogging(500);

  assert.deepEqual(loggedLevels, ["error"]);
  assert.equal(res.statusCode, 500);
});
