import React from "react";
import { Alert, CircularProgress } from "@mui/material";
import { PipelineHeader } from "../../components/PipelineHeader";
import { KanbanBoard } from "../../components/KanbanBoard";
import { CandidateProfile } from "../../components/CandidateProfile";
import { RequestOfferApprovalModal } from "../../../../shared/components/RequestOfferApprovalModal";
import { STAGES, useCandidatePipeline } from "../../hooks/useCandidatePipeline";

export const CandidatePipelinePage: React.FC = () => {
  const {
    jobs,
    selectedJobId,
    setSelectedJobId,
    applications,
    candidates,
    isLoading,
    isError,
    pipelineAlertMsg,
    setPipelineAlertMsg,

    visibleStageKeys,
    toggleStageVisibility,

    selectedCandidate,
    setSelectedCandidate,

    offerModalCandidate,
    setOfferModalCandidate,

    canDisposition,
    canOffer,

    handleFetchNewCVs,
    handleAdvanceStage,
    handleDropCandidate,
    handleHire,
    handleReject,
    isFetchingNew,
    isScreeningActive,
  } = useCandidatePipeline();

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 w-full max-w-[1700px] mx-auto min-h-screen">
      <PipelineHeader
        jobs={jobs}
        selectedJobId={selectedJobId}
        onSelectJob={setSelectedJobId}
        onFetchNewCVs={handleFetchNewCVs}
        isFetchingNew={isFetchingNew}
        isScreeningActive={isScreeningActive}
        visibleStageKeys={visibleStageKeys}
        onToggleStageVisibility={toggleStageVisibility}
        allStages={STAGES}
      />

      {pipelineAlertMsg && (
        <Alert severity="info" onClose={() => setPipelineAlertMsg(null)}>
          {pipelineAlertMsg}
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <CircularProgress color="primary" />
        </div>
      ) : isError ? (
        <Alert severity="error">
          Could not load candidate applications. Ensure backend API service is running.
        </Alert>
      ) : (
        <KanbanBoard
          candidates={applications && applications.length > 0 ? applications : candidates}
          stages={STAGES}
          visibleStageKeys={visibleStageKeys}
          canDisposition={canDisposition}
          canOffer={canOffer}
          onSelectCandidate={setSelectedCandidate}
          onAdvanceStage={handleAdvanceStage}
          onDropCandidate={handleDropCandidate}
          onReject={handleReject}
        />
      )}

      <CandidateProfile
        open={Boolean(selectedCandidate)}
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onHire={handleHire}
        onReject={handleReject}
      />

      {/* Shared Request Offer Approval Modal triggered on dragging candidate card to offer stage */}
      <RequestOfferApprovalModal
        open={Boolean(offerModalCandidate)}
        candidate={offerModalCandidate}
        onClose={() => setOfferModalCandidate(null)}
        onSuccess={() => {
          setOfferModalCandidate(null);
          setPipelineAlertMsg("✅ Offer approval request submitted! Candidate moved to Offer Approval stage.");
        }}
      />
    </div>
  );
};
