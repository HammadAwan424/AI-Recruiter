import React, { useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Link,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Calendar, Clock, Video, Users, CheckCircle2, UserPlus, Plus } from "lucide-react";
import { useGetCompanyUsersQuery } from "../../../users/api";
import { useScheduleInterviewMutation } from "../../../interviews/api";

interface InterviewRoundsSectionProps {
  applicationId: number;
  jobId: number;
  currentStatus: string;
  interviews?: Array<{
    id: number;
    scheduled_date?: string;
    scheduled_time?: string;
    duration_minutes: number;
    meeting_type: string;
    meeting_link: string;
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
  const { data: interviewerUsersData } = useGetCompanyUsersQuery("interviewer");
  const { data: allUsersData } = useGetCompanyUsersQuery();
  const companyUsers = interviewerUsersData?.users?.length
    ? interviewerUsersData.users
    : allUsersData?.users || [];

  const [scheduleInterview, { isLoading: isScheduling }] = useScheduleInterviewMutation();

  const [showScheduleForm, setShowScheduleForm] = useState<boolean>(
    (interviews.length === 0 && currentStatus === "interview")
  );
  const [selectedInterviewerIds, setSelectedInterviewerIds] = useState<number[]>([]);
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [scheduledTime, setScheduledTime] = useState<string>("10:00");
  const [scheduleMsg, setScheduleMsg] = useState<string | null>(null);

  const handleConfirmSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleMsg(null);

    if (selectedInterviewerIds.length === 0) {
      setScheduleMsg("Please select at least one panel interviewer.");
      return;
    }

    try {
      await scheduleInterview({
        application_id: applicationId,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        interviewer_ids: selectedInterviewerIds,
      }).unwrap();

      setScheduleMsg("✅ Interview scheduled & panel assigned successfully!");
      setShowScheduleForm(false);
      setSelectedInterviewerIds([]);
    } catch (err: any) {
      setScheduleMsg(`⚠️ Could not schedule interview: ${err?.data?.detail || "Error"}`);
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
        <Box className="p-4 rounded-xl bg-gray-900/80 border border-[#05DC7F]/40 mb-4 shadow-md">
          <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, mb: 2, display: "flex", items: "center", gap: 1 }}>
            <UserPlus size={16} /> Schedule Round & Assign Panel Interviewers
          </Typography>

          <form onSubmit={handleConfirmSchedule}>
            <Stack spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel id="panel-select-label">Assign Panel Interviewers</InputLabel>
                <Select
                  labelId="panel-select-label"
                  multiple
                  value={selectedInterviewerIds}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedInterviewerIds(typeof value === "string" ? value.split(",").map(Number) : value);
                  }}
                  renderValue={(selected) =>
                    companyUsers
                      .filter((u) => selected.includes(u.id))
                      .map((u) => u.full_name)
                      .join(", ")
                  }
                  label="Assign Panel Interviewers"
                >
                  {companyUsers.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      <Checkbox checked={selectedInterviewerIds.indexOf(u.id) > -1} />
                      <ListItemText primary={`${u.full_name} (${u.email})`} secondary={u.role} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Stack direction="row" spacing={2}>
                <TextField
                  type="date"
                  label="Scheduled Date"
                  size="small"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                />
                <TextField
                  type="time"
                  label="Scheduled Time"
                  size="small"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required
                />
              </Stack>

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
                  Confirm & Schedule
                </Button>
              </Stack>
            </Stack>
          </form>
        </Box>
      )}

      {/* List of Existing Scheduled / Completed Interview Rounds */}
      {hasInterviews && (
        <Stack spacing={3}>
          {interviews.map((interview, index) => (
            <div
              key={interview.id}
              className="p-4 rounded-xl bg-gray-900/60 border border-gray-800/90 flex flex-col gap-3"
            >
              {/* Interview Round Header */}
              <div className="flex justify-between items-center border-b border-gray-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#05DC7F]/20 text-[#05DC7F] font-bold text-xs flex items-center justify-center border border-[#05DC7F]/40">
                    #{index + 1}
                  </span>
                  <span className="text-white font-bold text-sm">Round #{interview.id}</span>
                </div>
                <Chip
                  label={interview.status}
                  size="small"
                  className="bg-emerald-950/70 border border-emerald-800/50 text-emerald-400 font-bold uppercase text-[9px]"
                />
              </div>

              {/* Date, Time & Meeting Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar size={14} className="text-[#05DC7F]" />
                  <span>Date: {interview.scheduled_date || "TBD"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock size={14} className="text-[#05DC7F]" />
                  <span>Time: {interview.scheduled_time || "TBD"} ({interview.duration_minutes}m)</span>
                </div>
                {interview.meeting_link && (
                  <div className="flex items-center gap-2 sm:col-span-2 text-gray-300 pt-1">
                    <Video size={14} className="text-[#05DC7F]" />
                    <span className="text-gray-400">Meeting:</span>
                    <Link
                      href={interview.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                      className="text-[#05DC7F] font-semibold truncate"
                    >
                      {interview.meeting_link}
                    </Link>
                  </div>
                )}
              </div>

              {/* Interviewer Assignments & Scorecards */}
              {interview.interviewer_assignments && interview.interviewer_assignments.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-800/60 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold">
                    <Users size={14} /> Assigned Panel Interviewers ({interview.interviewer_assignments.length}):
                  </div>
                  <div className="flex flex-col gap-2 pl-2">
                    {interview.interviewer_assignments.map((assignment) => (
                      <div key={assignment.interviewer_id} className="p-2.5 rounded-lg bg-black/40 border border-gray-800/70 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium">{assignment.interviewer.full_name} ({assignment.interviewer.email})</span>
                          {assignment.feedback ? (
                            <span className="text-emerald-400 font-bold text-[10px] uppercase flex items-center gap-1">
                              <CheckCircle2 size={12} /> Feedback Submitted
                            </span>
                          ) : (
                            <span className="text-amber-400/80 font-semibold text-[10px] uppercase">Pending Feedback</span>
                          )}
                        </div>

                        {assignment.feedback && (
                          <div className="mt-2 pt-2 border-t border-gray-800/50 flex flex-col gap-1 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Technical Score:</span>
                              <span className="text-[#05DC7F] font-bold">{assignment.feedback.technical_score} / 10</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Communication Score:</span>
                              <span className="text-[#05DC7F] font-bold">{assignment.feedback.communication_score} / 10</span>
                            </div>
                            {assignment.feedback.notes && (
                              <p className="text-gray-300 text-[11px] italic mt-1 bg-gray-900/50 p-2 rounded">
                                "{assignment.feedback.notes}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </Stack>
      )}
    </Box>
  );
};
