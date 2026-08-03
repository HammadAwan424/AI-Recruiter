import React from "react";
import { CandidateApplication, ApplicationListItem } from "../../../../shared/types/candidate.types";
import { BaseCandidateCard } from "./BaseCandidateCard";

export interface ScreenCandidateCardProps {
  candidate: CandidateApplication | ApplicationListItem | any;
  variant: "normal" | "rejected";
  screening?: boolean;
  isDraggable?: boolean;
  onSelectCandidate: (candidate: any) => void;
}

export const ScreenCandidateCard: React.FC<ScreenCandidateCardProps> = ({
  candidate,
  isDraggable = true,
  onSelectCandidate,
}) => {
  return (
    <BaseCandidateCard
      candidate={candidate}
      onSelectCandidate={onSelectCandidate}
      showMatchScore={true}
      profileButtonLabel="View Profile"
      isDraggable={isDraggable}
    />
  );
};
