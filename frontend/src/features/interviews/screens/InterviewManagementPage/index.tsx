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
} from "react-icons/fa";
import { useInterviews } from "../../hooks/useInterviews";
import { useInterviewMutations } from "../../hooks/useInterviewMutations";
import { useGetJobsQuery } from "../../../jobs/api";
import { InterviewItem, InterviewSlot } from "../../../../shared/types/interview.types";
import { usePermission } from "../../../../shared/hooks/usePermission";
import { INTERVIEW_PERMISSIONS } from "../../permissions";
import { getApiBaseUrl } from "../../../../shared/utils/config";

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
  
  // Toggle Switch State: Universal Slot (All Jobs) vs Specific Job Requisition
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
          {/* Universal / Job Scoping Interactive Pill Toggle Switch */}
          <div className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <FaGlobe className="text-[#05DC7F]" /> All Jobs (Universal)
                </span>
                <span className="text-gray-400 text-xs mt-0.5">
                  {isUniversal
                    ? "Available universally across all job requisitions."
                    : "Scoped to a specific job requisition."}
                </span>
              </div>

              {/* Custom Sleek Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={isUniversal}
                onClick={() => {
                  setIsUniversal((prev) => {
                    const next = !prev;
                    if (next) setSelectedJobId("");
                    return next;
                  });
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isUniversal ? "bg-[#05DC7F]" : "bg-gray-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isUniversal ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Dropdown for Selecting Specific Job Requisition */}
            {!isUniversal && (
              <div className="pt-3 border-t border-gray-800/80">
                <label className="text-xs text-gray-300 mb-1.5 block font-medium flex items-center gap-1.5">
                  <FaBriefcase className="text-[#05DC7F]" /> Select Job Requisition
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/80 border border-gray-700 text-white text-xs focus:outline-none focus:border-[#05DC7F]"
                  required={!isUniversal}
                >
                  <option value="">-- Choose a Requisition --</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} ({job.department || "Engineering"})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-300 mb-1 block">Date</label>
            <input
              type="date"
              value={slotDate}
              onChange={(e) => setSlotDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-[#05DC7F]/30 text-white focus:outline-none focus:border-[#05DC7F]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-300 mb-1 block">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-[#05DC7F]/30 text-white focus:outline-none focus:border-[#05DC7F]"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-300 mb-1 block">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-[#05DC7F]/30 text-white focus:outline-none focus:border-[#05DC7F]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full py-3 rounded-xl font-semibold bg-[#05DC7F] text-black hover:bg-[#04c56f] transition disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : isEditing ? "Update Slot" : "Save Availability Slot"}
          </button>
        </form>
      </div>
    </div>
  );
}

function DetailsModal({ data, onClose }: { data: InterviewItem; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const { generateSelfScheduleLink } = useInterviewMutations();

  if (!data) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl bg-black/90 border border-[#05DC7F]/40 p-6 sm:p-8 shadow-[0_0_25px_rgba(5,220,127,0.4)] relative">
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
            Interviewers: Assigned Panel
          </p>
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
              <a
                href={`${getApiBaseUrl()}/interviews/${data.id}/ical`}
                download
                className="flex-1 py-2.5 rounded-xl border border-[#05DC7F]/40 text-white hover:bg-[#05DC7F]/10 transition flex items-center justify-center gap-2"
              >
                <FaDownload className="text-[#05DC7F]" /> Download .ics Calendar Invite
              </a>
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

export const InterviewManagementPage: React.FC = () => {
  const { interviews, slots, isLoading, refetch } = useInterviews();
  const { deleteSlot } = useInterviewMutations();
  const { hasPermission } = usePermission();

  const canCreateSlot = hasPermission(INTERVIEW_PERMISSIONS.CREATE);
  const canEditSlot = hasPermission(INTERVIEW_PERMISSIONS.RESCHEDULE);

  const [viewMode, setViewMode] = useState<"Agenda" | "Slots">("Agenda");
  const [selected, setSelected] = useState<InterviewItem | null>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<InterviewSlot | null>(null);

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
            Calendar sync, instant video calls & candidate self-scheduling
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
          {canCreateSlot && (
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

      {/* AGENDA VIEW */}
      {viewMode === "Agenda" && (
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <div className="text-center py-10 text-[#05DC7F]">Loading interviews...</div>
          ) : interviews.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-black/30 rounded-2xl border border-gray-800">
              No interviews scheduled yet. Click "Add Slot" or schedule one!
            </div>
          ) : (
            interviews.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-[#05DC7F]/40 bg-[#0b2a1f]/80 backdrop-blur-md shadow-[0_0_20px_rgba(5,220,127,0.15)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#05DC7F] text-xs font-semibold uppercase tracking-wider">
                      {item.status}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-gray-300 border border-gray-800 font-medium">
                      {item.job_title ? `💼 ${item.job_title}` : "🌐 Universal (All Jobs)"}
                    </span>
                  </div>
                  <h3 className="text-white text-lg font-bold">
                    {item.candidate_name || "Candidate"}
                  </h3>
                    <span className="flex items-center gap-1.5">
                      <FaCalendarAlt className="text-[#05DC7F]" />{" "}
                      {item.schedule_start ? new Date(item.schedule_start).toLocaleString() : "Awaiting Selection"}
                    </span>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  {item.meeting_link && (
                    <a
                      href={item.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 md:flex-none px-5 py-2.5 rounded-xl font-semibold bg-[#05DC7F] text-black hover:bg-[#04c56f] transition flex items-center justify-center gap-2 text-sm"
                    >
                      <FaVideo /> Join Call
                    </a>
                  )}
                  <button
                    onClick={() => setSelected(item)}
                    className="flex-1 md:flex-none px-4 py-2.5 rounded-xl font-semibold border border-[#05DC7F]/40 text-white hover:bg-[#05DC7F]/10 transition flex items-center justify-center gap-2 text-sm"
                  >
                    <FaCalendarAlt /> Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SLOTS VIEW */}
      {viewMode === "Slots" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {slots.length === 0 ? (
            <div className="col-span-full text-center py-10 text-gray-400 bg-black/30 rounded-2xl border border-gray-800">
              No available slots. Click "Add Slot" to define interviewer free hours!
            </div>
          ) : (
            slots.map((s) => {
              const isUniversalSlot = !s.job_id;
              const jobTitleDisplay = isUniversalSlot
                ? "Universal (All Jobs)"
                : s.job?.title || "Job Position";

              return (
                <div
                  key={s.id}
                  className="p-4 rounded-xl border border-[#05DC7F]/30 bg-black/50 backdrop-blur-sm flex flex-col justify-between gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-semibold text-sm flex items-center gap-2">
                        <FaCalendarAlt className="text-[#05DC7F]" /> {s.schedule_start ? new Date(s.schedule_start).toLocaleString() : ""}
                      </p>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        s.is_booked
                          ? "bg-red-500/20 text-red-400 border border-red-500/40"
                          : "bg-[#05DC7F]/20 text-[#05DC7F] border border-[#05DC7F]/40"
                      }`}
                    >
                      {s.is_booked ? "Booked" : "Available"}
                    </span>
                  </div>

                  {/* Job Scope Display (Shows Exact Job Title from Nested Job Object) */}
                  <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-gray-300 font-medium truncate max-w-[200px]">
                      {isUniversalSlot ? (
                        <FaGlobe className="text-[#05DC7F] shrink-0" />
                      ) : (
                        <FaBriefcase className="text-[#05DC7F] shrink-0" />
                      )}
                      <span className="truncate">{jobTitleDisplay}</span>
                    </span>

                    {/* Edit & Delete Action Buttons (For Unbooked Slots) */}
                    {!s.is_booked && (canEditSlot || canCreateSlot) && (
                      <div className="flex items-center gap-2">
                        {canEditSlot && (
                          <button
                            onClick={() => {
                              setEditingSlot(s);
                              setShowSlotModal(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#05DC7F] hover:bg-[#05DC7F]/10 transition"
                            title="Edit Availability Slot"
                          >
                            <FaEdit size={13} />
                          </button>
                        )}
                        {canCreateSlot && (
                          <button
                            onClick={() => handleDeleteSlot(s.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Delete Availability Slot"
                          >
                            <FaTrashAlt size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODALS */}
      {selected && <DetailsModal data={selected} onClose={() => setSelected(null)} />}
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
    </div>
  );
};
