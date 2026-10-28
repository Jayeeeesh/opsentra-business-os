import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import { afterEach, expect, test, vi } from "vitest";
import ProjectDetailsPage from "./ProjectDetailsPage";

// Tasks ko mock kar rahe hain taaki sirf Project Details test ho.
vi.mock("../components/tasks/ProjectTasks", () => ({
  default: () => null,
}));

const project = {
  _id: "project-123",
  name: "Hotel Website",
  client: "ABC Company",
  status: "In Progress",
  priority: "High",
  deadline: "2026-12-01",
  budget: 25000,
  progress: 40,
  description: "Hotel management application",
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/projects/project-123"]}>
      <Routes>
        <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("shows loading while fetching a project", () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => {})),
  );

  renderPage();

  expect(screen.getByText("Loading project...")).toBeInTheDocument();
});

test("fetches project by ID and displays details", async () => {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => project,
  }));

  vi.stubGlobal("fetch", fetchMock);
  renderPage();

  expect(
    await screen.findByRole("heading", { name: "Hotel Website" }),
  ).toBeInTheDocument();

  expect(screen.getByText("Client: ABC Company")).toBeInTheDocument();

  expect(screen.getByRole("link", { name: "Edit Project" })).toHaveAttribute(
    "href",
    "/projects/project-123/edit",
  );

  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining("/api/projects/project-123"),
    expect.objectContaining({
      credentials: "include",
      signal: expect.any(AbortSignal),
    }),
  );
});

test("shows Project Not Found for 404", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: false,
      status: 404,
    })),
  );

  renderPage();

  expect(
    await screen.findByRole("heading", { name: "Project Not Found" }),
  ).toBeInTheDocument();
});

test("shows an error for server failure", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: false,
      status: 500,
    })),
  );

  renderPage();

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Failed to fetch project",
  );
});

test("shows an error for network failure", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new Error("Network unavailable");
    }),
  );

  renderPage();

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Network unavailable",
  );
});

test("aborts the request when the page unmounts", () => {
  const fetchMock = vi.fn(() => new Promise(() => {}));
  vi.stubGlobal("fetch", fetchMock);

  const { unmount } = renderPage();
  const signal = fetchMock.mock.calls[0][1].signal;

  expect(signal.aborted).toBe(false);

  unmount();

  expect(signal.aborted).toBe(true);
});
