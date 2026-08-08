import React, { useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Link,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Calendar, Clock, Video, Users, CheckCircle2, UserPlus, Plus, Link as LinkIcon, CalendarCheck } from "lucide-react";
import { useScheduleInterviewMutation, useGetInterviewersWithSlotsQuery } from "../../../interviews/api";
import { InterviewerDetail, InterviewSlot } from "../../../../shared/types/interview.types";

interface InterviewRoundsSectionProps {
  applicationId: number;
  jobId: number;
  currentStatus: string;
  interviews?: Array<{
    id: number;
    schedule_start?: string;
    schedule_end?: string;
    meeting_type: string;
    meeting_link: string;
    self_schedule_token?: string;
    status: string;
    interviewer_assignments?: Array<{
      interviewer_id: number;
      interviewer: {
        id: number;
        full_name: string;
        email: string;
      };
      feedback?: {
        id: number;
        technical_score: number;
        communication_score: number;
        notes?: string;
        created_at?: string;
      };
    }>;
  }>;
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
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [scheduleMsg, setScheduleMsg] = useState<string | null>(null);

  // Currently selected interviewer detail in custom slot mode
  const currentInterviewerDetail = interviewers.find((u) => u.id === selectedInterviewerId);
  const availableSlotsForInterviewer: InterviewSlot[] = currentInterviewerDetail?.available_slots || [];

  const handleSelectSlot = (slotId: number) => {
    setSelectedSlotId(slotId);
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
                        {interviewers.map((interviewer: InterviewerDetail) => (
                          <MenuItem key={interviewer.id} value={interviewer.id}>
                            {interviewer.full_name} ({interviewer.available_slots.length} available slots)
                          </MenuItem>
                        ))}
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
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-black/60 rounded-xl border border-gray-800">
                            {availableSlotsForInterviewer.map((slot) => {
                              const isSelected = selectedSlotId === slot.id;
                              return (
                                <div
                                  key={slot.id}
                                  onClick={() => handleSelectSlot(slot.id)}
                                  className={`p-2.5 rounded-lg border cursor-pointer transition text-xs flex flex-col gap-1 ${
                                    isSelected
                                      ? "bg-[#05DC7F]/20 border-[#05DC7F] text-white"
                                      : "bg-gray-900/90 border-gray-800 hover:border-gray-700 text-gray-300"
                                  }`}
                                >
                                  <div className="font-semibold flex items-center justify-between">
                                    <span>{slot.schedule_start ? new Date(slot.schedule_start).toLocaleString() : ""}</span>
                                  </div>
                                  <div className="text-[10px] text-gray-400">
                                    {slot.job ? `Scope: ${slot.job.title}` : "Universal Slot"}
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
          return (
            <div key={interview.id} className="space-y-3">
              {/* Round Title & Date Header (No separator line, no status pills) */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-[#05DC7F]/20 text-[#05DC7F] border border-[#05DC7F]/40 text-xs font-bold font-mono">
                    Round {index + 1}
                  </span>
                  {interview.schedule_start && (
                    <span className="text-xs text-white/50 flex items-center gap-1">
                      <Calendar size={13} className="text-[#05DC7F]" />
                      {new Date(interview.schedule_start).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Scorecards List (Score-focused, no panel header, no meeting link, no nested black boxes) */}
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
