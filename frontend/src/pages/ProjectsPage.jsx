import { useState } from "react";
import ProjectCard from "../components/projects/ProjectCard";
import { Link } from "react-router";
import useProjects from "../hooks/useProjects";
import useNotification from "../hooks/useNotification";
import ConfirmationModal from "../components/ui/ConfirmationModal";

function ProjectsPage() {
  const {
    projects,
    pagination,
    search,
    changePage,
    changeSearch,
    error,
    isLoading,
    removeProject,
    status,
    changeStatus,
    priority,
    changePriority,
    sort,
    changeSort,
  } = useProjects();
  const [projectToDelete, setProjectToDelete] = useState(null);
  const { showNotification } = useNotification();

  const hasActiveFilters =
    search.trim() !== "" || status !== "All" || priority !== "All";

  const handleDeleteRequest = (projectId) => {
    const selectedProject = projects.find(
      (project) => project.id === projectId,
    );

    setProjectToDelete(selectedProject ?? null);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) {
      return;
    }

    try {
      await removeProject(projectToDelete.id);

      showNotification("Project deleted successfully.");
      setProjectToDelete(null);
    } catch (error) {
      showNotification(error.message || "Failed to delete project.");
    }
  };

  const handleCancelDelete = () => {
    setProjectToDelete(null);
  };

  const handleClearFilters = () => {
    changeSearch("");
    changeStatus("All");
    changePriority("All");
  };

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Projects</h1>

          <p className="mt-2 text-slate-600">
            Manage and track business projects from one place.
          </p>
        </div>

        <Link
          to="/projects/new"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Add Project
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {isLoading && (
        <p className="mt-6 text-sm text-slate-500">Loading projects...</p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(e) => changeSearch(e.target.value)}
          placeholder="Search by project or client..."
          aria-label="Search projects by project or client name"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <select
          value={status}
          onChange={(e) => changeStatus(e.target.value)}
          aria-label="Filter projects by status"
          className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-52"
        >
          <option value="All">All statuses</option>
          <option value="In Progress">In Progress</option>
          <option value="Planning">Planning</option>
          <option value="On Hold">On Hold</option>
          <option value="Completed">Completed</option>
        </select>

        <select
          value={priority}
          onChange={(e) => changePriority(e.target.value)}
          aria-label="Filter projects by priority"
          className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-52"
        >
          <option value="All">All priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <select
          value={sort}
          onChange={(e) => changeSort(e.target.value)}
          aria-label="Sort projects"
          className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-52"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="deadline-soonest">Deadline soonest</option>
          <option value="budget-high">Budget high to low</option>
          <option value="budget-low">Budget low to high</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleClearFilters}
          className="mt-3 inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
        >
          Clear Filters
        </button>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {!isLoading &&
          !error &&
          (projects.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3">
              <h2 className="text-lg font-semibold text-slate-900">
                {hasActiveFilters ? "No matching projects" : "No projects yet"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {hasActiveFilters
                  ? "Try changing your search, status, or priority filter."
                  : "Create your first project to get started."}
              </p>

              {!hasActiveFilters && (
                <Link
                  to="/projects/new"
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Create Project
                </Link>
              )}
            </div>
          ) : (
            projects.map(
              ({
                id,
                name,
                client,
                status,
                priority,
                deadline,
                budget,
                progress,
              }) => (
                <ProjectCard
                  key={id}
                  id={id}
                  name={name}
                  client={client}
                  status={status}
                  priority={priority}
                  deadline={deadline}
                  budget={budget}
                  progress={progress}
                  onRemove={handleDeleteRequest}
                />
              ),
            )
          ))}
      </div>
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            disabled={pagination.page === 1}
            onClick={() => changePage(pagination.page - 1)}
            className="rounded-lg border px-4 py-2 disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <button
            type="button"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => changePage(pagination.page + 1)}
            className="rounded-lg border px-4 py-2 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
      {projectToDelete && (
        <ConfirmationModal
          title="Delete Project"
          message={`Are you sure you want to delete ${projectToDelete.name}?`}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />
      )}
    </section>
  );
}

export default ProjectsPage;
