import React, { useState } from "react";
import { CandidateApplication, ApplicationListItem } from "../../../shared/types/candidate.types";
import { PipelineStageConfig } from "../hooks/useCandidatePipeline";
import { ScreenCandidateCard } from "./cards/ScreenCandidateCard";
import { InterviewCandidateCard } from "./cards/InterviewCandidateCard";
import { resolveCardVariant, getDraggableEvaluator } from "./cards/variants";

interface KanbanBoardProps {
  candidates: (CandidateApplication | ApplicationListItem | any)[];
  stages: PipelineStageConfig[];
  visibleStageKeys: string[];
  canDisposition: boolean;
  canOffer: boolean;
  onSelectCandidate: (candidate: any) => void;
  onAdvanceStage: (candidate: any, currentStageKey: string) => void;
  onDropCandidate: (candidateId: number, targetStageKey: string) => void;
  onReject: (candidate: any) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  candidates,
  stages,
  visibleStageKeys,
  onSelectCandidate,
  onDropCandidate,
}) => {
  const [draggedCandidateId, setDraggedCandidateId] = useState<number | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const activeStages = stages.filter((s) => visibleStageKeys.includes(s.key));

  const handleDragStart = (e: React.DragEvent, candidateId: number, isDraggable: boolean) => {
    if (!isDraggable) {
      e.preventDefault();
      return;
    }
    setDraggedCandidateId(candidateId);
    e.dataTransfer.setData("candidateId", candidateId.toString());
    e.dataTransfer.setData("text/plain", candidateId.toString());
    e.dataTransfer.setData("application/json", JSON.stringify({ candidateId }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    if (dragOverStage !== stageKey) {
      setDragOverStage(stageKey);
    }
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, targetStageKey: string) => {
    e.preventDefault();
    setDragOverStage(null);

    let candidateIdStr = e.dataTransfer.getData("candidateId") || e.dataTransfer.getData("text/plain");
    if (!candidateIdStr) {
      try {
        const jsonStr = e.dataTransfer.getData("application/json");
        if (jsonStr) {
          const parsed = JSON.parse(jsonStr);
          candidateIdStr = parsed.candidateId ? parsed.candidateId.toString() : null;
        }
      } catch (err) {}
    }

    if (!candidateIdStr) return;
    const candidateId = parseInt(candidateIdStr, 10);

    if (candidateId) {
      onDropCandidate(candidateId, targetStageKey);
    }
    setDraggedCandidateId(null);
  };

  const getGridColsClass = (count: number) => {
    switch (count) {
      case 1: return "grid-cols-1";
      case 2: return "grid-cols-1 md:grid-cols-2";
      case 3: return "grid-cols-1 md:grid-cols-3";
      case 4: return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
      case 5: return "grid-cols-1 md:grid-cols-3 lg:grid-cols-5";
      default: return "grid-cols-1 md:grid-cols-3 lg:grid-cols-6";
    }
  };

  const renderCardVariant = (candidate: any, stage: PipelineStageConfig, isDraggable: boolean) => {
    const resolved = resolveCardVariant(candidate, stage.key);

    if (resolved.stage === "interview") {
      return (
        <InterviewCandidateCard
          key={candidate.id || candidate.candidate_id}
          candidate={candidate}
          isDraggable={isDraggable}
          onSelectCandidate={onSelectCandidate}
        />
      );
    }

    return (
      <ScreenCandidateCard
        key={candidate.id || candidate.candidate_id}
        candidate={candidate}
        variant={resolved.variant as "normal" | "rejected"}
        screening={stage.key !== "applied"}
        isDraggable={isDraggable}
        onSelectCandidate={onSelectCandidate}
      />
    );
  };

  return (
    <div className={`grid ${getGridColsClass(activeStages.length)} gap-4 w-full pb-4 transition-all duration-300`}>
      {activeStages.map((stage) => {
        const stageCandidates = candidates.filter((c: any) => {
          const status = c.current_status || c.status || "applied";
          if (status === stage.key) return true;
          if (status === "rejected" && stage.key === "applied") return true;
          return false;
        });
        const isColumnActiveTarget = dragOverStage === stage.key;
        const evaluateDraggable = getDraggableEvaluator(stage.key);

        return (
          <div
            key={stage.key}
            onDragOver={(e) => handleDragOver(e, stage.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.key)}
            className={`flex flex-col rounded-2xl bg-black/40 border p-3.5 min-h-[500px] transition-all duration-300 ${
              isColumnActiveTarget
                ? "border-[#05DC7F] bg-[#05DC7F]/5 shadow-[0_0_20px_rgba(5,220,127,0.2)]"
                : "border-gray-800/80"
            }`}
          >
            {/* Column Header */}
            <div className="flex justify-between items-center pb-3 mb-3 border-b border-gray-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                <h4 className="font-bold text-white text-sm tracking-wide">{stage.label}</h4>
              </div>
              <span className="text-gray-400 bg-gray-900 px-2 py-0.5 rounded-full text-xs font-semibold border border-gray-800">
                {stageCandidates.length}
              </span>
            </div>

            {/* Candidate Cards List */}
            <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-0.5">
              {stageCandidates.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-gray-600 text-xs italic py-8 border border-dashed border-gray-800/50 rounded-xl">
                  Drag candidates here
                </div>
              ) : (
                stageCandidates.map((candidate: any) => {
                  const resolved = resolveCardVariant(candidate, stage.key);
                  const isDraggable = evaluateDraggable(resolved.variant);
                  const candId = candidate.id || candidate.candidate_id;

                  return (
                    <div
                      key={candId}
                      draggable={isDraggable}
                      onDragStart={(e) => handleDragStart(e, candId, isDraggable)}
                      className={isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-default"}
                    >
                      {renderCardVariant(candidate, stage, isDraggable)}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
