import { useState, useEffect } from "react";
import ProjectsContext from "./ProjectsContext";
import useAuth from "../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL;

const normalizeProject = (project) => {
  return {
    ...project,
    id: project._id,
    priority: project.priority ?? "Medium",
  };
};

function ProjectsProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [sort, setSort] = useState("newest");
  const [error, setError] = useState("");
  const [loadedForUserId, setLoadedForUserId] = useState(null);
  const { user, isLoading: isAuthLoading } = useAuth();
  const userId = user?._id ?? user?.id ?? null;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [search]);

  useEffect(() => {
    if (isAuthLoading || !userId) {
      return;
    }

    const fetchProjects = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/projects?page=${pagination.page}&limit=${pagination.limit}&search=${encodeURIComponent(debouncedSearch)}&status=${encodeURIComponent(status)}&priority=${encodeURIComponent(priority)}&sort=${encodeURIComponent(sort)}`,
          {
            credentials: "include",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch projects");
        }

        const normalizedProjects = data.projects.map(normalizeProject);
        setProjects(normalizedProjects);
        setPagination(data.pagination);
        setError("");
        setLoadedForUserId(userId);
      } catch (error) {
        setProjects([]);
        setError(error.message);
        setLoadedForUserId(userId);
      }
    };

    fetchProjects();
  }, [
    userId,
    isAuthLoading,
    pagination.page,
    pagination.limit,
    debouncedSearch,
    status,
    priority,
    sort,
  ]);

  const addProject = async (project) => {
    const response = await fetch(`${API_URL}/api/projects`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(project),
    });

    const savedProject = await response.json();
    if (!response.ok) {
      throw new Error(savedProject.message || "Failed to create project");
    }
    const normalizedProject = normalizeProject(savedProject);
    setProjects((prev) => [normalizedProject, ...prev]);
  };

  const removeProject = async (projectId) => {
    const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Failed to delete project");
    }

    setProjects((prev) => prev.filter((project) => project.id !== projectId));
  };

  const updateProject = async (projectId, updatedProject) => {
    const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedProject),
    });

    const savedProject = await response.json();

    if (!response.ok) {
      throw new Error(savedProject.message || "Failed to update project");
    }

    const normalizedProject = normalizeProject(savedProject);
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId ? normalizedProject : project,
      ),
    );
  };

  const changePage = (newPage) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const changeSearch = (newSearch) => {
    setSearch(newSearch);

    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  const changeStatus = (newStatus) => {
    setStatus(newStatus);

    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  const changePriority = (newPriority) => {
    setPriority(newPriority);

    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  const changeSort = (newSort) => {
    setSort(newSort);

    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };
  const hasLoadedCurrentUser = Boolean(userId) && loadedForUserId === userId;
  const visibleProjects = hasLoadedCurrentUser ? projects : [];
  const visibleError = hasLoadedCurrentUser ? error : "";
  const isLoading = isAuthLoading || (Boolean(userId) && !hasLoadedCurrentUser);

  const value = {
    projects: visibleProjects,
    pagination,
    search,
    changePage,
    changeSearch,
    status,
    changeStatus,
    error: visibleError,
    isLoading,
    addProject,
    removeProject,
    updateProject,
    priority,
    changePriority,
    sort,
    changeSort,
  };
  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}

export default ProjectsProvider;
