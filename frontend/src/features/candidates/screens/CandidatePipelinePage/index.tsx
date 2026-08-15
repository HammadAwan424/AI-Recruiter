import { useState } from "react";
import { Alert, CircularProgress } from "@mui/material";
import { PipelineHeader } from "../../components/PipelineHeader";
import { PipelineStatsSummary } from "../../components/PipelineStatsSummary";
import { PipelineSyncReport } from "../../components/PipelineSyncReport";
import { KanbanBoard } from "../../components/KanbanBoard";
import { CandidateProfile } from "../../components/CandidateProfile";
import { RequestOfferApprovalModal } from "../../../../shared/components/RequestOfferApprovalModal";
import { STAGES, useCandidatePipeline } from "../../hooks/useCandidatePipeline";
import { useGetMailboxStatusQuery } from "../../../auth/api";
import { MailboxOnboardingModal } from "../../../auth/components/MailboxOnboardingModal";

export const CandidatePipelinePage: React.FC = () => {
  const {
    jobs,
    selectedJobId,
    setSelectedJobId,
    applications,
    candidates,
    isLoading,
    isError,
    pipelineNotice,
    setPipelineNotice,
    lastFetchReport,
    syncMode,
    evaluationStatus,
    clearFetchReport,

    visibleStageKeys,
    toggleStageVisibility,

    selectedCandidate,
    setSelectedCandidate,

    offerModalCandidate,
    setOfferModalCandidate,

    handleFetchAndEvaluate,
    handleEvaluate,
    handleAdvanceStage,
    handleDropCandidate,
    handleHire,
    handleReject,
    handleRestore,
    handleRejectOfferApproval,
    handleReturnOfferToInterview,
    pipelineStep,
    isFetchingNew,
    isParsingActive,
    isScreeningActive,
    pendingEvaluationCount,
    newlyImportedIds,
  } = useCandidatePipeline();

  const allCandidates = applications && applications.length > 0 ? applications : candidates;
  const { data: mailboxStatus } = useGetMailboxStatusQuery();
  const [showMailboxModal, setShowMailboxModal] = useState(false);

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 w-full max-w-[1700px] mx-auto min-h-screen">
      <PipelineHeader
        jobs={jobs}
        selectedJobId={selectedJobId}
        onSelectJob={setSelectedJobId}
        onFetchAndEvaluate={handleFetchAndEvaluate}
        onEvaluateCandidates={() => selectedJobId && handleEvaluate(selectedJobId)}
        pendingEvaluationCount={pendingEvaluationCount}
        pipelineStep={pipelineStep}
        isFetchingNew={isFetchingNew}
        isParsingActive={isParsingActive}
        isScreeningActive={isScreeningActive}
        visibleStageKeys={visibleStageKeys}
        onToggleStageVisibility={toggleStageVisibility}
        allStages={STAGES}
      />

      {lastFetchReport && (
        <PipelineSyncReport
          report={lastFetchReport}
          jobs={jobs}
          mode={syncMode}
          evaluationStatus={evaluationStatus}
          onDismiss={clearFetchReport}
        />
      )}

      {mailboxStatus && !mailboxStatus.is_connected && (
        <Alert
          severity="warning"
          action={
            <button
              onClick={() => setShowMailboxModal(true)}
              className="px-3 py-1 bg-[#05DC7F] hover:bg-[#04B367] text-black font-bold rounded-lg text-xs transition"
            >
              Connect Gmail
            </button>
          }
          sx={{
            backgroundColor: "rgba(234, 179, 8, 0.1)",
            border: "1px solid rgba(234, 179, 8, 0.3)",
            color: "#FACC15",
          }}
        >
          <strong>Company Mailbox Not Linked:</strong> Connect your company recruitment Gmail inbox to fetch and screen candidate emails automatically.
        </Alert>
      )}

      <PipelineStatsSummary
        applications={allCandidates}
      />

      {pipelineNotice && (
        <Alert
          severity={pipelineNotice.tone}
          variant="outlined"
          onClose={() => setPipelineNotice(null)}
          sx={{
            alignItems: "center",
            borderRadius: 2.5,
            py: 0.5,
            backgroundColor:
              pipelineNotice.tone === "success"
                ? "rgba(5, 220, 127, 0.06)"
                : pipelineNotice.tone === "error"
                  ? "rgba(239, 68, 68, 0.07)"
                  : pipelineNotice.tone === "warning"
                    ? "rgba(245, 158, 11, 0.07)"
                    : "rgba(56, 189, 248, 0.06)",
          }}
        >
          <div className="flex flex-col gap-0.5 pr-2">
            <span className="text-sm font-semibold">{pipelineNotice.title}</span>
            {pipelineNotice.detail && (
              <span className="text-xs opacity-80">{pipelineNotice.detail}</span>
            )}
          </div>
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
          candidates={allCandidates}
          stages={STAGES}
          visibleStageKeys={visibleStageKeys}
          pipelineStep={pipelineStep}
          newlyImportedIds={newlyImportedIds}
          onSelectCandidate={setSelectedCandidate}
          onAdvanceStage={handleAdvanceStage}
          onDropCandidate={handleDropCandidate}
        />
      )}

      <CandidateProfile
        open={Boolean(selectedCandidate)}
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onReject={handleReject}
        onRestore={handleRestore}
        onRejectOfferApproval={handleRejectOfferApproval}
        onReturnOfferToInterview={handleReturnOfferToInterview}
      />

      {/* Shared Request Offer Approval Modal triggered on dragging candidate card to offer stage */}
      <RequestOfferApprovalModal
        open={Boolean(offerModalCandidate)}
        candidate={offerModalCandidate}
        onClose={() => setOfferModalCandidate(null)}
        onSuccess={() => {
          setOfferModalCandidate(null);
          setPipelineNotice({
            tone: "success",
            title: "Offer approval requested",
            detail: "The candidate is now awaiting internal approval before the offer can be sent.",
          });
        }}
      />

      {/* Mailbox Onboarding Modal */}
      <MailboxOnboardingModal
        open={showMailboxModal}
        onClose={() => setShowMailboxModal(false)}
        allowDismiss={true}
      />
    </div>
  );
};
