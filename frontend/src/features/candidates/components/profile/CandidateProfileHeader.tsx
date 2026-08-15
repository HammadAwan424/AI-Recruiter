import React from "react";
import { Mail, Briefcase, XCircle, RotateCcw } from "lucide-react";
import { ApplicationDetail } from "../../../../shared/types/candidate.types";
import { getCandidateCardDescriptor } from "../../utils/evaluationStatus";

interface CandidateProfileHeaderProps {
  detail: ApplicationDetail;
  dispositionAction?: CandidateProfileDispositionAction;
}

export interface CandidateProfileDispositionAction {
  label: string;
  description: string;
  tone: "reject" | "restore";
  onClick: () => void;
}

export const CandidateProfileHeader: React.FC<CandidateProfileHeaderProps> = ({
  detail,
  dispositionAction,
}) => {
  const isRejected = detail.disposition === "rejected";
  const scoreDescriptor = getCandidateCardDescriptor(detail);

  // Extract strict schema fields (only display if non-empty, no fake/random fallbacks)
  const candidateName = detail.candidate?.full_name || (detail as any).candidate_name || null;
  const candidateEmail = detail.candidate?.email || (detail as any).candidate_email || null;
  const jobTitle = detail.job?.title || (detail as any).job_title || null;

  const headerTitle = candidateName ? candidateName : `Application #${detail.id}`;
  const statusLabel = detail.current_status.replaceAll("_", " ");

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
    <header className="pb-6 border-b border-white/10">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-5">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0 text-white/85 font-semibold text-lg">
            {headerTitle.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-xl font-bold text-white tracking-tight">{headerTitle}</h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] bg-white/[0.05] text-white/65 border border-white/10 font-semibold uppercase tracking-wide">
                {statusLabel}
              </span>
              {isRejected && (
                <span className="px-2 py-0.5 rounded-md text-[10px] bg-red-500/10 text-red-300 border border-red-500/30 font-semibold flex items-center gap-1">
                  <XCircle size={10} /> Rejected
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/60">
              {candidateEmail && (
                <a href={`mailto:${candidateEmail}`} className="flex items-center gap-1.5 hover:text-white transition-colors truncate">
                  <Mail size={14} className="text-white/35 shrink-0" />
                  <span className="truncate">{candidateEmail}</span>
                </a>
              )}
              {jobTitle && (
                <span className="flex items-center gap-1.5">
                  <Briefcase size={14} className="text-white/35 shrink-0" />
                  <span>{jobTitle}</span>
                </span>
              )}
            </div>

            {receivedDate && (
              <p className="mt-2 text-xs text-white/40">Received {receivedDate}</p>
            )}
          </div>
        </div>

        {scoreDescriptor.score != null && (
          <div className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 min-w-[116px] shrink-0">
            <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">{scoreDescriptor.scoreLabel}</p>
            <p className="text-2xl font-bold text-white font-mono mt-1">{scoreDescriptor.scoreDisplay}</p>
          </div>
        )}
      </div>

      {dispositionAction && (
        <div className="mt-5 pt-4 border-t border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-white/55">{dispositionAction.description}</p>
          <button
            type="button"
            onClick={dispositionAction.onClick}
            className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold transition flex items-center justify-center gap-1.5 ${
              dispositionAction.tone === "restore"
                ? "bg-[#05DC7F]/10 hover:bg-[#05DC7F]/20 text-[#05DC7F] border-[#05DC7F]/30"
                : "bg-red-950/30 hover:bg-red-900/40 text-red-300 border-red-900/60"
            }`}
          >
            {dispositionAction.tone === "restore" ? <RotateCcw size={15} /> : <XCircle size={15} />}
            {dispositionAction.label}
          </button>
        </div>
      )}
    </header>
  );
};

export default CandidateProfileHeader;
