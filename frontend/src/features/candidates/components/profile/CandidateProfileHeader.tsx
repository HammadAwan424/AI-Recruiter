import React from "react";
import { Mail, Briefcase, CheckCircle, XCircle } from "lucide-react";
import { ApplicationDetail } from "../../../../shared/types/candidate.types";

interface CandidateProfileHeaderProps {
  detail: ApplicationDetail;
  canDisposition?: boolean;
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

  // Extract strict schema fields (only display if non-empty, no fake/random fallbacks)
  const candidateName = detail.candidate?.full_name || (detail as any).candidate_name || null;
  const candidateEmail = detail.candidate?.email || (detail as any).candidate_email || null;
  const jobTitle = detail.job?.title || (detail as any).job_title || null;

  const headerTitle = candidateName ? candidateName : `Application #${detail.id}`;

  const receivedDate = (detail.received_at || detail.created_at)
    ? new Date(detail.received_at || detail.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="pb-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      {/* Left: Candidate Name, Email & Requisition Info */}
      <div className="flex items-start gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400 font-bold text-lg">
          {headerTitle.charAt(0).toUpperCase()}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-extrabold text-white tracking-tight">{headerTitle}</h3>
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

          {(candidateEmail || jobTitle) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/70">
              {candidateEmail && (
                <span className="flex items-center gap-1 text-cyan-300/90 font-medium">
                  <Mail size={12} className="text-cyan-400" />
                  <a href={`mailto:${candidateEmail}`} className="hover:underline">{candidateEmail}</a>
                </span>
              )}
              {jobTitle && (
                <span className="flex items-center gap-1 text-amber-300/90 font-medium">
                  <Briefcase size={12} className="text-amber-400" />
                  <span>{jobTitle}</span>
                </span>
              )}
            </div>
          )}

          {receivedDate && (
            <p className="text-[11px] text-white/50 pt-0.5 font-medium">
              Received: <span className="text-white/80 font-mono">{receivedDate}</span>
            </p>
          )}
        </div>
      </div>

      {/* Right: Overall Match Score Display */}
      {matchScore != null && !isNaN(matchScore) && (
        <div className="text-left sm:text-right shrink-0 bg-white/[0.03] p-3 rounded-2xl border border-white/10">
          <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Calculated Match Score</p>
          <p className="text-2xl font-extrabold text-[#05DC7F] font-mono mt-0.5">{matchScore.toFixed(1)}%</p>
        </div>
      )}
    </div>
  );
};

export default CandidateProfileHeader;
