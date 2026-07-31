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
} from "react-icons/fa";
import { useInterviews } from "../../hooks/useInterviews";
import { useInterviewMutations } from "../../hooks/useInterviewMutations";
import { InterviewItem } from "../../../../shared/types/interview.types";

function SlotBuilderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [slotDate, setSlotDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const { createSlot, isSubmitting } = useInterviewMutations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotDate) return alert("Please select a date");

    try {
      await createSlot({
        slot_date: slotDate,
        start_time: startTime + ":00",
        end_time: endTime + ":00",
      });
      alert("Availability slot created successfully!");
      onCreated();
      onClose();
    } catch (err: any) {
      alert(err?.data?.detail || "Failed to create slot");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-black/90 border border-[#05DC7F]/40 p-6 shadow-[0_0_25px_rgba(5,220,127,0.4)] relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <FaTimes />
        </button>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FaPlus className="text-[#05DC7F]" /> Add Availability Slot
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            {isSubmitting ? "Creating..." : "Save Availability Slot"}
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
      alert("Failed to generate candidate link");
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
            Position: {data.job_title}
          </p>
          <p className="flex items-center gap-2">
            <FaClock className="text-[#05DC7F]" />
            Date: {data.scheduled_date} | Time: {data.scheduled_time}
          </p>
          <p className="flex items-center gap-2">
            <FaVideo className="text-[#05DC7F]" />
            Meeting Type: {data.meeting_type || "Video Call"}
          </p>
          <p className="flex items-center gap-2">
            <FaUsers className="text-[#05DC7F]" />
            Interviewers: {data.interviewer_1 || "Assigned Team"}
            {data.interviewer_2 ? `, ${data.interviewer_2}` : ""}
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
                href={`http://127.0.0.1:8000/interviews/${data.id}/ical`}
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
  const [viewMode, setViewMode] = useState<"Agenda" | "Slots">("Agenda");
  const [selected, setSelected] = useState<InterviewItem | null>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);

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
          <button
            onClick={() => setShowSlotModal(true)}
            className="px-4 py-2 rounded-xl bg-[#05DC7F] text-black font-semibold hover:bg-[#04c56f] transition flex items-center gap-2 text-sm"
          >
            <FaPlus /> Add Slot
          </button>
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
                  <span className="text-[#05DC7F] text-xs font-semibold uppercase tracking-wider">
                    {item.status}
                  </span>
                  <h3 className="text-white text-lg font-bold">
                    {item.candidate_name || "Candidate"}
                  </h3>
                  <p className="text-gray-300 text-sm">{item.job_title}</p>
                  <div className="flex flex-wrap gap-4 text-gray-400 text-xs mt-2">
                    <span className="flex items-center gap-1.5">
                      <FaCalendarAlt className="text-[#05DC7F]" /> {item.scheduled_date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FaClock className="text-[#05DC7F]" /> {item.scheduled_time} ({item.duration_minutes || 45}m)
                    </span>
                  </div>
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
            slots.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl border border-[#05DC7F]/30 bg-black/50 backdrop-blur-sm flex justify-between items-center"
              >
                <div>
                  <p className="text-white font-semibold text-sm">{s.slot_date}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {s.start_time} - {s.end_time}
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
            ))
          )}
        </div>
      )}

      {/* MODALS */}
      {selected && <DetailsModal data={selected} onClose={() => setSelected(null)} />}
      {showSlotModal && (
        <SlotBuilderModal
          onClose={() => setShowSlotModal(false)}
          onCreated={refetch}
        />
      )}
    </div>
  );
};
