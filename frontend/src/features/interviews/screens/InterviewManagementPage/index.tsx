import React, { useState } from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaEnvelope,
  FaVideo,
  FaUserTie,
  FaUsers,
  FaTimes,
  FaLink,
  FaCheck,
  FaDownload,
  FaPlus,
  FaCalendarCheck,
  FaEdit,
  FaTrashAlt,
  FaGlobe,
  FaBriefcase,
  FaUserCheck,
  FaStar,
} from "react-icons/fa";
import { useInterviews } from "../../hooks/useInterviews";
import { useInterviewMutations } from "../../hooks/useInterviewMutations";
import { useGetJobsQuery } from "../../../jobs/api";
import { InterviewItem, InterviewSlot } from "../../../../shared/types/interview.types";
import { usePermission } from "../../../../shared/hooks/usePermission";
import { INTERVIEW_PERMISSIONS } from "../../permissions";
import { useAuth } from "../../../../shared/context/AuthContext";
import { SubmitScorecardModal } from "../../components/SubmitScorecardModal";

function SlotBuilderModal({
  initialSlot,
  onClose,
  onSaved,
}: {
  initialSlot?: InterviewSlot | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = Boolean(initialSlot);
  const [slotDate, setSlotDate] = useState(
    initialSlot?.schedule_start ? initialSlot.schedule_start.substring(0, 10) : ""
  );
  const [startTime, setStartTime] = useState(
    initialSlot?.schedule_start ? new Date(initialSlot.schedule_start).toTimeString().substring(0, 5) : "10:00"
  );
  const [endTime, setEndTime] = useState(
    initialSlot?.schedule_end ? new Date(initialSlot.schedule_end).toTimeString().substring(0, 5) : "11:00"
  );

  const [isUniversal, setIsUniversal] = useState<boolean>(
    initialSlot ? initialSlot.job_id === null || initialSlot.job_id === undefined : true
  );
  const [selectedJobId, setSelectedJobId] = useState<number | "">(initialSlot?.job_id || "");

  const { data: jobsData } = useGetJobsQuery();
  const jobs = jobsData?.jobs || [];

  const { createSlot, updateSlot, isSubmitting } = useInterviewMutations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotDate) return alert("Please select a date.");
    if (!isUniversal && !selectedJobId) return alert("Please select a specific job requisition.");

    const startIso = new Date(`${slotDate}T${startTime}:00`).toISOString();
    const endIso = new Date(`${slotDate}T${endTime}:00`).toISOString();

    const payload = {
      job_id: isUniversal ? null : Number(selectedJobId),
      schedule_start: startIso,
      schedule_end: endIso,
    };

    try {
      if (isEditing && initialSlot) {
        await updateSlot(initialSlot.id, payload);
        alert("Availability slot updated successfully!");
      } else {
        await createSlot(payload);
        alert("Availability slot created successfully!");
      }
      onSaved();
      onClose();
    } catch (err: any) {
      alert(err?.data?.detail || "Failed to save availability slot.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-black/90 border border-[#05DC7F]/40 p-6 shadow-[0_0_25px_rgba(5,220,127,0.4)] relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <FaTimes />
        </button>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FaPlus className="text-[#05DC7F]" /> {isEditing ? "Edit Availability Slot" : "Add Availability Slot"}
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-semibold flex items-center gap-2">
                <FaGlobe className="text-[#05DC7F]" /> Universal Slot (All Jobs)
              </span>
              <input
                type="checkbox"
                checked={isUniversal}
                onChange={(e) => {
                  setIsUniversal(e.target.checked);
                  if (e.target.checked) setSelectedJobId("");
                }}
                className="w-4 h-4 accent-[#05DC7F]"
              />
            </div>
            <p className="text-xs text-gray-400">
              Universal slots are available for candidates applying to any open job requisition.
            </p>
          </div>

          {!isUniversal && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <FaBriefcase className="text-[#05DC7F]" /> Job Requisition
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(Number(e.target.value))}
                className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm focus:border-[#05DC7F] focus:outline-none"
              >
                <option value="">Select a job requisition...</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.department})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <FaCalendarAlt className="text-[#05DC7F]" /> Slot Date
            </label>
            <input
              type="date"
              value={slotDate}
              onChange={(e) => setSlotDate(e.target.value)}
              className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm focus:border-[#05DC7F] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <FaClock className="text-[#05DC7F]" /> Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm focus:border-[#05DC7F] focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <FaClock className="text-[#05DC7F]" /> End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm focus:border-[#05DC7F] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#05DC7F] text-black font-semibold hover:bg-[#04c56f] transition flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Slot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailsModal({
  data,
  currentUserId,
  canSubmitScorecard,
  onClose,
  onOpenScorecard,
}: {
  data: InterviewItem;
  currentUserId?: number | null;
  canSubmitScorecard?: boolean;
  onClose: () => void;
  onOpenScorecard?: (item: InterviewItem, initialFeedback?: any) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const {
    generateSelfScheduleLink,
    downloadCalendarInvite: downloadCalendarInviteApi,
    isDownloadingCalendar,
  } = useInterviewMutations();

  if (!data) return null;

  const myAssignment = data.interviewer_assignments?.find(
    (a) => Number(a.interviewer_id) === Number(currentUserId)
  );
  const myFeedback = myAssignment?.feedback;

  const copyMeetingLink = () => {
    if (data.meeting_link) {
      navigator.clipboard.writeText(data.meeting_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copySelfScheduleLink = async () => {
    try {
      const res = await generateSelfScheduleLink(data.id);
      const link = `${window.location.origin}/interview/schedule/${res.self_schedule_token}`;
      navigator.clipboard.writeText(link);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    } catch (err) {
      alert("Failed to generate candidate link.");
    }
  };

  const downloadCalendarInvite = async () => {
    try {
      const calendarContent = await downloadCalendarInviteApi(data.id);
      const calendarBlob = new Blob([calendarContent], { type: "text/calendar;charset=utf-8" });
      const downloadUrl = URL.createObjectURL(calendarBlob);
      const downloadLink = document.createElement("a");

      downloadLink.href = downloadUrl;
      downloadLink.download = `interview_${data.id}.ics`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (error) {
      const apiError = error as { data?: { detail?: string } | string };
      let detail = apiError?.data && typeof apiError.data !== "string" ? apiError.data.detail : undefined;
      if (typeof apiError?.data === "string") {
        try {
          detail = JSON.parse(apiError.data).detail || apiError.data;
        } catch {
          detail = apiError.data;
        }
      }
      alert(detail || "Failed to download the calendar invite.");
    }
  };

  const assignedNames = data.interviewer_assignments
    ?.map((a) => a.interviewer?.full_name)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl bg-black/90 border border-[#05DC7F]/40 p-6 sm:p-8 shadow-[0_0_25px_rgba(5,220,127,0.4)] relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <FaTimes />
        </button>
        <h2 className="text-white text-2xl font-bold mb-4 flex items-center gap-2">
          <FaCalendarAlt className="text-[#05DC7F]" /> Interview Details
        </h2>
        <div className="flex flex-col gap-3 text-gray-300 text-sm sm:text-base">
          <p className="flex items-center gap-2">
            <FaUserTie className="text-[#05DC7F]" />
            <span className="text-white font-semibold">{data.candidate_name || "Candidate"}</span>
          </p>
          <p className="flex items-center gap-2">
            <FaCalendarCheck className="text-[#05DC7F]" />
            Position: {data.job_title || "Universal Position"}
          </p>
          <p className="flex items-center gap-2">
            <FaClock className="text-[#05DC7F]" />
            Time: {data.schedule_start ? new Date(data.schedule_start).toLocaleString() : "Awaiting Candidate Selection"}
          </p>
          <p className="flex items-center gap-2">
            <FaVideo className="text-[#05DC7F]" />
            Meeting Type: {data.meeting_type || "Video Call"}
          </p>
          <p className="flex items-center gap-2">
            <FaUsers className="text-[#05DC7F]" />
            Interviewers: {assignedNames || "Assigned Panel"}
          </p>

          {/* Interview Scorecards Section */}
          {data.interviewer_assignments && data.interviewer_assignments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-800 space-y-2.5">
              <h4 className="text-white font-bold text-sm flex items-center gap-2">
                <FaStar className="text-[#05DC7F]" /> Scorecards & Team Feedback
              </h4>
              <div className="space-y-2">
                {data.interviewer_assignments.map((asgn) => {
                  const fb = asgn.feedback;
                  return (
                    <div
                      key={asgn.interviewer_id}
                      className="p-3 rounded-xl bg-white/[0.04] border border-white/5 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">
                          {asgn.interviewer?.full_name || `Interviewer #${asgn.interviewer_id}`}
                        </span>
                        {fb ? (
                          <div className="flex items-center gap-2 font-mono font-bold">
                            <span className="px-2 py-0.5 rounded bg-[#05DC7F]/20 text-[#05DC7F]">
                              Tech: {fb.technical_score}/10
                            </span>
                            <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                              Comm: {fb.communication_score}/10
                            </span>
                          </div>
                        ) : (
                          <span className="text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded">
                            Pending Scorecard
                          </span>
                        )}
                      </div>
                      {fb?.notes && (
                        <p className="text-gray-300 italic pt-0.5">"{fb.notes}"</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {canSubmitScorecard && onOpenScorecard && (
                Boolean(data.schedule_start) ? (
                  <button
                    type="button"
                    onClick={() => onOpenScorecard(data, myFeedback)}
                    className="w-full mt-2 py-2.5 rounded-xl font-semibold bg-[#05DC7F] text-black hover:bg-[#04c56f] transition flex items-center justify-center gap-2 text-sm shadow-[0_0_15px_rgba(5,220,127,0.25)]"
                  >
                    <FaStar /> {myFeedback ? "Edit Your Scorecard" : "Submit Interview Scorecard"}
                  </button>
                ) : (
                  <p className="text-xs text-amber-300/80 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                    ⏳ Scoring is enabled once the candidate confirms their interview slot.
                  </p>
                )
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-800">
            {data.meeting_link && (
              <div className="flex items-center gap-2">
                <a
                  href={data.meeting_link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-[#05DC7F] text-black font-semibold hover:bg-[#04c56f] transition flex items-center justify-center gap-2 text-center"
                >
                  <FaVideo /> Join Video Call
                </a>
                <button
                  onClick={copyMeetingLink}
                  className="px-4 py-2.5 rounded-xl border border-[#05DC7F]/40 text-white hover:bg-[#05DC7F]/10 transition flex items-center gap-2"
                >
                  {copied ? <FaCheck className="text-[#05DC7F]" /> : <FaLink />}
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadCalendarInvite}
                disabled={isDownloadingCalendar}
                className="flex-1 py-2.5 rounded-xl border border-[#05DC7F]/40 text-white hover:bg-[#05DC7F]/10 transition disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2 text-sm"
              >
                <FaDownload className="text-[#05DC7F]" />
                {isDownloadingCalendar ? "Preparing calendar..." : "Download .ics Calendar Invite"}
              </button>
              <button
                onClick={copySelfScheduleLink}
                className="px-4 py-2.5 rounded-xl border border-[#05DC7F]/40 text-white hover:bg-[#05DC7F]/10 transition flex items-center gap-2"
                title="Copy Candidate Self-Schedule Link"
              >
                {tokenCopied ? <FaCheck className="text-[#05DC7F]" /> : <FaEnvelope />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InterviewCard({
  item,
  isMyInterview,
  currentUserId,
  onSelect,
}: {
  item: InterviewItem;
  isMyInterview: boolean;
  currentUserId?: number | null;
  onSelect: (item: InterviewItem) => void;
}) {
  const myAssignment = item.interviewer_assignments?.find(
    (a) => Number(a.interviewer_id) === Number(currentUserId)
  );
  const myFeedback = myAssignment?.feedback;

  return (
    <div
      className={`p-5 rounded-2xl border ${
        isMyInterview
          ? "border-[#05DC7F]/50 bg-[#0b2a1f]/80 shadow-[0_0_20px_rgba(5,220,127,0.15)]"
          : "border-gray-800 bg-black/50"
      } backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition hover:border-[#05DC7F]/70`}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[#05DC7F] text-xs font-semibold uppercase tracking-wider">
            {item.status}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-gray-300 border border-gray-800 font-medium">
            {item.job_title ? `💼 ${item.job_title}` : "🌐 Universal (All Jobs)"}
          </span>
          {myFeedback && (
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold font-mono">
              ⭐ Tech: {myFeedback.technical_score} | Comm: {myFeedback.communication_score}
            </span>
          )}
        </div>
        <h3 className="text-white text-lg font-bold flex items-center gap-2">
          {item.candidate_name || "Candidate"}
        </h3>
        <span className="flex items-center gap-1.5 text-xs text-gray-300">
          <FaCalendarAlt className="text-[#05DC7F]" />{" "}
          {item.schedule_start ? new Date(item.schedule_start).toLocaleString() : "Awaiting Selection"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {item.meeting_link && (
          <a
            href={item.meeting_link}
            target="_blank"
            rel="noreferrer"
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl font-semibold bg-zinc-800 text-white hover:bg-zinc-700 transition flex items-center justify-center gap-2 text-sm border border-zinc-700"
          >
            <FaVideo /> Join Call
          </a>
        )}
        <button
          onClick={() => onSelect(item)}
          className="flex-1 md:flex-none px-4 py-2.5 rounded-xl font-semibold border border-[#05DC7F]/40 text-white hover:bg-[#05DC7F]/10 transition flex items-center justify-center gap-2 text-sm"
        >
          <FaCalendarAlt /> Details
        </button>
      </div>
    </div>
  );
}

export const InterviewManagementPage: React.FC = () => {
  const { userId } = useAuth();
  const { interviews, slots, interviewers, isLoading, refetch } = useInterviews();
  const { deleteSlot } = useInterviewMutations();
  const { hasPermission } = usePermission();

  const canManageSlots = hasPermission(INTERVIEW_PERMISSIONS.SUBMIT_FEEDBACK);
  const canEditSlot = hasPermission(INTERVIEW_PERMISSIONS.RESCHEDULE);

  const [viewMode, setViewMode] = useState<"Agenda" | "Slots">("Agenda");
  const [selected, setSelected] = useState<InterviewItem | null>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<InterviewSlot | null>(null);
  const [scoringInterview, setScoringInterview] = useState<{
    interview: InterviewItem;
    initialFeedback?: any;
  } | null>(null);

  const currentUserId = userId == null ? null : Number(userId);

  const handleOpenScorecard = (item: InterviewItem, initialFeedback?: any) => {
    setScoringInterview({ interview: item, initialFeedback });
  };

  // Clean, strongly-typed partition
  const myInterviews = interviews.filter((item) => {
    if (currentUserId == null) return false;
    const isAssigned = item.interviewer_assignments?.some(
      (a) => Number(a.interviewer_id) === currentUserId
    );
    return isAssigned || Number(item.created_by) === currentUserId;
  });

  const teamInterviews = interviews.filter((item) => !myInterviews.includes(item));
  const interviewerNameById = new Map(interviewers.map((interviewer) => [interviewer.id, interviewer.full_name]));
  const mySlots = slots.filter(
    (slot) => currentUserId != null && Number(slot.interviewer_id) === currentUserId
  );
  const teamSlots = slots.filter(
    (slot) => currentUserId == null || Number(slot.interviewer_id) !== currentUserId
  );

  const renderSlotCard = (slot: InterviewSlot, isOwnSlot: boolean) => {
    const isUniversalSlot = !slot.job_id;
    const jobTitleDisplay = isUniversalSlot
      ? "Universal availability"
      : slot.job?.title || "Job-specific availability";
    const interviewerName = isOwnSlot
      ? "Your availability"
      : interviewerNameById.get(slot.interviewer_id) || `Interviewer #${slot.interviewer_id}`;

    return (
      <div
        key={slot.id}
        className="p-4 rounded-xl border border-[#05DC7F]/30 bg-black/50 backdrop-blur-sm flex flex-col justify-between gap-3"
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                slot.is_booked
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-[#05DC7F]/20 text-[#05DC7F] border border-[#05DC7F]/30"
              }`}
            >
              {slot.is_booked ? "Booked" : "Available"}
            </span>
            <span className="text-gray-400 text-xs flex items-center gap-1">
              <FaCalendarAlt size={11} className="text-[#05DC7F]" />
              {new Date(slot.schedule_start).toLocaleDateString()}
            </span>
          </div>

          <div className="text-white text-sm font-bold mt-1 flex items-center gap-1.5">
            <FaClock size={12} className="text-[#05DC7F]" />
            {new Date(slot.schedule_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            {" – "}
            {new Date(slot.schedule_end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>

          <div className="text-gray-400 text-xs mt-1 flex items-center gap-1">
            <FaBriefcase size={11} /> {jobTitleDisplay}
          </div>
          {!isOwnSlot && (
            <div className="text-gray-400 text-xs mt-0.5 flex items-center gap-1">
              <FaUserCheck size={11} className="text-[#05DC7F]" /> {interviewerName}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-800/80">
          <span className="text-[11px] text-gray-500 font-mono">
            ID: #{slot.id}
          </span>
          {isOwnSlot && (canEditSlot || canManageSlots) && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setEditingSlot(slot);
                  setShowSlotModal(true);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-[#05DC7F] hover:bg-[#05DC7F]/10 transition"
                title="Edit your availability slot"
              >
                <FaEdit size={13} />
              </button>
              {canManageSlots && (
                <button
                  onClick={() => handleDeleteSlot(slot.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition"
                  title="Delete your availability slot"
                >
                  <FaTrashAlt size={13} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (!window.confirm("Are you sure you want to delete this availability slot?")) return;
    try {
      await deleteSlot(slotId);
      refetch();
    } catch (err: any) {
      alert(err?.data?.detail || "Failed to delete slot.");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/40 p-5 rounded-2xl border border-[#05DC7F]/30 backdrop-blur-md">
        <div>
          <h2 className="text-white text-2xl font-bold flex items-center gap-2">
            <FaCalendarAlt className="text-[#05DC7F]" /> Automated Interview Hub
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Calendar sync, instant video calls, candidate self-scheduling & scoring
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Always render Agenda and Slots tab modes */}
          <div className="flex bg-black/60 rounded-xl p-1 border border-[#05DC7F]/20">
            {(["Agenda", "Slots"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                  viewMode === mode
                    ? "bg-[#05DC7F] text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Add Slot button gated by interview:submit_feedback */}
          {canManageSlots && (
            <button
              onClick={() => {
                setEditingSlot(null);
                setShowSlotModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#05DC7F] text-black font-semibold hover:bg-[#04c56f] transition flex items-center gap-2 text-sm"
            >
              <FaPlus /> Add Slot
            </button>
          )}
        </div>
      </div>

      {/* AGENDA VIEW WITH DUAL HEADINGS */}
      {viewMode === "Agenda" && (
        <div className="flex flex-col gap-8">
          {isLoading ? (
            <div className="text-center py-10 text-[#05DC7F]">Loading interviews...</div>
          ) : interviews.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-black/30 rounded-2xl border border-gray-800">
              No interviews scheduled yet.
            </div>
          ) : (
            <>
              {/* SECTION 1: YOUR ASSIGNED INTERVIEWS */}
              {myInterviews.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-[#05DC7F]/30 pb-3">
                    <FaUserTie className="text-[#05DC7F] text-lg" />
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      Your Assigned Interviews
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#05DC7F]/20 text-[#05DC7F] font-semibold border border-[#05DC7F]/30">
                        {myInterviews.length}
                      </span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {myInterviews.map((item) => (
                      <InterviewCard
                        key={item.id}
                        item={item}
                        isMyInterview={true}
                        currentUserId={currentUserId}
                        onSelect={(i) => setSelected(i)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 2: TEAM INTERVIEWS */}
              {teamInterviews.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
                    <FaUsers className="text-[#05DC7F] text-lg" />
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      Team Interviews
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 font-semibold border border-white/10">
                        {teamInterviews.length}
                      </span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {teamInterviews.map((item) => (
                      <InterviewCard
                        key={item.id}
                        item={item}
                        isMyInterview={false}
                        currentUserId={currentUserId}
                        onSelect={(i) => setSelected(i)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* SLOTS VIEW */}
      {viewMode === "Slots" && (
        <div className="flex flex-col gap-8">
          {slots.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-black/30 rounded-2xl border border-gray-800">
              No available slots. Click "Add Slot" to define interviewer free hours!
            </div>
          ) : (
            <>
              {mySlots.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-[#05DC7F]/30 pb-3">
                    <FaUserCheck className="text-[#05DC7F] text-lg" />
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        Your availability
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#05DC7F]/20 text-[#05DC7F] font-semibold border border-[#05DC7F]/30">
                          {mySlots.length}
                        </span>
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">Slots you have made available for interviews.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mySlots.map((slot) => renderSlotCard(slot, true))}
                  </div>
                </section>
              )}

              {teamSlots.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
                    <FaUsers className="text-[#05DC7F] text-lg" />
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        Team availability
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 font-semibold border border-white/10">
                          {teamSlots.length}
                        </span>
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">Open slots belonging to other interviewers.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamSlots.map((slot) => renderSlotCard(slot, false))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {/* MODALS */}
      {selected && (
        <DetailsModal
          data={selected}
          currentUserId={currentUserId}
          canSubmitScorecard={canManageSlots}
          onClose={() => setSelected(null)}
          onOpenScorecard={(item, fb) => {
            setSelected(null);
            handleOpenScorecard(item, fb);
          }}
        />
      )}
      {(showSlotModal || editingSlot) && (
        <SlotBuilderModal
          initialSlot={editingSlot}
          onClose={() => {
            setShowSlotModal(false);
            setEditingSlot(null);
          }}
          onSaved={refetch}
        />
      )}
      {scoringInterview && (
        <SubmitScorecardModal
          open={Boolean(scoringInterview)}
          onClose={() => setScoringInterview(null)}
          interviewId={scoringInterview.interview.id}
          candidateName={scoringInterview.interview.candidate_name || "Candidate"}
          jobTitle={scoringInterview.interview.job_title || undefined}
          roundLabel={scoringInterview.interview.round_label || `Round ${scoringInterview.interview.round_number || 1}`}
          initialTechScore={scoringInterview.initialFeedback?.technical_score}
          initialCommScore={scoringInterview.initialFeedback?.communication_score}
          initialNotes={scoringInterview.initialFeedback?.notes}
          aiMatchScore={scoringInterview.interview.application_match_score}
          otherFeedbacks={
            currentUserId == null
              ? []
              : (scoringInterview.interview.interviewer_assignments || [])
                  .filter((assignment) => Number(assignment.interviewer_id) !== currentUserId)
                  .flatMap((assignment) =>
                    assignment.feedback
                      ? [{
                          technical_score: assignment.feedback.technical_score,
                          communication_score: assignment.feedback.communication_score,
                        }]
                      : []
                  )
          }
          onSuccess={refetch}
        />
      )}
    </div>
  );
};

export default InterviewManagementPage;
