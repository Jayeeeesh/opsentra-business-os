import { render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import DashboardPage from "./DashboardPage";

const summaryData = {
  activeProjects: 1,
  completedProjects: 2,
  highPriorityProjects: 3,
  overdueProjects: 1,
  totalProjects: 10,
};

const mockApi = ({
  projects = [],
  summaryFails = false,
  projectsFail = false,
  pending = false,
} = {}) => {
  vi.stubGlobal(
    "fetch",
    vi.fn((url) => {
      if (pending) return new Promise(() => {});

      if (url.includes("/api/dashboard/summary")) {
        if (summaryFails) {
          return Promise.reject(new Error("Summary API failed"));
        }

        return Promise.resolve({
          ok: true,
          json: async () => summaryData,
        });
      }

      if (url.includes("/api/projects?")) {
        if (projectsFail) {
          return Promise.reject(new Error("Projects API failed"));
        }

        return Promise.resolve({
          ok: true,
          json: async () => ({ projects }),
        });
      }

      return Promise.reject(new Error(`Unexpected API: ${url}`));
    }),
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("displays dashboard statistics", async () => {
  mockApi();
  render(<DashboardPage />);

  const active = screen.getByText("Active Projects").closest("article");
  const completed = screen.getByText("Completed Projects").closest("article");
  const priority = screen
    .getByText("High Priority Projects")
    .closest("article");
  const overdue = screen.getByText("Overdue Projects").closest("article");

  expect(await within(active).findByText("1")).toBeInTheDocument();
  expect(within(completed).getByText("2")).toBeInTheDocument();
  expect(within(priority).getByText("3")).toBeInTheDocument();
  expect(within(overdue).getByText("1")).toBeInTheDocument();
});

test("fetches the latest four projects independently", async () => {
  const projects = [
    {
      _id: "1",
      name: "Hotel",
      client: "A",
      status: "Planning",
      deadline: "2026-12-01",
      progress: 10,
    },
    {
      _id: "2",
      name: "School",
      client: "B",
      status: "Completed",
      deadline: "2026-12-02",
      progress: 100,
    },
    {
      _id: "3",
      name: "Hospital",
      client: "C",
      status: "In Progress",
      deadline: "2026-12-03",
      progress: 40,
    },
    {
      _id: "4",
      name: "Mall",
      client: "D",
      status: "On Hold",
      deadline: "2026-12-04",
      progress: 20,
    },
  ];

  mockApi({ projects });
  render(<DashboardPage />);

  expect(await screen.findByText("Hotel")).toBeInTheDocument();
  expect(screen.getByText("School")).toBeInTheDocument();
  expect(screen.getByText("Hospital")).toBeInTheDocument();
  expect(screen.getByText("Mall")).toBeInTheDocument();

  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining("/api/projects?page=1&limit=4&sort=newest"),
    expect.objectContaining({
      credentials: "include",
      signal: expect.any(AbortSignal),
    }),
  );

  expect(screen.getAllByRole("row")).toHaveLength(5);
});

test("shows both loading messages", () => {
  mockApi({ pending: true });
  render(<DashboardPage />);

  expect(
    screen.getByText("Loading dashboard statistics..."),
  ).toBeInTheDocument();
  expect(screen.getByText("Loading recent projects...")).toBeInTheDocument();
});

test("shows error when summary API fails", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  mockApi({ summaryFails: true });
  render(<DashboardPage />);

  expect(
    await screen.findByText("Unable to load dashboard statistics."),
  ).toBeInTheDocument();

  expect(
    screen.queryByText("Loading dashboard statistics..."),
  ).not.toBeInTheDocument();
  expect(
    await screen.findByText("No recent projects yet."),
  ).toBeInTheDocument();
});

test("shows error when recent projects API fails", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  mockApi({ projectsFail: true });
  render(<DashboardPage />);

  expect(
    await screen.findByText("Unable to load recent projects."),
  ).toBeInTheDocument();

  expect(
    screen.queryByText("Loading recent projects..."),
  ).not.toBeInTheDocument();
});

test("shows empty state when no projects exist", async () => {
  mockApi({ projects: [] });
  render(<DashboardPage />);

  expect(
    await screen.findByText("No recent projects yet."),
  ).toBeInTheDocument();
});
