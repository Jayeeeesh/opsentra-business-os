import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import AddTaskForm from "./AddTaskForm";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("creates a task and clears the form", async () => {
  const newTask = {
    _id: "task-2",
    title: "Fix Navbar",
    status: "To Do",
  };

  const onTaskCreated = vi.fn();

  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => newTask,
    }),
  );

  render(<AddTaskForm projectId="project-1" onTaskCreated={onTaskCreated} />);

  const input = screen.getByRole("textbox", {
    name: "Task Title",
  });

  fireEvent.change(input, {
    target: { value: "  Fix Navbar  " },
  });

  fireEvent.click(screen.getByRole("button", { name: "Add Task" }));

  await waitFor(() => {
    expect(onTaskCreated).toHaveBeenCalledWith(newTask);
  });

  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining("/api/projects/project-1/tasks"),
    expect.objectContaining({
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ title: "Fix Navbar" }),
    }),
  );

  expect(input).toHaveValue("");
});

test("shows error when task creation fails", async () => {
  const onTaskCreated = vi.fn();

  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        message: "Failed to create task",
      }),
    }),
  );

  render(<AddTaskForm projectId="project-1" onTaskCreated={onTaskCreated} />);

  const input = screen.getByRole("textbox", {
    name: "Task Title",
  });

  fireEvent.change(input, {
    target: { value: "Fix Navbar" },
  });

  fireEvent.click(screen.getByRole("button", { name: "Add Task" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Failed to create task",
  );

  expect(onTaskCreated).not.toHaveBeenCalled();
  expect(input).toHaveValue("Fix Navbar");
});
