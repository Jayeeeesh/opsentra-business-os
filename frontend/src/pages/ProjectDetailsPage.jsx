import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import ProjectTasks from "../components/tasks/ProjectTasks";
import useAuth from "../hooks/useAuth";
import AddProjectMemberForm from "../components/projects/AddProjectMemberForm";

function ProjectDetailsPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [projectData, setProjectData] = useState(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [error, setError] = useState("");
  const [memberError, setMemberError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchProject = async () => {
      setProjectLoading(true);
      setError("");
      setProjectData(null);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/projects/${projectId}`,
          {
            credentials: "include",
            signal: controller.signal,
          },
        );

        if (response.status === 404) return;

        if (!response.ok) {
          throw new Error("Failed to fetch project");
        }

        const data = await response.json();

        if (!controller.signal.aborted) {
          setProjectData(data);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setProjectLoading(false);
        }
      }
    };

    fetchProject();

    return () => controller.abort();
  }, [projectId]);

  const project = projectData ? { ...projectData, id: projectData._id } : null;

  const isOwner =
    !!project && !!user?.id && String(project.owner) === String(user.id);

  const member = project?.members?.find(
    (item) => String(item.user) === String(user?.id),
  );

  const projectRole = isOwner ? "Owner" : (member?.role ?? null);

  const canEditTasks = projectRole === "Owner" || projectRole === "Editor";

  const handleRoleChange = async (memberUserId, newRole) => {
    if (!isOwner) return;

    setMemberError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/members/${memberUserId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update member role");
      }

      setProjectData((prev) => ({
        ...prev,
        members: prev.members.map((member) =>
          String(member.user) === String(memberUserId)
            ? { ...member, role: data.member.role }
            : member,
        ),
      }));
    } catch (error) {
      setMemberError(error.message);
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    if (!isOwner) return;

    const confirmed = window.confirm(
      "Are you sure you want to remove this member?",
    );

    if (!confirmed) return;

    setMemberError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/members/${memberUserId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to remove member");
      }

      setProjectData((prev) => ({
        ...prev,
        members: prev.members.filter(
          (member) => String(member.user) !== String(memberUserId),
        ),
      }));
    } catch (error) {
      setMemberError(error.message);
    }
  };

  if (projectLoading) {
    return (
      <section>
        <p className="text-sm text-slate-500">Loading project...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      </section>
    );
  }

  if (!project) {
    return (
      <section>
        <h1 className="text-3xl font-bold text-slate-900">Project Not Found</h1>

        <p className="mt-2 text-slate-600">
          The requested project does not exist.
        </p>

        <Link
          to="/projects"
          className="mt-6 inline-block rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
        >
          Back to Projects
        </Link>
      </section>
    );
  }
  const formattedDeadline = new Date(project.deadline).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
  const progress = project.progress ?? 0;

  return (
    <section>
      <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
      <p className="mt-2 text-slate-600">Client: {project.client}</p>
      <p className="mt-2 text-slate-600">Status: {project.status}</p>
      <p className="mt-2 text-slate-600">Priority: {project.priority}</p>
      <p className="mt-2 text-slate-600">Deadline: {formattedDeadline}</p>
      <p className="mt-2 text-slate-600">
        Budget: ₹{project.budget.toLocaleString("en-IN")}
      </p>

      <div className="mt-6 max-w-md">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-slate-600">Progress</span>
          <span className="font-medium text-slate-900">{progress}%</span>
        </div>

        <div
          className="h-2 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-label={`${project.name} progress`}
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900">Description</h2>

        <p className="mt-2 whitespace-pre-line text-slate-600">
          {project.description || "No description available."}
        </p>
      </div>

      <section className="mt-8 rounded-lg border border-slate-200 p-5">
        <h2 className="text-xl font-semibold text-slate-900">
          Team Members ({project.members?.length ?? 0})
        </h2>

        {memberError && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {memberError}
          </p>
        )}

        {isOwner && (
          <AddProjectMemberForm
            projectId={projectId}
            onMemberAdded={(newMember) => {
              setProjectData((prev) => ({
                ...prev,
                members: [...(prev.members ?? []), newMember],
              }));
            }}
          />
        )}

        {!project.members?.length ? (
          <p className="mt-3 text-sm text-slate-500">No team members yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {project.members.map((member, index) => (
              <li
                key={String(member.user)}
                className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
              >
                <span>Member {index + 1}</span>
                {isOwner ? (
                  <select
                    value={member.role}
                    onChange={(event) =>
                      handleRoleChange(member.user, event.target.value)
                    }
                    aria-label={`Role for member ${index + 1}`}
                    className="rounded-lg border border-slate-300 p-2 text-sm"
                  >
                    <option value="Viewer">Viewer</option>
                    <option value="Editor">Editor</option>
                  </select>
                ) : (
                  <span className="text-sm font-medium">{member.role}</span>
                )}

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.user)}
                    className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ProjectTasks projectId={projectId} canEditTasks={canEditTasks} />

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/projects"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
        >
          Back to Projects
        </Link>

        {isOwner && (
          <Link
            to={`/projects/${project.id}/edit`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Edit Project
          </Link>
        )}
      </div>
    </section>
  );
}

export default ProjectDetailsPage;
