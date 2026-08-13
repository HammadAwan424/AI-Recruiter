import React from "react";
import { Users, UserX, BarChart3 } from "lucide-react";
import { STAGES } from "../hooks/useCandidatePipeline";

interface PipelineStatsSummaryProps {
  applications: any[];
}

export const PipelineStatsSummary: React.FC<PipelineStatsSummaryProps> = ({ applications = [] }) => {
  const total = applications.length;

  const countsByStage: Record<string, number> = {};
  STAGES.forEach((s) => {
    countsByStage[s.key] = 0;
  });

  let rejected = 0;

  applications.forEach((app: any) => {
    const isRejected = app.rejected || app.disposition === "rejected";
    if (isRejected) {
      rejected += 1;
    } else {
      const status = app.current_status || app.status || "applied";
      if (countsByStage[status] !== undefined) {
        countsByStage[status] += 1;
      } else {
        countsByStage[status] = 1;
      }
    }
  });

  const rejectionRate = total > 0 ? ((rejected / total) * 100).toFixed(1) : "0.0";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-3 w-full">
      {/* 1. Total Applications Card */}
      <div className="p-3.5 rounded-2xl bg-[#111827]/90 border border-white/10 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Total CVs</span>
          <Users size={14} className="text-[#05DC7F]" />
        </div>
        <span className="text-xl font-mono font-extrabold text-white mt-1">{total}</span>
      </div>

      {/* 3. Rejected Count */}
      <div className="p-3.5 rounded-2xl bg-[#111827]/90 border border-red-500/20 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-red-400/80 uppercase tracking-wider">Rejected</span>
          <UserX size={14} className="text-red-400" />
        </div>
        <span className="text-xl font-mono font-extrabold text-red-400 mt-1">{rejected}</span>
      </div>

      {/* 4. Rejection Rate Card */}
      <div className="p-3.5 rounded-2xl bg-[#111827]/90 border border-amber-500/20 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-amber-300/80 uppercase tracking-wider">Rejection Rate</span>
          <BarChart3 size={14} className="text-amber-400" />
        </div>
        <span className="text-xl font-mono font-extrabold text-amber-300 mt-1">{rejectionRate}%</span>
      </div>
    </div>
  );
};

export default PipelineStatsSummary;
