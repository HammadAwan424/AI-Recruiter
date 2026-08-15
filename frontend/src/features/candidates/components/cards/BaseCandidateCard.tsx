import React from "react";
import { Chip, Typography, Tooltip } from "@mui/material";
import {
  Trophy,
  Medal,
  Info,
  GripVertical,
  Calendar,
  Sparkles,
  Clock,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { CandidateApplication, ApplicationListItem } from "../../../../shared/types/candidate.types";
import { FitFlagBadgeList } from "../../../../shared/components/FitFlagBadge";
import { getCandidateCardDescriptor, CandidateCardBadge } from "../../utils/evaluationStatus";

export interface BaseCandidateCardProps {
  candidate: CandidateApplication | ApplicationListItem | any;
  onSelectCandidate: (candidate: any) => void;
  children?: React.ReactNode;
  badge?: React.ReactNode;
  showMatchScore?: boolean;
  profileButtonLabel?: string;
  isDraggable?: boolean;
  stageKey?: string;
  pipelineStep?: "idle" | "fetching" | "parsing" | "screening" | string;
  isNewlyImported?: boolean;
}

export const BaseCandidateCard: React.FC<BaseCandidateCardProps> = ({
  candidate,
  onSelectCandidate,
  children,
  badge,
  showMatchScore = true,
  profileButtonLabel = "View Profile",
  isDraggable = false,
  stageKey,
  pipelineStep = "idle",
  isNewlyImported = false,
}) => {
  // Centralized evaluation, score label & badge resolver
  const descriptor = getCandidateCardDescriptor(candidate, stageKey);

  const candidateId = candidate.candidate_id || candidate.id;
  const candidateName =
    candidate.candidate?.full_name ||
    candidate.candidate_name ||
    candidate.full_name ||
    `Application #${candidate.id}`;
  const candidateEmail =
    candidate.candidate?.email ||
    candidate.candidate_email ||
    candidate.email ||
    `Candidate ID: ${candidateId}`;

  // Active evaluation states for candidates currently being processed
  const isActivelyEvaluating =
    !descriptor.isScreened &&
    !descriptor.isRejected &&
    !descriptor.isHired &&
    (pipelineStep === "parsing" || pipelineStep === "screening");

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isDraggable) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("application/json", JSON.stringify({ candidateId }));
    e.dataTransfer.effectAllowed = "move";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={14} style={{ color: "#FACC15" }} />;
    if (rank === 2) return <Medal size={14} style={{ color: "#E2E8F0" }} />;
    if (rank === 3) return <Medal size={14} style={{ color: "#FB923C" }} />;
    return (
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: 10 }}>
        #{rank}
      </Typography>
    );
  };

  const renderBadgeNode = (b: CandidateCardBadge | null) => {
    if (!b) return null;
    let icon = <Clock size={11} className="text-amber-400" />;
    let colorClasses = "bg-amber-950/70 text-amber-400 border-amber-800/60";

    if (b.colorTheme === "cyan") {
      icon = <Sparkles size={11} className="text-cyan-400" />;
      colorClasses = "bg-cyan-950/70 text-cyan-400 border-cyan-800/60";
    } else if (b.colorTheme === "emerald") {
      icon = <CheckCircle2 size={11} className="text-emerald-400" />;
      colorClasses = "bg-emerald-950/70 text-emerald-400 border-emerald-800/60";
    }

    return (
      <Tooltip title={b.tooltip} arrow placement="top">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border cursor-help ${colorClasses}`}>
          {icon}
          <span>{b.label}</span>
        </span>
      </Tooltip>
    );
  };

  return (
    <div
      draggable={isDraggable}
      onDragStart={handleDragStart}
      className={`flex flex-col p-3 rounded-xl border transition-all duration-300 ${
        isDraggable ? "cursor-grab active:cursor-grabbing hover:border-gray-700" : ""
      } ${
        descriptor.isRejected
          ? "bg-[#0b0808] border-gray-800 hover:opacity-90 shadow-sm opacity-65 grayscale-[30%]"
          : descriptor.isHired
          ? "bg-[#05DC7F]/10 border-[#05DC7F]/50 shadow-[0_0_12px_rgba(5,220,127,0.25)]"
          : isNewlyImported
          ? "bg-[#0e1713] border-[#05DC7F]/60 shadow-[0_0_12px_rgba(5,220,127,0.18)]"
          : isActivelyEvaluating
          ? "bg-[#0e1713] border-[#05DC7F]/40 shadow-[0_0_14px_rgba(5,220,127,0.18)]"
          : "bg-[#0d0d0d] border-gray-800 hover:border-[#05DC7F]/40 shadow-sm"
      }`}
    >
      {/* Top Header: Rank, Grip & Candidate Info */}
      <div className="flex justify-between items-start gap-1.5 w-full">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isDraggable && <GripVertical size={13} className="text-gray-600 hover:text-gray-300 flex-shrink-0" />}
          <div className="min-w-0 flex-1">
            <h5 className={`font-bold text-xs leading-tight truncate ${descriptor.isRejected ? "line-through text-gray-500" : "text-white"}`}>
              {candidateName}
            </h5>
            <p className="text-gray-500 text-[10px] truncate mt-0.5">{candidateEmail}</p>
            {(candidate.received_at || candidate.created_at) && (
              <p className="text-gray-500 text-[9px] mt-0.5 flex items-center gap-1">
                <Calendar size={10} className="text-gray-500 shrink-0" />
                <span>Received {(() => {
                  const raw = candidate.received_at || candidate.created_at;
                  const utcStr = raw.endsWith("Z") || raw.includes("+") ? raw : `${raw}Z`;
                  return new Date(utcStr).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                })()}</span>
              </p>
            )}
          </div>
        </div>
        {descriptor.isHired ? (
          <Chip label="Hired" size="small" color="success" sx={{ height: 18, fontSize: 9, fontWeight: 700 }} />
        ) : isNewlyImported ? (
          <Chip label="New" size="small" color="success" sx={{ height: 18, fontSize: 9, fontWeight: 700 }} />
        ) : null}
      </div>

      {descriptor.isRejected && (
        <span className="inline-flex items-center gap-1 py-0.5 text-red-400 text-[9px] font-bold tracking-wide uppercase flex-shrink-0 whitespace-nowrap">
          Rejected
        </span>
      )}

      {/* Unified Status Badge Slot (Only rendered when a badge is present) */}
      {!descriptor.isRejected && !descriptor.isHired && (badge || isActivelyEvaluating || descriptor.badge) && (
        <div className="mt-2 flex-shrink-0">
          {badge ? (
            badge
          ) : isActivelyEvaluating ? (
            /* Live dynamic evaluating indicator */
            pipelineStep === "parsing" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)] animate-pulse">
                <RefreshCw className="animate-spin text-cyan-400" size={11} />
                <span>Parsing...</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/90 text-emerald-300 border border-[#05DC7F]/50 shadow-[0_0_10px_rgba(5,220,127,0.3)] animate-pulse">
                <Sparkles className="animate-spin text-[#05DC7F]" size={11} />
                <span>Evaluating...</span>
              </span>
            )
          ) : descriptor.badge ? (
            renderBadgeNode(descriptor.badge)
          ) : null}
        </div>
      )}

      {/* Custom Body Content for Card Variant (Contextual details like Interviews count, Offers) */}
      {children}

      {/* Fit Flags Summary Badges */}
      {!descriptor.isRejected && (candidate.fit_flags || candidate.screening?.fit_flags) && (
        <div className="mt-2 flex-shrink-0">
          <FitFlagBadgeList fitFlags={candidate.fit_flags || candidate.screening?.fit_flags} size="sm" />
        </div>
      )}

      {/* Centralized Score Metric (AI Score vs Score) */}
      {showMatchScore && (
        <div className="flex justify-between items-center gap-2 mt-2.5 pt-2 border-t border-gray-800/60 text-[11px]">
          <span className="text-gray-400 font-medium shrink-0">{descriptor.scoreLabel}</span>
          <span
            className={`font-bold text-xs text-right shrink-0 font-mono ${
              descriptor.isRejected
                ? "text-red-400/90"
                : isActivelyEvaluating
                ? "text-[#05DC7F] animate-pulse"
                : descriptor.isScreened
                ? "text-[#05DC7F]"
                : "text-gray-500"
            }`}
          >
            {isActivelyEvaluating ? (
              pipelineStep === "parsing" ? "Extracting..." : "Scoring..."
            ) : descriptor.isScreened ? (
              <Tooltip title={descriptor.scoreTooltip} arrow placement="top">
                <span className="cursor-help">{descriptor.scoreDisplay}</span>
              </Tooltip>
            ) : (
              <Tooltip title={descriptor.scoreTooltip} arrow placement="top">
                <span className="cursor-help hover:text-amber-400 transition-colors">—</span>
              </Tooltip>
            )}
          </span>
        </div>
      )}

      {/* Single Action Button with Configurable Label */}
      <div className="mt-2.5 pt-2 border-t border-gray-800/40">
        <button
          onClick={() => onSelectCandidate(candidate)}
          className="w-full py-1.5 px-3 rounded-lg bg-gray-900/80 hover:bg-gray-800 text-gray-300 hover:text-white text-xs font-semibold border border-gray-800/80 transition flex items-center justify-center gap-1.5"
        >
          <Info size={13} /> {profileButtonLabel}
        </button>
      </div>
    </div>
  );
};
