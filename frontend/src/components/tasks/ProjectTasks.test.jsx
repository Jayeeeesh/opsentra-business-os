import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import ProjectTasks from "./ProjectTasks";

const task = {
  _id: "task-1",
  title: "Build Login API",
  status: "To Do",
  priority: "High",
};

function mockTaskApi() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url, options = {}) => {
      if (options.method === "PATCH") {
        return {
          ok: true,
          json: async () => ({
            ...task,
            status: JSON.parse(options.body).status,
          }),
        };
      }

      if (options.method === "DELETE") {
        return { ok: true };
      }

      if (url.includes("/api/projects/project-1/tasks")) {
        return {
          ok: true,
          json: async () => ({ tasks: [task] }),
        };
      }

      throw new Error("Unexpected API request");
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("displays project tasks", async () => {
  mockTaskApi();

  render(<ProjectTasks projectId="project-1" />);

  expect(await screen.findByText("Build Login API")).toBeInTheDocument();

  const highBadge = screen
    .getAllByText("High")
    .find((element) => element.tagName === "SPAN");

  expect(highBadge).toBeInTheDocument();
  expect(highBadge).toHaveClass("bg-red-100", "text-red-700");
});

test("updates task status", async () => {
  mockTaskApi();

  render(<ProjectTasks projectId="project-1" canEditTasks={true} />);

  const dropdown = await screen.findByRole("combobox", {
    name: "Status for Build Login API",
  });

  fireEvent.change(dropdown, {
    target: { value: "Completed" },
  });

  await waitFor(() => {
    expect(dropdown).toHaveValue("Completed");
  });
});

test("deletes a task after confirmation", async () => {
  mockTaskApi();

  vi.spyOn(window, "confirm").mockReturnValue(true);

  render(<ProjectTasks projectId="project-1" canEditTasks={true} />);

  await screen.findByText("Build Login API");

  fireEvent.click(
    screen.getByRole("button", {
      name: "Delete",
    }),
  );

  await waitFor(() => {
    expect(screen.queryByText("Build Login API")).not.toBeInTheDocument();
  });
});

test("Viewer can see tasks but cannot modify them", async () => {
  mockTaskApi();

  render(<ProjectTasks projectId="project-1" canEditTasks={false} />);

  // Viewer can see the task
  expect(await screen.findByText("Build Login API")).toBeInTheDocument();

  // Status is read-only
  expect(screen.getByText("Status: To Do")).toBeInTheDocument();

  // Editing controls are hidden
  expect(
    screen.queryByRole("button", { name: "Add Task" }),
  ).not.toBeInTheDocument();

  expect(
    screen.queryByRole("button", { name: "Delete" }),
  ).not.toBeInTheDocument();

  expect(
    screen.queryByRole("combobox", {
      name: "Status for Build Login API",
    }),
  ).not.toBeInTheDocument();
});
