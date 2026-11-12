const request = require("supertest");

function browserAgent(app) {
  const agent = request.agent(app);
  const origin = new URL(process.env.CLIENT_URL || "http://localhost:5173")
    .origin;

  for (const method of ["post", "put", "patch", "delete"]) {
    const original = agent[method].bind(agent);

    agent[method] = (...args) => original(...args).set("Origin", origin);
  }

  return agent;
}

module.exports = browserAgent;
