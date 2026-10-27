import { useParams, Link } from "react-router";
import useProjects from "../hooks/useProjects";
import ProjectTasks from "../components/tasks/ProjectTasks";

function ProjectDetailsPage() {
  const { projectId } = useParams();
  const { projects, error, isLoading } = useProjects();

  const project = projects.find((item) => String(item.id) === projectId);

  if (isLoading) {
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

      <ProjectTasks projectId={projectId} />

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/projects"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
        >
          Back to Projects
        </Link>

        <Link
          to={`/projects/${project.id}/edit`}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Edit Project
        </Link>
      </div>
    </section>
  );
}

export default ProjectDetailsPage;
