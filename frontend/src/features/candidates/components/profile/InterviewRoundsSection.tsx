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
    <Box className="p-5 rounded-2xl bg-black/40 border border-gray-800/80 shadow-lg mb-6">
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
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
      <Stack spacing={3}>
        {interviews.map((interview, index) => {
          const assignments = interview.interviewer_assignments || [];
          return (
            <Box
              key={interview.id}
              className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 flex flex-col gap-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <Chip
                    label={`Round ${index + 1}`}
                    size="small"
                    color="primary"
                    sx={{ fontWeight: 700, fontSize: 11 }}
                  />
                  <Chip
                    label={interview.status}
                    size="small"
                    variant="outlined"
                    color={interview.status === "COMPLETED" ? "success" : "warning"}
                    sx={{ fontWeight: 600, fontSize: 10 }}
                  />
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-400">
                  {interview.status === "AWAITING_SELECTION" || interview.self_schedule_token ? (
                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                      <Calendar size={13} /> Awaiting Candidate Slot Selection
                    </span>
                  ) : (
                    interview.schedule_start && (
                      <span className="flex items-center gap-1">
                        <Calendar size={13} className="text-[#05DC7F]" />
                        {new Date(interview.schedule_start).toLocaleString()}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Meeting Link or Self-Schedule Token Banner */}
              {interview.self_schedule_token ? (
                <div className="p-2.5 rounded-lg bg-black/50 border border-amber-500/30 flex items-center justify-between text-xs">
                  <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                    <LinkIcon size={14} /> Self-Scheduling Token Active
                  </span>
                  <span className="text-gray-400 font-mono text-[11px]">
                    Token: {interview.self_schedule_token.substring(0, 16)}...
                  </span>
                </div>
              ) : (
                interview.meeting_link && (
                  <div className="flex items-center gap-2 text-xs">
                    <Video size={14} className="text-[#05DC7F]" />
                    <span className="text-gray-400">Meeting:</span>
                    <Link
                      href={interview.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#05DC7F] underline font-medium hover:text-[#04c56f]"
                    >
                      {interview.meeting_link}
                    </Link>
                  </div>
                )
              )}

              {/* Assigned Interviewers Panel & Scorecards */}
              <div className="flex flex-col gap-2 pt-1">
                <Typography variant="caption" className="text-gray-400 uppercase tracking-wider font-bold flex items-center gap-1">
                  <Users size={12} /> Assigned Panel ({assignments.length})
                </Typography>

                {assignments.length === 0 ? (
                  <p className="text-gray-500 text-xs italic">No interviewers assigned to this round yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {assignments.map((asgn) => {
                      const fb = asgn.feedback;
                      return (
                        <div
                          key={asgn.interviewer_id}
                          className="p-3 rounded-lg bg-black/80 border border-gray-800 flex flex-col gap-1.5"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-white text-xs font-semibold">
                              {asgn.interviewer?.full_name || `Interviewer #${asgn.interviewer_id}`}
                            </span>
                            {fb ? (
                              <span className="text-[#05DC7F] text-[10px] font-bold flex items-center gap-0.5">
                                <CheckCircle2 size={12} /> Feedback Submitted
                              </span>
                            ) : (
                              <span className="text-amber-400 text-[10px] font-medium">Pending Scorecard</span>
                            )}
                          </div>

                          {fb && (
                            <div className="mt-1 pt-1.5 border-t border-gray-800/80 flex flex-col gap-1 text-xs">
                              <div className="flex justify-between text-gray-300 font-medium">
                                <span>Tech: <strong className="text-white">{fb.technical_score}/10</strong></span>
                                <span>Comm: <strong className="text-white">{fb.communication_score}/10</strong></span>
                              </div>
                              {fb.notes && (
                                <p className="text-gray-400 text-[11px] italic bg-gray-900/80 p-1.5 rounded border border-gray-800 mt-0.5">
                                  "{fb.notes}"
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};
