import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import ProjectTasks from "./ProjectTasks";

const task = {
  _id: "task-1",
  title: "Build Login API",
  status: "To Do",
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
});

test("updates task status", async () => {
  mockTaskApi();

  render(<ProjectTasks projectId="project-1" />);

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

  render(<ProjectTasks projectId="project-1" />);

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
