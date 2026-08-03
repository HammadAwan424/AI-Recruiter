import React, { useState } from "react";
import { Stack, Typography, Box } from "@mui/material";
import { GlassContainerCard } from "../../styles";
import { useJobs } from "../../hooks/useJobs";
import { useJobMutations } from "../../hooks/useJobMutations";
import { CreateJobForm } from "../../components/CreateJobForm";
import { JobListTable } from "../../components/JobListTable";
import { usePermission } from "../../../../shared/hooks/usePermission";
import { JOB_PERMISSIONS } from "../../permissions";

export const JobManagementPage: React.FC = () => {
  const { hasPermission } = usePermission();
  const canCreateJob = hasPermission(JOB_PERMISSIONS.CREATE);

  const [activeTab, setActiveTab] = useState<"Create Job" | "Job Posts">(() =>
    canCreateJob ? "Create Job" : "Job Posts"
  );
  const { jobs, isLoading } = useJobs();
  const { createJob, deleteJob } = useJobMutations();

  return (
    <div className="relative flex flex-col gap-6 sm:gap-8 p-4 sm:p-6">
      {/* ===== PILL HEADER TABS ===== */}
      <div className="flex flex-wrap gap-3 sm:gap-4 bg-black/30 p-2 sm:p-3 rounded-xl backdrop-blur-sm border border-[#05DC7F]/20 shadow-[0_0_10px_rgba(5,220,127,0.15)]">
        {canCreateJob && (
          <button
            onClick={() => setActiveTab("Create Job")}
            className={`px-4 sm:px-5 py-2 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 ${
              activeTab === "Create Job"
                ? "bg-[#05DC7F]/20 text-white border border-[#05DC7F]"
                : "text-gray-400 hover:bg-[#05DC7F]/10 hover:text-white"
            }`}
          >
            Create Job
          </button>
        )}

        <button
          onClick={() => setActiveTab("Job Posts")}
          className={`px-4 sm:px-5 py-2 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 ${
            activeTab === "Job Posts"
              ? "bg-[#05DC7F]/20 text-white border border-[#05DC7F]"
              : "text-gray-400 hover:bg-[#05DC7F]/10 hover:text-white"
          }`}
        >
          Job Posts ({jobs.length})
        </button>
      </div>

      {/* ===== TAB CONTENT ===== */}
      <GlassContainerCard>
        {activeTab === "Create Job" && canCreateJob && <CreateJobForm onSubmit={createJob} />}
        {activeTab === "Job Posts" && (
          <JobListTable jobs={jobs} isLoading={isLoading} onDeleteJob={deleteJob} />
        )}
      </GlassContainerCard>
    </div>
  );
};
