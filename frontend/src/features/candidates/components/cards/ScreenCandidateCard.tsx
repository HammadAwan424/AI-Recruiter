import React from "react";
import { Typography } from "@mui/material";
import { Trophy, Medal, Info, GripVertical } from "lucide-react";
import { CandidateApplication, ApplicationListItem } from "../../../../shared/types/candidate.types";

export interface ScreenCandidateCardProps {
  candidate: CandidateApplication | ApplicationListItem | any;
  variant: "normal" | "rejected";
  screening?: boolean;
  isDraggable?: boolean;
  onSelectCandidate: (candidate: any) => void;
}

export const ScreenCandidateCard: React.FC<ScreenCandidateCardProps> = ({
  candidate,
  variant,
  screening = false,
  isDraggable = true,
  onSelectCandidate,
}) => {
  const isRejected = variant === "rejected";

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

  const matchScoreValue = candidate.final_score || candidate.match_score || candidate.resume_score;

  return (
    <div
      draggable={isDraggable}
      onDragStart={handleDragStart}
      className={`flex flex-col p-3.5 rounded-xl border transition-all duration-300 overflow-hidden ${
        isDraggable ? "cursor-grab active:cursor-grabbing hover:border-gray-700 hover:scale-[1.01]" : ""
      } ${
        isRejected
          ? "bg-[#0b0808] border-red-950/80 border-l-2 border-l-red-600/70 opacity-60 grayscale-[35%]"
          : "bg-[#0d0d0d] border-gray-800/80 shadow-sm"
      }`}
    >
      {/* Header: Rank, Name & Sleek Rejection Pill */}
      <div className="flex justify-between items-start gap-1.5 w-full">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isDraggable && <GripVertical size={13} className="text-gray-600 hover:text-gray-300 flex-shrink-0" />}
          <div className="w-5 h-5 rounded-full bg-black/60 border border-gray-700/80 flex items-center justify-center flex-shrink-0">
            {getRankIcon(candidate.rank || 1)}
          </div>
          <div className="min-w-0 flex-1">
            <h5 className={`font-bold text-xs leading-tight truncate ${isRejected ? "line-through text-gray-500" : "text-white"}`}>
              {candidate.full_name || `Application #${candidate.id || candidate.application_id}`}
            </h5>
            <p className="text-gray-500 text-[10px] truncate mt-0.5">{candidate.email || `Candidate ID: ${candidate.candidate_id}`}</p>
          </div>
        </div>

        {/* Premium Minimalist Rejection Pill with flex-shrink-0 */}
        {isRejected && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-950/60 border border-red-800/40 text-red-400 text-[9px] font-bold tracking-wide uppercase flex-shrink-0 whitespace-nowrap">
            <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0"></span>
            Rejected
          </span>
        )}
      </div>

      {/* Match Score Display */}
      <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-gray-800/50">
        <span className="text-gray-400 text-[11px] font-medium">
          {screening ? "AI Match Score" : "Match Score"}
        </span>
        <span className={`font-bold text-xs ${isRejected ? "text-red-400/90" : "text-[#05DC7F]"}`}>
          {screening
            ? matchScoreValue ? `${matchScoreValue.toFixed(1)}%` : "Evaluating..."
            : matchScoreValue ? `${matchScoreValue.toFixed(1)}%` : "Not Screened"}
        </span>
      </div>

      {/* Clear Profile Button */}
      <div className="mt-2.5 pt-2 border-t border-gray-800/40">
        <button
          onClick={() => onSelectCandidate(candidate)}
          className="w-full py-1.5 px-3 rounded-lg bg-gray-900/80 hover:bg-gray-800 text-gray-300 hover:text-white text-xs font-semibold border border-gray-800/80 transition flex items-center justify-center gap-1.5"
        >
          <Info size={13} /> View Profile
        </button>
      </div>
    </div>
  );
};
