import React from "react";
import { CandidateApplication, ApplicationListItem } from "../../../../shared/types/candidate.types";
import { BaseCandidateCard } from "./BaseCandidateCard";

export type InterviewSubstate = "pending_assignment" | "interview_assigned" | "interview_completed";

interface InterviewCandidateCardProps {
  candidate: CandidateApplication | ApplicationListItem | any;
  isDraggable?: boolean;
  onSelectCandidate: (candidate: any) => void;
}

export const InterviewCandidateCard: React.FC<InterviewCandidateCardProps> = ({
  candidate,
  isDraggable = false,
  onSelectCandidate,
}) => {
  const interviewsList = candidate.interviews || [];
  const isCompleted =
    candidate.interview_status === "COMPLETED" ||
    (interviewsList.length > 0 && interviewsList.every((i: any) => i.status === "COMPLETED"));

  const hasInterviewers = Boolean(
    candidate.interviewer_1 &&
    candidate.interviewer_1 !== "—" &&
    candidate.interviewer_1.trim() !== ""
  ) || Boolean(
    candidate.interviewer_2 &&
    candidate.interviewer_2 !== "—" &&
    candidate.interviewer_2.trim() !== ""
  ) || Boolean(interviewsList.length > 0);

  // Derive readable substate and status translation
  let substate: InterviewSubstate = "pending_assignment";
  let statusTranslation = "Pending Assignment";

  if (isCompleted) {
    substate = "interview_completed";
    statusTranslation = "Completed";
  } else if (hasInterviewers) {
    substate = "interview_assigned";
    statusTranslation = "Scheduled";
  }

  const finalScoreValue = candidate.final_score || candidate.match_score;

  return (
    <BaseCandidateCard
      candidate={candidate}
      onSelectCandidate={onSelectCandidate}
      showMatchScore={false}
      profileButtonLabel="View Details"
      isDraggable={isDraggable}
    >
      {/* Clean Readable Key-Value Pairs */}
      <div className="mt-3 pt-2.5 border-t border-gray-800/50 flex flex-col gap-1.5 text-[11px]">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 font-medium">Status</span>
          <span className={`font-semibold ${isCompleted ? "text-[#05DC7F]" : "text-gray-200"}`}>
            {statusTranslation}
          </span>
        </div>

        {substate === "pending_assignment" && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-medium">Interviewer</span>
            <span className="text-gray-400 font-bold tracking-widest">???</span>
          </div>
        )}

        {substate === "interview_assigned" && candidate.interviewer_1 && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-medium">Interviewer</span>
            <span className="text-gray-300 truncate max-w-[120px] font-medium">
              {candidate.interviewer_1}
            </span>
          </div>
        )}

        {substate === "interview_completed" && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-medium">Final Score</span>
            <span className="text-[#05DC7F] font-bold text-xs">
              {finalScoreValue ? `${finalScoreValue.toFixed(1)}%` : "—"}
            </span>
          </div>
        )}
      </div>
    </BaseCandidateCard>
  );
};
