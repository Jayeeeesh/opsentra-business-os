import { useEffect, useState } from "react";
import AddTaskForm from "./AddTaskForm";

const API_URL = import.meta.env.VITE_API_URL;

function ProjectTasks({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [deletingTaskId, setDeletingTaskId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchTasks = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/api/projects/${projectId}/tasks`,
          {
            credentials: "include",
            signal: controller.signal,
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch tasks");
        }

        setTasks(data.tasks);
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchTasks();

    return () => controller.abort();
  }, [projectId]);

  const handleStatusChange = async (taskId, status) => {
    setActionError("");
    try {
      const response = await fetch(
        `${API_URL}/api/projects/${projectId}/tasks/${taskId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );

      const updatedTask = await response.json();

      if (!response.ok) {
        throw new Error(updatedTask.message || "Failed to update task");
      }

      setTasks((prev) =>
        prev.map((task) => (task._id === taskId ? updatedTask : task)),
      );
    } catch (error) {
      setActionError(error.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?",
    );

    if (!confirmed) return;

    setActionError("");
    setDeletingTaskId(taskId);

    try {
      const response = await fetch(
        `${API_URL}/api/projects/${projectId}/tasks/${taskId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(data.message || "Failed to delete task");
      }

      setTasks((prev) => prev.filter((task) => task._id !== taskId));
    } catch (error) {
      setActionError(error.message);
    } finally {
      setDeletingTaskId(null);
    }
  };

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">Project Tasks</h2>
      {actionError && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {actionError}
        </p>
      )}
      <AddTaskForm
        projectId={projectId}
        onTaskCreated={(newTask) => {
          setTasks((prev) => [newTask, ...prev]);
        }}
      />

      {isLoading && <p>Loading tasks...</p>}

      {error && <p role="alert">{error}</p>}

      {!isLoading && !error && tasks.length === 0 && <p>No tasks yet.</p>}

      {!isLoading && !error && (
        <ul className="mt-4 space-y-3">
          {tasks.map((task) => (
            <li key={task._id} className="rounded-lg border p-3">
              <p className="font-medium">{task.title}</p>
              <select
                value={task.status}
                onChange={(event) =>
                  handleStatusChange(task._id, event.target.value)
                }
                aria-label={`Status for ${task.title}`}
                className="mt-2 rounded-lg border border-slate-300 p-2"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
              <button
                type="button"
                onClick={() => handleDeleteTask(task._id)}
                disabled={deletingTaskId === task._id}
                className="ml-3 rounded-lg border border-red-300 px-3 py-2 text-red-600 disabled:opacity-50"
              >
                {deletingTaskId === task._id ? "Deleting..." : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default ProjectTasks;
