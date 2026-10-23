import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import DashboardPage from "./DashboardPage";

const { mockProjects } = vi.hoisted(() => ({
  mockProjects: [],
}));

vi.mock("../hooks/useProjects", () => ({
  default: () => ({
    projects: mockProjects,
  }),
}));

beforeEach(() => {
  mockProjects.length = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("displays dashboard metrics from the summary API", async () => {
  mockProjects.push(
    {
      id: "1",
      name: "Project A",
      client: "Client A",
      status: "In Progress",
      priority: "High",
      deadline: "2026-09-20",
      createdAt: "2026-09-24T10:00:00Z",
      progress: 50,
    },
    {
      id: "2",
      name: "Project B",
      client: "Client B",
      status: "Completed",
      priority: "Medium",
      deadline: "2026-09-10",
      createdAt: "2026-09-23T10:00:00Z",
      progress: 100,
    },
    {
      id: "3",
      name: "Project C",
      client: "Client C",
      status: "Planning",
      priority: "High",
      deadline: "2026-09-30",
      createdAt: "2026-09-22T10:00:00Z",
      progress: 10,
    },
  );
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        activeProjects: 1,
        completedProjects: 1,
        highPriorityProjects: 2,
        overdueProjects: 1,
        totalProjects: 3,
      }),
    }),
  );

  render(<DashboardPage />);

  const activeCard = screen.getByText("Active Projects").closest("article");
  const completedCard = screen
    .getByText("Completed Projects")
    .closest("article");
  const highPriorityCard = screen
    .getByText("High Priority Projects")
    .closest("article");
  const overdueCard = screen.getByText("Overdue Projects").closest("article");
  expect(await within(activeCard).findByText("1")).toBeInTheDocument();
  expect(within(completedCard).getByText("1")).toBeInTheDocument();
  expect(within(highPriorityCard).getByText("2")).toBeInTheDocument();
  expect(within(overdueCard).getByText("1")).toBeInTheDocument();
});

test("shows loading message while the API is pending", () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => {})),
  );

  render(<DashboardPage />);

  expect(screen.getByRole("status")).toHaveTextContent(
    "Loading dashboard statistics...",
  );
});

test("shows error message when dashboard API fails", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

  render(<DashboardPage />);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Unable to load dashboard statistics.",
  );

  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
