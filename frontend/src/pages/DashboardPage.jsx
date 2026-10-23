import {
  FolderKanban,
  CircleCheck,
  TriangleAlert,
  ClockAlert,
} from "lucide-react";

import StatCard from "../components/dashboard/StatCard";
import RecentProjects from "../components/dashboard/RecentProjects";
import { useState, useEffect } from "react";

function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [latestProjects, setLatestProjects] = useState([]);
  const [isLatestProjectsLoading, setIsLatestProjectsLoading] = useState(true);
  const [latestProjectsError, setLatestProjectsError] = useState("");
  useEffect(() => {
    const controller = new AbortController();

    const fetchSummary = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/dashboard/summary`,
          {
            credentials: "include",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard summary");
        }

        const data = await response.json();

        if (!controller.signal.aborted) {
          setSummary(data);
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error(error);
        setSummaryError("Unable to load dashboard statistics.");
      } finally {
        if (!controller.signal.aborted) {
          setIsSummaryLoading(false);
        }
      }
    };

    fetchSummary();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchLatestProjects = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/projects?page=1&limit=4&sort=newest`,
          {
            credentials: "include",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch latest projects");
        }

        const data = await response.json();

        if (!controller.signal.aborted) {
          setLatestProjects(
            data.projects.map((project) => ({
              ...project,
              id: project._id,
            })),
          );
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load recent projects:", error);
          setLatestProjectsError("Unable to load recent projects.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLatestProjectsLoading(false);
        }
      }
    };

    fetchLatestProjects();

    return () => controller.abort();
  }, []);

  const activeProjectsCount = summary?.activeProjects ?? "—";

  const completedProjectsCount = summary?.completedProjects ?? "—";

  const highPriorityProjectsCount = summary?.highPriorityProjects ?? "—";

  const overdueProjectsCount = summary?.overdueProjects ?? "—";

  const dashboardStats = [
    {
      label: "Active Projects",
      value: activeProjectsCount,
      trend: "Currently in progress",
      icon: FolderKanban,
    },
    {
      label: "Completed Projects",
      value: completedProjectsCount,
      trend: "Finished successfully",
      icon: CircleCheck,
    },
    {
      label: "High Priority Projects",
      value: highPriorityProjectsCount,
      trend: "Needs close attention",
      icon: TriangleAlert,
    },
    {
      label: "Overdue Projects",
      value: overdueProjectsCount,
      trend: "Past deadline",
      icon: ClockAlert,
    },
  ];

  return (
    <section>
      <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>

      <p className="mt-2 text-slate-600">
        Welcome to the Opsentra business dashboard.
      </p>

      {isSummaryLoading && (
        <p role="status" className="mt-4 text-sm text-slate-500">
          Loading dashboard statistics...
        </p>
      )}

      {summaryError && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {summaryError}
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map(({ label, value, trend, icon }) => (
          <StatCard
            key={label}
            label={label}
            value={value}
            trend={trend}
            icon={icon}
          />
        ))}
      </div>

      {isLatestProjectsLoading ? (
        <p role="status" className="mt-6 text-sm text-slate-500">
          Loading recent projects...
        </p>
      ) : latestProjectsError ? (
        <p role="alert" className="mt-6 text-sm text-red-600">
          {latestProjectsError}
        </p>
      ) : latestProjects.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No recent projects yet.</p>
      ) : (
        <RecentProjects projects={latestProjects} />
      )}
    </section>
  );
}

export default DashboardPage;
