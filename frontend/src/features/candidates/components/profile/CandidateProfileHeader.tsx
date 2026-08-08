import React from "react";
import { Trophy, CheckCircle, XCircle } from "lucide-react";
import { ApplicationDetail } from "../../../../shared/types/candidate.types";

interface CandidateProfileHeaderProps {
  detail: ApplicationDetail;
  canDisposition: boolean;
  onHire?: (detail: ApplicationDetail) => void;
  onReject?: (detail: ApplicationDetail) => void;
}

export const CandidateProfileHeader: React.FC<CandidateProfileHeaderProps> = ({
  detail,
}) => {
  const isHired = detail.current_status === "hired";
  const isRejected = detail.disposition === "rejected";
  const rawScore = detail.final_score ?? detail.screening?.match_score;
  const matchScore = rawScore != null ? Number(rawScore) : null;

  return (
    <div className="pb-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      {/* Left: Candidate & Requisition Info */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#05DC7F]/10 border border-[#05DC7F]/30 flex items-center justify-center shrink-0">
          <Trophy size={22} className="text-[#05DC7F]" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-bold text-white">Application #{detail.id}</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-[#05DC7F]/20 text-[#05DC7F] border border-[#05DC7F]/40 font-mono font-bold uppercase">
              {detail.current_status}
            </span>
            {isHired && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold flex items-center gap-1">
                <CheckCircle size={10} /> Hired
              </span>
            )}
            {isRejected && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 font-bold flex items-center gap-1">
                <XCircle size={10} /> Rejected
              </span>
            )}
          </div>
          <p className="text-xs text-white/50 mt-1">
            Candidate ID: <span className="text-white/80 font-mono">#{detail.candidate_id}</span> • Requisition ID: <span className="text-white/80 font-mono">#{detail.job_id}</span>
          </p>
        </div>
      </div>

      {/* Right: Overall Final / Match Score Display */}
      {matchScore != null && !isNaN(matchScore) && (
        <div className="text-left sm:text-right shrink-0">
          <p className="text-[11px] text-white/40 font-semibold uppercase tracking-wider">Overall Match Score</p>
          <p className="text-2xl font-extrabold text-[#05DC7F] font-mono">{matchScore.toFixed(1)}%</p>
        </div>
      )}
    </div>
  );
};

export default CandidateProfileHeader;
