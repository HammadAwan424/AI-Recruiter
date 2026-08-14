import React, { useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Alert,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { Calendar, UserPlus, Plus, Link as LinkIcon, CalendarCheck, Clock, CheckCircle2 } from "lucide-react";
import { useScheduleInterviewMutation, useGetInterviewersWithSlotsQuery } from "../../../interviews/api";
import { InterviewDetail, InterviewerDetail, InterviewSlot } from "../../../../shared/types/interview.types";

interface InterviewRoundsSectionProps {
  applicationId: number;
  jobId: number;
  currentStatus: string;
  interviews?: InterviewDetail[];
}

export const InterviewRoundsSection: React.FC<InterviewRoundsSectionProps> = ({
  applicationId,
  jobId,
  currentStatus,
  interviews = [],
}) => {
  // Mode selection: "self_schedule" (Default) vs "custom_slot"
  const [scheduleMode, setScheduleMode] = useState<"self_schedule" | "custom_slot">("self_schedule");

  // Single unified query returning company interviewers with their available_slots
  const { data: interviewers = [], isLoading: isLoadingInterviewers } = useGetInterviewersWithSlotsQuery(jobId);

  const [scheduleInterview, { isLoading: isScheduling }] = useScheduleInterviewMutation();

  const [showScheduleForm, setShowScheduleForm] = useState<boolean>(
    interviews.length === 0 && currentStatus === "interview"
  );
  const [selectedInterviewerIds, setSelectedInterviewerIds] = useState<number[]>([]);
  const [selectedInterviewerId, setSelectedInterviewerId] = useState<number | "">("");
  const [selectedSlotId, setSelectedSlotId] = useState<number | "">("");
  const [scheduleMsg, setScheduleMsg] = useState<string | null>(null);

  // Currently selected interviewer detail in custom slot mode
  const currentInterviewerDetail = interviewers.find((u) => u.id === selectedInterviewerId);
  const availableSlotsForInterviewer: InterviewSlot[] = currentInterviewerDetail?.available_slots || [];

  const isSlotMatchingJob = (slot: InterviewSlot) => {
    return slot.job_id === jobId || slot.job_id == null;
  };

  const handleSelectSlot = (slot: InterviewSlot) => {
    if (!isSlotMatchingJob(slot)) return;
    setSelectedSlotId(slot.id);
  };

  const handleConfirmSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleMsg(null);

    if (scheduleMode === "self_schedule") {
      if (selectedInterviewerIds.length === 0) {
        setScheduleMsg("Please select at least one interviewer.");
        return;
      }
      try {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await scheduleInterview({
          payload: {
            application_id: applicationId,
            round_number: interviews.length + 1,
            round_label: `Round ${interviews.length + 1}`,
            meeting_type: "GOOGLE_MEET",
            schedule_type: "self_schedule",
            self_schedule_token_expires_at: expiresAt.toISOString(),
            interviewer_ids: selectedInterviewerIds,
          },
        }).unwrap();

        setScheduleMsg("✅ Self-scheduling link generated! Candidate can select their preferred time slot.");
        setShowScheduleForm(false);
        setSelectedInterviewerIds([]);
      } catch (err: any) {
        setScheduleMsg(`⚠️ Could not create self-schedule request: ${err?.data?.detail || "Error"}`);
      }
    } else {
      // Custom Slot Mode
      if (!selectedInterviewerId) {
        setScheduleMsg("Please select an interviewer.");
        return;
      }
      if (!selectedSlotId) {
        setScheduleMsg("Please select an available time slot for the interviewer.");
        return;
      }

      try {
        await scheduleInterview({
          payload: {
            application_id: applicationId,
            round_number: interviews.length + 1,
            round_label: `Round ${interviews.length + 1}`,
            meeting_type: "GOOGLE_MEET",
            schedule_type: "fixed",
            assignments: [
              {
                interviewer_id: Number(selectedInterviewerId),
                slot_id: Number(selectedSlotId),
              },
            ],
          },
        }).unwrap();

        setScheduleMsg("✅ Custom interview slot booked & assigned successfully!");
        setShowScheduleForm(false);
        setSelectedInterviewerId("");
        setSelectedSlotId("");
      } catch (err: any) {
        setScheduleMsg(`⚠️ Could not book custom slot: ${err?.data?.detail || "Error"}`);
      }
    }
  };

  const hasInterviews = interviews.length > 0;
  const isInterviewStage = currentStatus === "interview";

  if (!hasInterviews && !isInterviewStage && !showScheduleForm) {
    return null;
  }

  return (
    <div className="pb-6 border-b border-white/10 space-y-4">
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Calendar size={20} className="text-[#05DC7F]" />
          <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>
            Interview Rounds & Scorecards ({interviews.length})
          </Typography>
        </Stack>

        {!showScheduleForm && (
          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<Plus size={14} />}
            onClick={() => setShowScheduleForm(true)}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            {hasInterviews ? "Add Round" : "Schedule Interview"}
          </Button>
        )}
      </Stack>

      {scheduleMsg && (
        <Alert severity={scheduleMsg.startsWith("✅") ? "success" : "warning"} sx={{ mb: 2 }}>
          {scheduleMsg}
        </Alert>
      )}

      {/* Embedded Form to Schedule & Assign Interviewers */}
      {showScheduleForm && (
        <Box className="p-4.5 rounded-xl bg-gray-900/90 border border-[#05DC7F]/40 mb-5 shadow-md">
          {/* Mode Pill Toggle (Default: Self-Schedule) */}
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-800">
            <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
              <UserPlus size={16} /> Schedule Interview Round
            </Typography>

            <div className="flex items-center bg-black/60 p-1 rounded-lg border border-gray-800 gap-1">
              <button
                type="button"
                onClick={() => setScheduleMode("self_schedule")}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                  scheduleMode === "self_schedule"
                    ? "bg-[#05DC7F]/20 text-[#05DC7F] border border-[#05DC7F]/40"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <LinkIcon size={13} /> Candidate Self-Schedule (Default)
              </button>
              <button
                type="button"
                onClick={() => setScheduleMode("custom_slot")}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                  scheduleMode === "custom_slot"
                    ? "bg-[#05DC7F]/20 text-[#05DC7F] border border-[#05DC7F]/40"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <CalendarCheck size={13} /> Custom Slot Selection
              </button>
            </div>
          </div>

          {isLoadingInterviewers ? (
            <div className="flex items-center gap-2 text-xs text-gray-400 p-4">
              <CircularProgress size={16} /> Loading interviewers list...
            </div>
          ) : (
            <form onSubmit={handleConfirmSchedule}>
              <Stack spacing={2.5}>
                {/* ===== MODE 1: SELF-SCHEDULE (DEFAULT) ===== */}
                {scheduleMode === "self_schedule" && (
                  <div className="flex flex-col gap-3">
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Assign interviewer(s) to this round. The candidate will receive a self-scheduling link to choose a time that works best for them.
                    </p>

                    <FormControl size="small" fullWidth>
                      <InputLabel id="panel-select-label">Assign Interviewer(s)</InputLabel>
                      <Select
                        labelId="panel-select-label"
                        multiple
                        value={selectedInterviewerIds}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSelectedInterviewerIds(typeof value === "string" ? value.split(",").map(Number) : value);
                        }}
                        renderValue={(selected) =>
                          interviewers
                            .filter((u) => selected.includes(u.id))
                            .map((u) => u.full_name)
                            .join(", ")
                        }
                        label="Assign Interviewer(s)"
                      >
                        {interviewers.map((u) => (
                          <MenuItem key={u.id} value={u.id}>
                            <Checkbox checked={selectedInterviewerIds.indexOf(u.id) > -1} />
                            <ListItemText primary={`${u.full_name} (${u.email})`} secondary={u.role.toUpperCase()} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </div>
                )}

                {/* ===== MODE 2: CUSTOM SLOT SELECTION ===== */}
                {scheduleMode === "custom_slot" && (
                  <div className="flex flex-col gap-3">
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Select an interviewer to view their available time slots.
                    </p>

                    {/* Step 1: Select Interviewer */}
                    <FormControl size="small" fullWidth>
                      <InputLabel id="interviewer-slot-label">Select Interviewer</InputLabel>
                      <Select
                        labelId="interviewer-slot-label"
                        value={selectedInterviewerId}
                        onChange={(e) => {
                          setSelectedInterviewerId(Number(e.target.value));
                          setSelectedSlotId("");
                        }}
                        label="Select Interviewer"
                      >
                        <MenuItem value="">-- Select Interviewer --</MenuItem>
                        {interviewers.map((interviewer: InterviewerDetail) => {
                          const eligibleCount = (interviewer.available_slots || []).filter(isSlotMatchingJob).length;
                          return (
                            <MenuItem key={interviewer.id} value={interviewer.id}>
                              {interviewer.full_name} ({eligibleCount} eligible slot{eligibleCount === 1 ? "" : "s"} for this job)
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>

                    {/* Step 2: Display Available Slots for Selected Interviewer */}
                    {selectedInterviewerId && (
                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1.5">
                          Available Time Slots for {currentInterviewerDetail?.full_name}:
                        </label>
                        {availableSlotsForInterviewer.length === 0 ? (
                          <Alert severity="warning" sx={{ py: 0.5, fontSize: 12 }}>
                            No unbooked slots found for this interviewer.
                          </Alert>
                        ) : availableSlotsForInterviewer.filter(isSlotMatchingJob).length === 0 ? (
                          <Alert severity="info" sx={{ py: 0.5, fontSize: 12 }}>
                            This interviewer has no slots configured for this job or universal scope.
                          </Alert>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-black/60 rounded-xl border border-gray-800">
                            {availableSlotsForInterviewer.map((slot) => {
                              const isMatch = isSlotMatchingJob(slot);
                              const isSelected = selectedSlotId === slot.id;

                              if (!isMatch) {
                                return (
                                  <Tooltip
                                    key={slot.id}
                                    title={`This slot is assigned to "${slot.job?.title || "another job"}" and cannot be booked for this candidate.`}
                                    arrow
                                    placement="top"
                                  >
                                    <div className="p-2.5 rounded-lg border border-gray-800/60 bg-gray-950/80 text-gray-500 opacity-40 cursor-not-allowed text-xs flex flex-col gap-1 select-none">
                                      <div className="font-semibold flex items-center justify-between text-gray-500">
                                        <span>{slot.schedule_start ? new Date(slot.schedule_start).toLocaleString() : ""}</span>
                                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-400">
                                          Locked
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-gray-600 truncate">
                                        {slot.job ? `Scope: ${slot.job.title}` : "Other Requisition"}
                                      </div>
                                    </div>
                                  </Tooltip>
                                );
                              }

                              return (
                                <div
                                  key={slot.id}
                                  onClick={() => handleSelectSlot(slot)}
                                  className={`p-2.5 rounded-lg border cursor-pointer transition text-xs flex flex-col gap-1 ${
                                    isSelected
                                      ? "bg-[#05DC7F]/20 border-[#05DC7F] text-white shadow-[0_0_10px_rgba(5,220,127,0.2)]"
                                      : "bg-gray-900/90 border-gray-800 hover:border-[#05DC7F]/60 text-gray-300"
                                  }`}
                                >
                                  <div className="font-semibold flex items-center justify-between">
                                    <span>{slot.schedule_start ? new Date(slot.schedule_start).toLocaleString() : ""}</span>
                                    {slot.job_id === jobId && (
                                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#05DC7F]/15 border border-[#05DC7F]/30 text-[#05DC7F]">
                                        Job Slot
                                      </span>
                                    )}
                                    {slot.job_id == null && (
                                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                                        Universal
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-gray-400">
                                    {slot.job ? `Scope: ${slot.job.title}` : "Universal Scope (Any Job)"}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Form Buttons */}
                <Stack direction="row" spacing={1.5} sx={{ pt: 1, justifyContent: "flex-end" }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    onClick={() => setShowScheduleForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="small"
                    variant="contained"
                    color="primary"
                    disabled={isScheduling}
                    startIcon={isScheduling ? <CircularProgress size={14} color="inherit" /> : null}
                    sx={{ fontWeight: 700 }}
                  >
                    {scheduleMode === "self_schedule" ? "Generate Self-Schedule Token" : "Book Selected Slot"}
                  </Button>
                </Stack>
              </Stack>
            </form>
          )}
        </Box>
      )}

      {/* Render Active Interview Rounds */}
      <div className="space-y-4">
        {interviews.map((interview, index) => {
          const assignments = interview.interviewer_assignments || [];
          const isSelfSchedulePending =
            interview.status === "AWAITING_SELECTION" ||
            (!interview.schedule_start && Boolean(interview.self_schedule_token));

          return (
            <div key={interview.id} className="space-y-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              {/* Round Title & Status Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-[#05DC7F]/20 text-[#05DC7F] border border-[#05DC7F]/40 text-xs font-bold font-mono">
                    Round {index + 1}
                  </span>
                  {interview.round_label && interview.round_label !== `Round ${index + 1}` && (
                    <span className="text-xs font-medium text-white/80">
                      {interview.round_label}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isSelfSchedulePending ? (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5">
                      <Clock size={12} className="text-amber-400" /> Self-Schedule Pending
                    </span>
                  ) : interview.status === "COMPLETED" ? (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-400" /> Completed
                    </span>
                  ) : interview.schedule_start ? (
                    <span className="text-xs text-white/70 flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 font-medium">
                      <Calendar size={13} className="text-[#05DC7F]" />
                      {new Date(interview.schedule_start).toLocaleString()}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Explicit Notice when Candidate has not yet selected their self-schedule time */}
              {isSelfSchedulePending && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
                  <Clock size={15} className="shrink-0 text-amber-400 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-amber-200">Awaiting Candidate Time Selection</p>
                    <p className="text-amber-300/80 text-[11px] leading-relaxed">
                      A self-scheduling link was dispatched to the candidate. The confirmed date and time will appear here automatically once the candidate chooses an available slot.
                      {interview.token_expires_at && (
                        <span className="block text-white/50 text-[10px] mt-0.5">
                          Invitation token expires: {new Date(interview.token_expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Scorecards List */}
              {assignments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {assignments.map((asgn) => {
                    const fb = asgn.feedback;
                    return (
                      <div
                        key={asgn.interviewer_id}
                        className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="text-white text-xs font-bold">
                            {asgn.interviewer?.full_name || `Interviewer #${asgn.interviewer_id}`}
                          </span>
                          {fb && (
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                              <span className="px-2 py-0.5 rounded-md bg-[#05DC7F]/15 text-[#05DC7F] border border-[#05DC7F]/30 font-bold">
                                Tech: {fb.technical_score}/10
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                                Comm: {fb.communication_score}/10
                              </span>
                            </div>
                          )}
                        </div>

                        {fb?.notes && (
                          <p className="text-xs text-white/70 italic leading-relaxed">
                            "{fb.notes}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InterviewRoundsSection;
