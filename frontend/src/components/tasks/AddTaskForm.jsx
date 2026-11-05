import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function AddTaskForm({ projectId, onTaskCreated }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim()) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/projects/${projectId}/tasks`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            priority: priority,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create task");
      }

      onTaskCreated(data);
      setTitle("");
      setPriority("Medium");
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
      <label htmlFor="task-title" className="font-medium">
        Task Title
      </label>

      <input
        id="task-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={120}
        placeholder="Enter task title"
        className="rounded-lg border border-slate-300 p-3"
      />

      <label htmlFor="task-priority">Priority</label>

      <select
        id="task-priority"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        className="rounded-lg border border-slate-300 p-3"
      >
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !title.trim()}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {isSubmitting ? "Adding..." : "Add Task"}
      </button>
    </form>
  );
}

export default AddTaskForm;
