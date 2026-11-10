import { useState } from "react";

function AddProjectMemberForm({ projectId, onMemberAdded }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Viewer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/members`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email.trim(), role }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add member");
      }

      onMemberAdded(data.member);
      setEmail("");
      setRole("Viewer");
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <label htmlFor="member-email" className="block text-sm font-medium">
        Member Email
      </label>

      <input
        id="member-email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="member@example.com"
        className="w-full rounded-lg border border-slate-300 p-3"
      />

      <label htmlFor="member-role" className="block text-sm font-medium">
        Role
      </label>

      <select
        id="member-role"
        value={role}
        onChange={(event) => setRole(event.target.value)}
        className="w-full rounded-lg border border-slate-300 p-3"
      >
        <option value="Viewer">Viewer</option>
        <option value="Editor">Editor</option>
      </select>

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {isSubmitting ? "Adding..." : "Add Member"}
      </button>
    </form>
  );
}

export default AddProjectMemberForm;
