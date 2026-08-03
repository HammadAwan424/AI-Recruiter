import React from "react";
import { Chip, Typography } from "@mui/material";
import { Trophy, Medal, Info, GripVertical } from "lucide-react";
import { CandidateApplication, ApplicationListItem } from "../../../../shared/types/candidate.types";

export interface BaseCandidateCardProps {
  candidate: CandidateApplication | ApplicationListItem | any;
  onSelectCandidate: (candidate: any) => void;
  children?: React.ReactNode;
  badge?: React.ReactNode;
  showMatchScore?: boolean;
  profileButtonLabel?: string;
  isDraggable?: boolean;
}

export const BaseCandidateCard: React.FC<BaseCandidateCardProps> = ({
  candidate,
  onSelectCandidate,
  children,
  badge,
  showMatchScore = true,
  profileButtonLabel = "View Profile",
  isDraggable = false,
}) => {
  const isRejected = candidate.rejected || candidate.disposition === "rejected";
  const isHired = candidate.hired || candidate.current_status === "hired";

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isDraggable) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("application/json", JSON.stringify({ candidateId: candidate.candidate_id || candidate.id }));
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

  return (
    <div
      draggable={isDraggable}
      onDragStart={handleDragStart}
      className={`flex flex-col p-3.5 rounded-xl border transition-all duration-300 overflow-hidden ${
        isDraggable ? "cursor-grab active:cursor-grabbing hover:border-gray-700" : ""
      } ${
        isRejected
          ? "bg-[#0b0808] border-gray-800 hover:opacity-90 shadow-sm opacity-65 grayscale-[30%]"
          : isHired
          ? "bg-[#05DC7F]/10 border-[#05DC7F]/50 shadow-[0_0_12px_rgba(5,220,127,0.25)]"
          : "bg-[#0d0d0d] border-gray-800 hover:border-[#05DC7F]/40 shadow-sm"
      }`}
    >
      {/* Top Header: Rank, Grip & Candidate Info */}
      <div className="flex justify-between items-start gap-1.5 w-full">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isDraggable && <GripVertical size={13} className="text-gray-600 hover:text-gray-300 flex-shrink-0" />}
          <div className="min-w-0 flex-1">
            <h5 className={`font-bold text-xs leading-tight truncate ${isRejected ? "line-through text-gray-500" : "text-white"}`}>
              {candidate.full_name || `Application #${candidate.id || candidate.application_id}`}
            </h5>
            <p className="text-gray-500 text-[10px] truncate mt-0.5">{candidate.email || `Candidate ID: ${candidate.candidate_id}`}</p>
          </div>
        </div>
        {isHired && (
          <Chip label="Hired" size="small" color="success" sx={{ height: 18, fontSize: 9, fontWeight: 700 }} />
        )}
      </div>

      {isRejected && (
        <span className="inline-flex items-center gap-1 py-0.5 text-red-400 text-[9px] font-bold tracking-wide uppercase flex-shrink-0 whitespace-nowrap">
          Rejected
        </span>
      )}

      {/* Optional Badge */}
      {badge && !isRejected && <div className="mt-2.5 flex-shrink-0">{badge}</div>}

      {/* Custom Body Content for Card Variant */}
      {children}

      {/* Match Score Display (Optional) */}
      {showMatchScore && (
        <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-gray-800/60">
          <span className="text-gray-400 text-[11px]">Match Score</span>
          <span className={`font-bold text-xs ${isRejected ? "text-red-400/90" : "text-[#05DC7F]"}`}>
            {candidate.final_score || candidate.match_score ? `${(candidate.final_score || candidate.match_score).toFixed(1)}%` : "Evaluating..."}
          </span>
        </div>
      )}

      {/* Single Action Button with Configurable Label */}
      <div className="mt-3 pt-2 border-t border-gray-800/40">
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
