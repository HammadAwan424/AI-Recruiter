import React, { useState } from "react";
import { GlassContainerCard } from "../../styles";
import { useJobs } from "../../hooks/useJobs";
import { useJobMutations } from "../../hooks/useJobMutations";
import { CreateJobForm } from "../../components/CreateJobForm";
import { JobListTable } from "../../components/JobListTable";
import { usePermission } from "../../../../shared/hooks/usePermission";
import { JOB_PERMISSIONS } from "../../permissions";
import { Lock, CheckCircle2 } from "lucide-react";

export const JobManagementPage: React.FC = () => {
  const { hasPermission } = usePermission();
  const canCreateJob = hasPermission(JOB_PERMISSIONS.CREATE);

  const [activeTab, setActiveTab] = useState<"Create Job" | "Job Posts font-semibold">(() =>
    canCreateJob ? "Create Job" : "Job Posts font-semibold"
  );
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "PENDING_APPROVAL">("ALL");

  const { jobs, isLoading, refetch } = useJobs();
  const { createJob, deleteJob } = useJobMutations();

  const publishedJobs = jobs.filter((j) => j.status === "published" || j.status === "open");
  const pendingJobs = jobs.filter((j) => j.status === "pending_approval");

  const filteredJobs = jobs.filter((j) => {
    if (statusFilter === "PUBLISHED") return j.status === "published" || j.status === "open";
    if (statusFilter === "PENDING_APPROVAL") return j.status === "pending_approval";
    return true;
  });

  return (
    <div className="relative flex flex-col gap-6 sm:gap-8 p-4 sm:p-6">
      {/* ===== HEADER NAVIGATION & STATUS FILTERS ===== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/40 p-3 sm:p-4 rounded-2xl backdrop-blur-md border border-[#05DC7F]/20 shadow-[0_0_15px_rgba(5,220,127,0.15)]">
        {/* Main Tabs */}
        <div className="flex flex-wrap gap-2">
          {canCreateJob && (
            <button
              onClick={() => setActiveTab("Create Job")}
              className={`px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 ${
                activeTab === "Create Job"
                  ? "bg-[#05DC7F] text-black shadow-[0_0_12px_rgba(5,220,127,0.3)]"
                  : "text-gray-400 hover:bg-[#05DC7F]/10 hover:text-white"
              }`}
            >
              Create Job Wizard
            </button>
          )}

          <button
            onClick={() => setActiveTab("Job Posts font-semibold")}
            className={`px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 ${
              activeTab === "Job Posts font-semibold"
                ? "bg-[#05DC7F] text-black shadow-[0_0_12px_rgba(5,220,127,0.3)]"
                : "text-gray-400 hover:bg-[#05DC7F]/10 hover:text-white"
            }`}
          >
            Requisitions ({jobs.length})
          </button>
        </div>

        {/* Status Filter Pills (Active when viewing Requisitions) */}
        {activeTab === "Job Posts font-semibold" && (
          <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-gray-800 text-xs">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                statusFilter === "ALL"
                  ? "bg-white/15 text-white border border-white/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              All ({jobs.length})
            </button>
            <button
              onClick={() => setStatusFilter("PUBLISHED")}
              className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                statusFilter === "PUBLISHED"
                  ? "bg-[#05DC7F]/20 text-[#05DC7F] border border-[#05DC7F]/40"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <CheckCircle2 size={12} /> Published ({publishedJobs.length})
            </button>
            <button
              onClick={() => setStatusFilter("PENDING_APPROVAL")}
              className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                statusFilter === "PENDING_APPROVAL"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Lock size={12} /> Pending Approval ({pendingJobs.length})
            </button>
          </div>
        )}
      </div>

      {/* ===== TAB CONTENT ===== */}
      <GlassContainerCard>
        {activeTab === "Create Job" && canCreateJob && <CreateJobForm onSubmit={createJob} />}
        {activeTab === "Job Posts font-semibold" && (
          <JobListTable
            jobs={filteredJobs}
            isLoading={isLoading}
            onDeleteJob={deleteJob}
            onRefresh={refetch}
          />
        )}
      </GlassContainerCard>
    </div>
  );
};

export default JobManagementPage;
