import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaVideo,
  FaBuilding,
  FaExclamationTriangle,
  FaDownload,
} from "react-icons/fa";

export default function CandidateSelfSchedulePage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedInterview, setConfirmedInterview] = useState(null);

  useEffect(() => {
    fetchSlots();
  }, [token]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/interviews/public/slots/${token}`
      );
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || "Invalid or expired scheduling link");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlotId) return alert("Please select a time slot first.");
    setSubmitting(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/interviews/public/schedule/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slot_id: selectedSlotId }),
        }
      );
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || "Failed to confirm interview booking");
      }
      const result = await res.json();
      setConfirmedInterview(result);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-[#05DC7F] text-lg font-semibold animate-pulse">
          Loading available interview slots...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-black/80 border border-red-500/40 text-center">
          <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Link Expired or Invalid</h2>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <p className="text-xs text-gray-500">
            Please contact the HR team for a new self-scheduling invitation link.
          </p>
        </div>
      </div>
    );
  }

  if (confirmedInterview) {
    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `Interview: ${data?.job_title}`
    )}&dates=${confirmedInterview.scheduled_date.replace(/-/g, "")}T100000Z/${confirmedInterview.scheduled_date.replace(
      /-/g,
      ""
    )}T110000Z&details=${encodeURIComponent(
      `Join Video Call: ${confirmedInterview.meeting_link}`
    )}&location=${encodeURIComponent(confirmedInterview.meeting_link)}`;

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full p-8 rounded-3xl bg-black/90 border border-[#05DC7F]/50 shadow-[0_0_40px_rgba(5,220,127,0.3)] text-center">
          <FaCheckCircle className="text-[#05DC7F] text-6xl mx-auto mb-4 animate-bounce" />
          <h1 className="text-3xl font-bold text-white mb-2">Interview Scheduled!</h1>
          <p className="text-gray-300 mb-6">
            Your interview for <span className="text-[#05DC7F] font-semibold">{data?.job_title}</span> has been confirmed.
          </p>

          <div className="bg-[#0b2a1f] p-5 rounded-2xl border border-[#05DC7F]/30 text-left mb-6 flex flex-col gap-2.5 text-sm text-gray-200">
            <p className="flex items-center gap-2">
              <FaCalendarAlt className="text-[#05DC7F]" /> Date: {confirmedInterview.scheduled_date}
            </p>
            <p className="flex items-center gap-2">
              <FaClock className="text-[#05DC7F]" /> Time: {confirmedInterview.scheduled_time} ({confirmedInterview.duration_minutes}m)
            </p>
            <p className="flex items-center gap-2">
              <FaVideo className="text-[#05DC7F]" /> Video Call: {confirmedInterview.meeting_type}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href={confirmedInterview.meeting_link}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 rounded-xl font-bold bg-[#05DC7F] text-black hover:bg-[#04c56f] transition flex items-center justify-center gap-2"
            >
              <FaVideo /> Join Video Room
            </a>
            <a
              href={googleCalUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 rounded-xl border border-[#05DC7F]/40 text-white hover:bg-[#05DC7F]/10 transition flex items-center justify-center gap-2 text-sm"
            >
              <FaCalendarAlt className="text-[#05DC7F]" /> Add to Google Calendar
            </a>
            <a
              href={`http://127.0.0.1:8000/interviews/${confirmedInterview.id}/ical`}
              download
              className="w-full py-3 rounded-xl border border-[#05DC7F]/40 text-white hover:bg-[#05DC7F]/10 transition flex items-center justify-center gap-2 text-sm"
            >
              <FaDownload className="text-[#05DC7F]" /> Download .ics Calendar File
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-black/80 rounded-3xl border border-[#05DC7F]/40 p-6 sm:p-10 shadow-[0_0_30px_rgba(5,220,127,0.2)]">
        {/* HEADER */}
        <div className="text-center mb-8">
          <span className="text-[#05DC7F] text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-[#05DC7F]/10 border border-[#05DC7F]/30">
            Interview Self-Scheduling
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mt-3">
            Select Your Interview Slot
          </h1>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">
            Hi <span className="text-white font-semibold">{data?.candidate_name}</span>, please pick a convenient time slot below for your <span className="text-[#05DC7F]">{data?.job_title}</span> interview at {data?.company_name}.
          </p>
        </div>

        {/* SLOTS GRID */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FaClock className="text-[#05DC7F]" /> Available Time Slots
          </h3>
          {data?.available_slots?.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bg-black/40 rounded-2xl border border-gray-800">
              No available slots at the moment. HR will contact you shortly!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data?.available_slots?.map((slot) => {
                const isSelected = selectedSlotId === slot.id;
                return (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col gap-1 ${
                      isSelected
                        ? "bg-[#05DC7F]/20 border-[#05DC7F] shadow-[0_0_15px_rgba(5,220,127,0.4)]"
                        : "bg-black/50 border-gray-800 hover:border-[#05DC7F]/40"
                    }`}
                  >
                    <span className="text-white font-bold text-base flex items-center justify-between">
                      {slot.slot_date}
                      {isSelected && <FaCheckCircle className="text-[#05DC7F]" />}
                    </span>
                    <span className="text-gray-300 text-sm">
                      {slot.start_time} - {slot.end_time}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <button
          onClick={handleConfirmBooking}
          disabled={!selectedSlotId || submitting}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
            selectedSlotId && !submitting
              ? "bg-[#05DC7F] text-black hover:bg-[#04c56f] shadow-[0_0_20px_rgba(5,220,127,0.5)] cursor-pointer"
              : "bg-gray-800 text-gray-500 cursor-not-allowed"
          }`}
        >
          {submitting ? "Confirming Booking..." : "Confirm Selected Interview Slot"}
        </button>
      </div>
    </div>
  );
}
