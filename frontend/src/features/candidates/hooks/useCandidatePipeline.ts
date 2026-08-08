import { useState, useEffect } from "react";
import { useCandidates } from "./useCandidates";
import { useCandidateMutations } from "./useCandidateMutations";
import { useGetJobsQuery } from "../../jobs/api";
import { useGetCompanyUsersQuery } from "../../users/api";
import { usePermission } from "../../../shared/hooks/usePermission";
import { CANDIDATE_PERMISSIONS } from "../permissions";
import { OFFER_PERMISSIONS } from "../../offers/permissions";
import { useApproveOfferActionMutation } from "../../offers/api";
import {
  useFetchNewCVsMutation,
  useScreenApplicationsMutation,
  useUpdateApplicationStageMutation,
} from "../api";
import {
  useScheduleInterviewMutation,
  useAssignInterviewerMutation,
  useSubmitInterviewFeedbackMutation,
} from "../../interviews/api";
import { useApproveOfferActionMutation } from "../../../shared/api/approvalApi";
import { useDeleteOfferMutation } from "../../offers/api";

export interface PipelineStageConfig {
  key: string;
  label: string;
  color: string;
  nextStage?: string;
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
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [offerModalCandidate, setOfferModalCandidate] = useState<any | null>(null);
  const [assignModalCandidate, setAssignModalCandidate] = useState<any | null>(null);
  const [scorecardCandidate, setScorecardCandidate] = useState<any | null>(null);

  // Column Visibility Selection State (Defaults to all columns visible)
  const [visibleStageKeys, setVisibleStageKeys] = useState<string[]>([
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

  const [pipelineAlertMsg, setPipelineAlertMsg] = useState<string | null>(null);

  const { applications, candidates, isLoading, isError } = useCandidates(selectedJobId);
  const { hireCandidate, rejectCandidate } = useCandidateMutations();
  const [fetchNewApplications, { isLoading: isFetchingNew }] = useFetchNewCVsMutation();
  const [screenJobApplications, { isLoading: isScreeningActive }] = useScreenApplicationsMutation();
  const [updateApplicationStage] = useUpdateApplicationStageMutation();

  const [scheduleInterview, { isLoading: isScheduling }] = useScheduleInterviewMutation();
  const [assignInterviewer] = useAssignInterviewerMutation();
  const [submitInterviewFeedback, { isLoading: isSubmittingScorecard }] = useSubmitInterviewFeedbackMutation();
  const [approveOfferAction] = useApproveOfferActionMutation();
  const [deleteOffer] = useDeleteOfferMutation();

  const { data: interviewerUsersData } = useGetCompanyUsersQuery("interviewer");
  const { data: allUsersData } = useGetCompanyUsersQuery();
  const companyUsers = interviewerUsersData?.users?.length ? interviewerUsersData.users : allUsersData?.users || [];

  const { hasPermission } = usePermission();
  const canDisposition = hasPermission(CANDIDATE_PERMISSIONS.DISPOSITION);
  const canOffer = hasPermission(OFFER_PERMISSIONS.GENERATE);

  useEffect(() => {
    if (jobs.length > 0 && !selectedJobId) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  const toggleStageVisibility = (stageKey: string) => {
    setVisibleStageKeys((prev) =>
      prev.includes(stageKey)
        ? prev.length > 1
          ? prev.filter((k) => k !== stageKey)
          : prev
        : [...prev, stageKey]
    );
  };

  const handleFetchNewCVs = async () => {
    if (!selectedJobId) return;
    setPipelineAlertMsg(null);
    try {
      const fetchRes = await fetchNewApplications(selectedJobId).unwrap();
      setPipelineAlertMsg(fetchRes.message || "Fetched new CVs successfully.");
      await screenJobApplications(selectedJobId).unwrap();
    } catch (err: any) {
      setPipelineAlertMsg(`⚠️ Fetch/Screening error: ${err?.data?.detail || "Error"}`);
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
        setScorecardCandidate(candidate);
        setTechScore(8.5);
        setCommScore(8.0);
        setScoreNotes("");
        return;
      }
    }
  };

  const handleDropCandidate = async (candidateId: number, targetStageKey: string) => {
    const allCandidateItems: any[] = (applications && applications.length > 0) ? applications : candidates;
    const candidate = allCandidateItems.find((c: any) => c.candidate_id === candidateId || c.id === candidateId);
    if (!candidate) return;

    const currentStatus = candidate.current_status || candidate.status;
    if (currentStatus === targetStageKey) return;

    const activeJobId = candidate.job_id || selectedJobId;
    const appId = candidate.id || candidate.application_id;
    if (!activeJobId || !appId) return;

    if ((targetStageKey === "offer_approval" || targetStageKey === "offer_sent") && !canOffer) {
      setPipelineAlertMsg("⚠️ Permissions required to move candidate to offer stage.");
      return;
    }

    // 1. Intercept dropping onto offer_approval (Awaiting Approval column) -> Launch RequestOfferApprovalModal
    if (targetStageKey === "offer_approval") {
      setOfferModalCandidate(candidate);
      return;
    }

    // 2. Intercept dropping onto offer_sent -> Execute Executive Approval & Dispatch Email (Same as Offer Approvals tab action)
    if (targetStageKey === "offer_sent") {
      const offerId = candidate.offer?.id || candidate.offer_id;
      setPipelineAlertMsg(null);

      if (offerId) {
        try {
          await approveOfferAction({
            offerId,
            payload: { decision: "approved", comments: "Approved via Kanban drag & drop" },
          }).unwrap();
          setPipelineAlertMsg("✅ Offer approved & email dispatched to candidate! Stage updated to Offer Sent.");
        } catch (err: any) {
          setPipelineAlertMsg(`⚠️ Executive offer approval failed: ${err?.data?.detail || "Error"}`);
        }
      } else {
        try {
          await updateApplicationStage({
            jobId: activeJobId,
            applicationId: appId,
            currentStatus: "offer_sent",
          }).unwrap();
          setPipelineAlertMsg(`Application #${appId} stage successfully updated to 'OFFER SENT'.`);
        } catch (err: any) {
          setPipelineAlertMsg(`⚠️ Stage update failed: ${err?.data?.detail || "Error"}`);
        }
      }
      return;
    }

    // 3. Intercept dragging backwards from offer_approval -> interview: Delete offer + approval & revert application stage
    if (currentStatus === "offer_approval" && targetStageKey === "interview") {
      const offerId = candidate.offer?.id || candidate.offer_id;
      setPipelineAlertMsg(null);

      if (offerId) {
        try {
          await deleteOffer(offerId).unwrap();
          setPipelineAlertMsg("✅ Offer & approval deleted! Candidate reverted to Interview stage.");
        } catch (err: any) {
          setPipelineAlertMsg(`⚠️ Failed to delete offer: ${err?.data?.detail || "Error"}`);
        }
      } else {
        try {
          await updateApplicationStage({
            jobId: activeJobId,
            applicationId: appId,
            currentStatus: "interview",
          }).unwrap();
          setPipelineAlertMsg(`Application #${appId} stage updated to 'INTERVIEW'.`);
        } catch (err: any) {
          setPipelineAlertMsg(`⚠️ Stage update failed: ${err?.data?.detail || "Error"}`);
        }
      }
      return;
    }

    setPipelineAlertMsg(null);
    try {
      await updateApplicationStage({
        jobId: activeJobId,
        applicationId: appId,
        currentStatus: targetStageKey,
      }).unwrap();

      setPipelineAlertMsg(`Application #${appId} successfully moved to stage '${targetStageKey.replace("_", " ").toUpperCase()}'.`);
    } catch (err: any) {
      setPipelineAlertMsg(`⚠️ Stage update failed: ${err?.data?.detail || "Error"}`);
    }
  };

  const handleConfirmInterviewAssignment = async () => {
    if (!assignModalCandidate) return;
    const activeJobId = assignModalCandidate.job_id || selectedJobId;
    if (!activeJobId) return;

    const interviewerIds: number[] = [];
    if (interviewer1) interviewerIds.push(Number(interviewer1));
    if (interviewer2) interviewerIds.push(Number(interviewer2));

    setPipelineAlertMsg(null);
    try {
      if (assignModalCandidate.interview_id) {
        await assignInterviewer({
          interviewId: assignModalCandidate.interview_id,
          payload: { interviewer_ids: interviewerIds },
        }).unwrap();
      } else {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await scheduleInterview({
          payload: {
            application_id: assignModalCandidate.application_id || assignModalCandidate.id,
            schedule_type: "self_schedule",
            meeting_type: "GOOGLE_MEET",
            self_schedule_token_expires_at: expiresAt.toISOString(),
            interviewer_ids: interviewerIds,
          },
        }).unwrap();
      }

      setPipelineAlertMsg(`Interviewers assigned successfully! Ready for feedback submission.`);
      setAssignModalCandidate(null);
    } catch (err: any) {
      setPipelineAlertMsg(`⚠️ Interview assignment error: ${err?.data?.detail || "Error"}`);
    }
  };

  const handleConfirmSubmitScorecard = async () => {
    const interviewId = scorecardCandidate?.interview_id || (scorecardCandidate?.interviews && scorecardCandidate.interviews[0]?.id);
    if (!scorecardCandidate || !interviewId) return;
    setPipelineAlertMsg(null);
    try {
      await submitInterviewFeedback({
        interviewId,
        technical_score: techScore,
        communication_score: commScore,
        notes: scoreNotes,
      }).unwrap();

      setPipelineAlertMsg(`Scorecard submitted! Interview completed.`);
      setScorecardCandidate(null);
    } catch (err: any) {
      setPipelineAlertMsg(`⚠️ Scorecard submission error: ${err?.data?.detail || "Error"}`);
    }
  };

  const handleHire = async (candidate: any) => {
    const activeJobId = candidate.job_id || selectedJobId;
    const appId = candidate.application_id || candidate.id;
    if (!activeJobId || !appId) return;
    setPipelineAlertMsg(null);
    try {
      const res = await hireCandidate(appId);
      setPipelineAlertMsg(`✅ Candidate hired successfully! ${res?.email_sent ? "Offer letter sent!" : ""}`);
    } catch (err: any) {
      setPipelineAlertMsg(`⚠️ Could not process hire action: ${err?.data?.detail || "Error"}`);
    }
  };

  const handleReject = async (candidate: any) => {
    const activeJobId = candidate.job_id || selectedJobId;
    const appId = candidate.application_id || candidate.id;
    if (!activeJobId || !appId) return;
    if (!window.confirm(`Are you sure you want to reject candidate #${appId}?`)) return;
    setPipelineAlertMsg(null);
    try {
      await rejectCandidate(appId);
      setPipelineAlertMsg(`Candidate #${appId} has been rejected.`);
    } catch (err: any) {
      setPipelineAlertMsg(`⚠️ Could not process reject action: ${err?.data?.detail || "Error"}`);
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
    pipelineAlertMsg,
    setPipelineAlertMsg,

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

    isFetchingNew,
    isScreeningActive,
    isScheduling,
    isSubmittingScorecard,
    canDisposition,
    canOffer,
    companyUsers,

    handleFetchNewCVs,
    handleAdvanceStage,
    handleDropCandidate,
    handleConfirmInterviewAssignment,
    handleConfirmSubmitScorecard,
    handleHire,
    handleReject,
  };
};
