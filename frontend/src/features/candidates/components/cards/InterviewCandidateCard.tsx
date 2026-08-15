import React from "react";
import { Tooltip } from "@mui/material";
import { CandidateApplication, ApplicationListItem } from "../../../../shared/types/candidate.types";
import { BaseCandidateCard } from "./BaseCandidateCard";
import { getCandidateCardDescriptor } from "../../utils/evaluationStatus";

interface InterviewCandidateCardProps {
  candidate: CandidateApplication | ApplicationListItem | any;
  isDraggable?: boolean;
  pipelineStep?: "idle" | "fetching" | "parsing" | "screening" | string;
  isNewlyImported?: boolean;
  onSelectCandidate: (candidate: any) => void;
}

export const InterviewCandidateCard: React.FC<InterviewCandidateCardProps> = ({
  candidate,
  isDraggable = false,
  pipelineStep = "idle",
  isNewlyImported = false,
  onSelectCandidate,
}) => {
  const descriptor = getCandidateCardDescriptor(candidate);

  return (
    <BaseCandidateCard
      candidate={candidate}
      onSelectCandidate={onSelectCandidate}
      showMatchScore={true}
      profileButtonLabel="View Details"
      isDraggable={isDraggable}
      pipelineStep={pipelineStep}
      isNewlyImported={isNewlyImported}
    >
      {/* Centralized Interviews Progress: Only shown when interviews are scheduled/completed */}
      {descriptor.showInterviewsCount && (
        <div className="mt-2.5 pt-2 border-t border-gray-800/50 flex flex-col gap-1.5 text-[11px]">
          <div className="flex justify-between items-center gap-2">
            <span className="text-gray-400 font-medium shrink-0">{descriptor.interviewsLabel}</span>
            <Tooltip title={descriptor.interviewsTooltip} arrow placement="top">
              <span className="text-gray-300 font-semibold font-mono text-right cursor-help hover:text-white transition-colors">
                {descriptor.interviewsDisplay}
              </span>
            </Tooltip>
          </div>
        </div>
      )}
    </BaseCandidateCard>
  );
};
