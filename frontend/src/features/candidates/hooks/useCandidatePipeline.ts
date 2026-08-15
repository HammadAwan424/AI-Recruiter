import { useState, useEffect, useMemo } from "react";
import { useCandidates } from "./useCandidates";
import { useCandidateMutations } from "./useCandidateMutations";
import { useGetJobsQuery } from "../../jobs/api";
import { useGetCompanyUsersQuery } from "../../users/api";
import {
  useFetchNewCVsMutation,
  useParseApplicationsMutation,
  useScreenApplicationsMutation,
  useUpdateApplicationStageMutation,
  useLazyGetApplicationsQuery,
} from "../api";
import {
  useScheduleInterviewMutation,
  useSubmitInterviewFeedbackMutation,
} from "../../interviews/api";
import { useApproveOfferActionMutation } from "../../../shared/api/approvalApi";
import { useDeleteOfferMutation } from "../../offers/api";
import {
  ApplicationStatus,
  ApplicationListItem,
  FetchApplicationsResponse,
} from "../../../shared/types/candidate.types";
import { formatApiError } from "../../../shared/utils/errorUtils";
import type {
  PipelineEvaluationStatus,
  PipelineSyncMode,
} from "../components/PipelineSyncReport";

import {
  getCandidateEvaluationStatus,
  requiresParsing,
  requiresScreening,
} from "../utils/evaluationStatus";

export interface PipelineStageConfig {
  key: ApplicationStatus;
  label: string;
  color: string;
  nextStage?: ApplicationStatus;
}

export type PipelineNoticeTone = "success" | "error" | "warning" | "info";

export interface PipelineNotice {
  tone: PipelineNoticeTone;
  title: string;
  detail?: string;
}

export const STAGES: PipelineStageConfig[] = [
  { key: "applied", label: "Applied", color: "#3B82F6", nextStage: "screening" },
  { key: "screening", label: "Screened", color: "#8B5CF6", nextStage: "interview" },
  { key: "interview", label: "Interview", color: "#F59E0B", nextStage: "offer_approval" },
  { key: "offer_approval", label: "Awaiting Approval", color: "#EC4899", nextStage: "offer_sent" },
  { key: "offer_sent", label: "Offer Sent", color: "#10B981", nextStage: "hired" },
  { key: "hired", label: "Hired", color: "#05DC7F" },
];

export const useCandidatePipeline = () => {
  const { data: jobsData } = useGetJobsQuery();
  const jobs = jobsData?.jobs || [];

  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<ApplicationListItem | null>(null);
  const [offerModalCandidate, setOfferModalCandidate] = useState<ApplicationListItem | null>(null);
  const [assignModalCandidate, setAssignModalCandidate] = useState<ApplicationListItem | null>(null);
  const [scorecardCandidate, setScorecardCandidate] = useState<ApplicationListItem | null>(null);

  // Column Visibility Selection State (Defaults to all columns visible)
  const [visibleStageKeys, setVisibleStageKeys] = useState<ApplicationStatus[]>([
    "applied",
    "screening",
    "interview",
    "offer_approval",
    "offer_sent",
    "hired",
  ]);

  // Assignment Modal inputs
  const [interviewer1, setInterviewer1] = useState<number | "">("");
  const [interviewer2, setInterviewer2] = useState<number | "">("");
  const [scheduledDate, setScheduledDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [scheduledTime, setScheduledTime] = useState<string>("10:00");

  // Scorecard Modal inputs
  const [techScore, setTechScore] = useState<number>(8.5);
  const [commScore, setCommScore] = useState<number>(8.0);
  const [scoreNotes, setScoreNotes] = useState<string>("");

  const [pipelineNotice, setPipelineNotice] = useState<PipelineNotice | null>(null);
  const [pipelineStep, setPipelineStep] = useState<"idle" | "fetching" | "parsing" | "screening">("idle");
  const [newlyImportedIds, setNewlyImportedIds] = useState<number[]>([]);
  const [lastFetchReport, setLastFetchReport] = useState<FetchApplicationsResponse | null>(null);
  const [syncMode, setSyncMode] = useState<PipelineSyncMode>("fetch");
  const [evaluationStatus, setEvaluationStatus] = useState<PipelineEvaluationStatus>("not_run");

  const { applications, candidates, isLoading, isError } = useCandidates(selectedJobId);
  const { hireCandidate, rejectCandidate, restoreCandidate } = useCandidateMutations();
  const [fetchNewApplications, { isLoading: isFetchingNew }] = useFetchNewCVsMutation();
  const [parseApplications, { isLoading: isParsingActive }] = useParseApplicationsMutation();
  const [screenJobApplications, { isLoading: isScreeningActive }] = useScreenApplicationsMutation();
  const [updateApplicationStage] = useUpdateApplicationStageMutation();
  const [triggerGetApplications] = useLazyGetApplicationsQuery();

  const [scheduleInterview, { isLoading: isScheduling }] = useScheduleInterviewMutation();
  const [submitInterviewFeedback, { isLoading: isSubmittingScorecard }] = useSubmitInterviewFeedbackMutation();
  const [approveOfferAction] = useApproveOfferActionMutation();
  const [deleteOffer] = useDeleteOfferMutation();

  const { data: interviewerUsersData } = useGetCompanyUsersQuery("interviewer");
  const { data: allUsersData } = useGetCompanyUsersQuery();
  const companyUsers = interviewerUsersData?.users?.length ? interviewerUsersData.users : allUsersData?.users || [];

  useEffect(() => {
    if (jobs.length > 0 && !selectedJobId) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  // Calculate count of applications in active job that are pending evaluation (un-screened)
  const pendingEvaluationCount = useMemo(() => {
    const activeList = applications && applications.length > 0 ? applications : candidates;
    return activeList.filter((app) => requiresScreening(app)).length;
  }, [applications, candidates]);

  const toggleStageVisibility = (stageKey: ApplicationStatus) => {
    setVisibleStageKeys((prev) =>
      prev.includes(stageKey)
        ? prev.length > 1
          ? prev.filter((k) => k !== stageKey)
          : prev
        : [...prev, stageKey]
    );
  };

  /**
   * Action 1: FETCH (Server-Calculated)
   * Connects to Gmail, fetches unread candidate emails, extracts PDFs,
   * runs the AI Job Classifier to route candidates to requisitions.
   */
  const handleFetch = async (jobId: number, mode: PipelineSyncMode = "fetch") => {
    setPipelineNotice(null);
    setLastFetchReport(null);
    setSyncMode(mode);
    setEvaluationStatus(mode === "fetch_and_evaluate" ? "running" : "not_run");
    setPipelineStep("fetching");
    try {
      const fetchRes = await fetchNewApplications(jobId).unwrap();
      setLastFetchReport(fetchRes);
      if (fetchRes.new_application_ids && fetchRes.new_application_ids.length > 0) {
        setNewlyImportedIds((prev) => Array.from(new Set([...prev, ...fetchRes.new_application_ids!])));
      }
      return fetchRes;
    } catch (err: any) {
      setPipelineNotice({
        tone: "error",
        title: "Mailbox sync failed",
        detail: formatApiError(err, "We could not fetch new email applications."),
      });
      throw err;
    } finally {
      setPipelineStep("idle");
    }
  };

  /**
   * Action 2: EVALUATION (Client-Passed Parsing + Screening)
   * Step 1: Client passes unparsed application IDs to POST /jobs/{jobId}/applications/parse
   * Step 2: Client triggers POST /jobs/{jobId}/applications/screen to score all parsed applications
   */
  const handleEvaluate = async (jobId: number, targetAppIds?: number[], silent = false) => {
    if (!silent) setPipelineNotice(null);
    // Only the combined Fetch & Evaluate action owns the evaluation state shown
    // inside the Gmail sync report. Standalone evaluation should not rewrite the
    // status of an older mailbox report.
    if (silent) setEvaluationStatus("running");

    try {
      // 1. Resolve application IDs that require parsing via centralized helper
      let appIdsToParse = targetAppIds;
      if (!appIdsToParse || appIdsToParse.length === 0) {
        const freshApps = await triggerGetApplications(jobId, true).unwrap();
        appIdsToParse = freshApps.filter((app) => requiresParsing(app)).map((app) => app.id);
      }

      // Step A: Parse unparsed applications
      if (appIdsToParse && appIdsToParse.length > 0) {
        setPipelineStep("parsing");
        await parseApplications({ jobId, applicationIds: appIdsToParse }).unwrap();
      }

      // Step B: Screen all applications for the active requisition
      setPipelineStep("screening");
      await screenJobApplications(jobId).unwrap();
      if (!silent) {
        setPipelineNotice({
          tone: "success",
          title: "Evaluation complete",
          detail: "Candidate parsing and AI scoring are up to date for this requisition.",
        });
      }
      if (silent) setEvaluationStatus("completed");
      return true;
    } catch (err: any) {
      if (silent) setEvaluationStatus("failed");
      setPipelineNotice({
        tone: "error",
        title: "Evaluation could not finish",
        detail: formatApiError(err, "Please try the evaluation again."),
      });
      return false;
    } finally {
      setPipelineStep("idle");
    }
  };

  /**
   * Action 1 + 2 Combined: FETCH & EVALUATE
   * Runs the full automated ingest and evaluation for the selected job.
   */
  const handleFetchAndEvaluate = async () => {
    if (!selectedJobId) return;
    try {
      const fetchRes = await handleFetch(selectedJobId, "fetch_and_evaluate");
      
      // If new applications were imported, run evaluation on the new batch and produce a unified confirmation
      if (fetchRes && fetchRes.total_saved > 0) {
        await handleEvaluate(selectedJobId, fetchRes.new_application_ids, true);
      }
      // If 0 were imported, handleFetch already set the clear informational message and we do NOT overwrite or flicker.
      else {
        setEvaluationStatus("not_run");
      }
    } catch {
      // Error messages handled within individual action steps
    }
  };

  const handleAdvanceStage = async (candidate: any, currentStageKey: string) => {
    const activeJobId = candidate.job_id || selectedJobId;
    if (!activeJobId) return;

    if (currentStageKey === "interview") {
      const isCompleted = candidate.interview_status === "COMPLETED";
      const hasInterview = Boolean(candidate.interview_id || (candidate.interviews && candidate.interviews.length > 0));

      if (!hasInterview) {
        setAssignModalCandidate(candidate);
        setInterviewer1("");
        setInterviewer2("");
        return;
      }

      if (!isCompleted) {
        setPipelineNotice({
          tone: "warning",
          title: "Interview still needs a scorecard",
          detail: "Complete the interview scorecard before requesting an offer.",
        });
        return;
      }
    }
  };

  const handleDropCandidate = async (candidateId: number, targetStageKey: ApplicationStatus) => {
    const allCandidateItems: ApplicationListItem[] = (applications && applications.length > 0) ? applications : candidates;
    const candidate = allCandidateItems.find((c) => c.candidate_id === candidateId || c.id === candidateId);
    if (!candidate) return;

    const currentStatus = candidate.current_status;
    if (currentStatus === targetStageKey) return;

    const activeJobId = candidate.job_id || selectedJobId;
    const appId = candidate.id;
    if (!activeJobId || !appId) return;

    // 1. Intercept dropping onto offer_approval -> Open Offer Generation Modal
    if (targetStageKey === "offer_approval") {
      setOfferModalCandidate(candidate);
      return;
    }

    // 2. Intercept dropping onto offer_sent -> Execute Executive Approval & Dispatch Email
    if (targetStageKey === "offer_sent") {
      const offerId = (candidate as any).offer?.id || (candidate as any).offer_id;
      setPipelineNotice(null);

      if (offerId) {
        try {
          await approveOfferAction({
            offerId,
            payload: { decision: "approved", comments: "Approved via Kanban drag & drop" },
          }).unwrap();
          setPipelineNotice({
            tone: "success",
            title: "Offer sent to candidate",
            detail: "Executive approval is recorded and the candidate can now review the offer.",
          });
        } catch (err: any) {
          setPipelineNotice({
            tone: "error",
            title: "Offer could not be approved",
            detail: formatApiError(err, "Please try the approval again."),
          });
        }
        return;
      }
    }

    // 3. Sequential Stage Transition
    setPipelineNotice(null);
    try {
      await updateApplicationStage({
        jobId: activeJobId,
        applicationId: appId,
        currentStatus: targetStageKey,
      }).unwrap();

      setPipelineNotice({
        tone: "success",
        title: "Candidate moved",
        detail: `The candidate is now in ${targetStageKey.replace("_", " ")}.`,
      });
    } catch (err: any) {
      setPipelineNotice({
        tone: "error",
        title: "Candidate could not be moved",
        detail: formatApiError(err, "Please try the move again."),
      });
    }
  };

  const handleConfirmInterviewAssignment = async () => {
    if (!assignModalCandidate) return;
    const activeJobId = assignModalCandidate.job_id || selectedJobId;
    if (!activeJobId) return;

    const interviewerIds: number[] = [];
    if (interviewer1) interviewerIds.push(Number(interviewer1));
    if (interviewer2) interviewerIds.push(Number(interviewer2));

    setPipelineNotice(null);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await scheduleInterview({
        payload: {
          application_id: assignModalCandidate.id,
          schedule_type: "self_schedule",
          meeting_type: "GOOGLE_MEET",
          self_schedule_token_expires_at: expiresAt.toISOString(),
          interviewer_ids: interviewerIds,
        },
      }).unwrap();

      setPipelineNotice({
        tone: "success",
        title: "Interview scheduled",
        detail: "A self-scheduling invitation is ready for the candidate.",
      });
      setAssignModalCandidate(null);
    } catch (err: any) {
      setPipelineNotice({
        tone: "error",
        title: "Interview could not be scheduled",
        detail: formatApiError(err, "Check the interview details and try again."),
      });
    }
  };

  const handleConfirmSubmitScorecard = async () => {
    const interviewId = (scorecardCandidate as any)?.interview_id || (scorecardCandidate?.interviews && scorecardCandidate.interviews[0]?.id);
    if (!scorecardCandidate || !interviewId) return;
    setPipelineNotice(null);
    try {
      await submitInterviewFeedback({
        interviewId,
        technical_score: techScore,
        communication_score: commScore,
        notes: scoreNotes,
      }).unwrap();

      setPipelineNotice({
        tone: "success",
        title: "Scorecard saved",
        detail: "The interview is marked complete and ready for the next decision.",
      });
      setScorecardCandidate(null);
    } catch (err: any) {
      setPipelineNotice({
        tone: "error",
        title: "Scorecard could not be saved",
        detail: formatApiError(err, "Please review the scorecard and try again."),
      });
    }
  };

  const handleHire = async (candidate: any) => {
    const activeJobId = candidate.job_id || selectedJobId;
    const appId = candidate.id || candidate.application_id;
    if (!activeJobId || !appId) return;
    setPipelineNotice(null);
    try {
      await hireCandidate(activeJobId, appId);
      setPipelineNotice({
        tone: "success",
        title: "Candidate hired",
        detail: "The application has been marked as hired.",
      });
    } catch (err: any) {
      setPipelineNotice({
        tone: "error",
        title: "Candidate could not be hired",
        detail: formatApiError(err, "Please try again."),
      });
    }
  };

  const handleReject = async (candidate: any) => {
    if (!["applied", "screening", "interview"].includes(candidate.current_status)) {
      setPipelineNotice({
        tone: "info",
        title: "Use the offer workflow",
        detail: "Offer-stage decisions are managed from the candidate profile.",
      });
      return;
    }
    const activeJobId = candidate.job_id || selectedJobId;
    const appId = candidate.id || candidate.application_id;
    if (!activeJobId || !appId) return;
    if (!window.confirm(`Are you sure you want to reject candidate #${appId}?`)) return;
    setPipelineNotice(null);
    try {
      await rejectCandidate(activeJobId, appId);
      setPipelineNotice({
        tone: "success",
        title: "Candidate rejected",
        detail: "The candidate is no longer in the active pipeline.",
      });
    } catch (err: any) {
      setPipelineNotice({
        tone: "error",
        title: "Candidate could not be rejected",
        detail: formatApiError(err, "Please try again."),
      });
    }
  };

  const handleRestore = async (candidate: any) => {
    if (!["applied", "screening", "interview"].includes(candidate.current_status)) {
      setPipelineNotice({
        tone: "info",
        title: "Use the offer workflow",
        detail: "Offer-stage revisions are managed from the candidate profile.",
      });
      return;
    }
    const activeJobId = candidate.job_id || selectedJobId;
    const appId = candidate.id || candidate.application_id;
    if (!activeJobId || !appId) return;
    if (!window.confirm(`Restore candidate #${appId} to active pipeline status?`)) return;
    setPipelineNotice(null);
    try {
      await restoreCandidate(activeJobId, appId);
      setPipelineNotice({
        tone: "success",
        title: "Candidate restored",
        detail: "The candidate is active again at their current pipeline stage.",
      });
    } catch (err: any) {
      setPipelineNotice({
        tone: "error",
        title: "Candidate could not be restored",
        detail: formatApiError(err, "Please try again."),
      });
    }
  };

  const handleRejectOfferApproval = async (candidate: any) => {
    const offerId = candidate.offer?.id;
    if (candidate.current_status !== "offer_approval" || !offerId) return;
    if (!window.confirm("Reject this offer? It will not be sent to the candidate.")) return;

    setPipelineNotice(null);
    try {
      await approveOfferAction({
        offerId,
        payload: { decision: "rejected", comments: "Rejected via Kanban" },
      }).unwrap();
      setPipelineNotice({
        tone: "success",
        title: "Offer approval rejected",
        detail: "The offer was not sent. You can revise it or return the candidate to interview.",
      });
    } catch (err: any) {
      setPipelineNotice({
        tone: "error",
        title: "Offer approval could not be rejected",
        detail: formatApiError(err, "Please try again."),
      });
    }
  };

  const handleReturnOfferToInterview = async (candidate: any) => {
    const offerId = candidate.offer?.id;
    if (candidate.current_status !== "offer_approval" || !offerId) return;
    if (!window.confirm("Delete this rejected offer and return the candidate to interview?")) return;

    setPipelineNotice(null);
    try {
      await deleteOffer(offerId).unwrap();
      setPipelineNotice({
        tone: "success",
        title: "Candidate returned to interview",
        detail: "The rejected offer and its approval record were removed.",
      });
    } catch (err: any) {
      setPipelineNotice({
        tone: "error",
        title: "Candidate could not return to interview",
        detail: formatApiError(err, "Please try again."),
      });
    }
  };

  return {
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
    clearFetchReport: () => setLastFetchReport(null),

    visibleStageKeys,
    toggleStageVisibility,

    selectedCandidate,
    setSelectedCandidate,

    offerModalCandidate,
    setOfferModalCandidate,

    assignModalCandidate,
    setAssignModalCandidate,
    interviewer1,
    setInterviewer1,
    interviewer2,
    setInterviewer2,
    scheduledDate,
    setScheduledDate,
    scheduledTime,
    setScheduledTime,

    scorecardCandidate,
    setScorecardCandidate,
    techScore,
    setTechScore,
    commScore,
    setCommScore,
    scoreNotes,
    setScoreNotes,

    pipelineStep,
    isFetchingNew,
    isParsingActive,
    isScreeningActive,
    isScheduling,
    isSubmittingScorecard,
    companyUsers,
    pendingEvaluationCount,
    newlyImportedIds,

    handleFetch,
    handleEvaluate,
    handleFetchAndEvaluate,
    handleAdvanceStage,
    handleDropCandidate,
    handleConfirmInterviewAssignment,
    handleConfirmSubmitScorecard,
    handleHire,
    handleReject,
    handleRestore,
    handleRejectOfferApproval,
    handleReturnOfferToInterview,
  };
};
