import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import AddProjectMemberForm from "./AddProjectMemberForm";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("adds a project member successfully", async () => {
  const newMember = {
    user: "member-456",
    role: "Editor",
  };

  const onMemberAdded = vi.fn();

  const fetchMock = vi.fn(async () => ({
    ok: true,
    status: 201,
    json: async () => ({
      member: newMember,
    }),
  }));

  vi.stubGlobal("fetch", fetchMock);

  render(
    <AddProjectMemberForm
      projectId="project-123"
      onMemberAdded={onMemberAdded}
    />,
  );

  fireEvent.change(screen.getByLabelText("Member Email"), {
    target: { value: "rahul@example.com" },
  });

  fireEvent.change(screen.getByLabelText("Role"), {
    target: { value: "Editor" },
  });

  fireEvent.click(
    screen.getByRole("button", {
      name: "Add Member",
    }),
  );

  await waitFor(() => {
    expect(onMemberAdded).toHaveBeenCalledWith(newMember);
  });

  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining("/api/projects/project-123/members"),
    expect.objectContaining({
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        email: "rahul@example.com",
        role: "Editor",
      }),
    }),
  );
});

test("shows error when member already exists", async () => {
  const onMemberAdded = vi.fn();

  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: false,
      status: 409,
      json: async () => ({
        message: "User is already a project member",
      }),
    })),
  );

  render(
    <AddProjectMemberForm
      projectId="project-123"
      onMemberAdded={onMemberAdded}
    />,
  );

  fireEvent.change(screen.getByLabelText("Member Email"), {
    target: { value: "rahul@example.com" },
  });

  fireEvent.click(
    screen.getByRole("button", {
      name: "Add Member",
    }),
  );

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "User is already a project member",
  );

  expect(onMemberAdded).not.toHaveBeenCalled();
});
