import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaCalendarAlt, FaClock, FaCheckCircle, FaVideo, FaExclamationTriangle } from "react-icons/fa";
import { getApiBaseUrl } from "../../../../shared/utils/config";

export const CandidateSelfSchedulePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedInterview, setConfirmedInterview] = useState<any>(null);

  useEffect(() => {
    fetchSlots();
  }, [token]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/interviews/public/slots/${token}`);
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || "Invalid or expired scheduling link");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlotId) return alert("Please select a time slot first.");

    const selectedSlot = data?.available_slots?.find((s: any) => s.id === selectedSlotId);
    if (!selectedSlot) return alert("Selected slot is invalid.");

    setSubmitting(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/interviews/public/schedule/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignments: [
            {
              interviewer_id: selectedSlot.interviewer_id,
              slot_id: selectedSlot.id,
            },
          ],
        }),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || "Failed to confirm interview booking");
      }
      const result = await res.json();
      setConfirmedInterview(result);
    } catch (err: any) {
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
        </div>
      </div>
    );
  }

  if (confirmedInterview) {
    const startTimeFormatted = confirmedInterview.schedule_start
      ? new Date(confirmedInterview.schedule_start).toLocaleString()
      : "Scheduled";

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full p-8 rounded-3xl bg-black/90 border border-[#05DC7F]/50 text-center space-y-4">
          <FaCheckCircle className="text-[#05DC7F] text-6xl mx-auto animate-bounce" />
          <h1 className="text-3xl font-bold text-white">Interview Scheduled!</h1>
          <p className="text-gray-300">
            Your interview for <span className="text-[#05DC7F] font-semibold">{data?.job_title}</span> has been confirmed.
          </p>

          <div className="bg-[#0b2a1f] p-5 rounded-2xl border border-[#05DC7F]/30 text-left space-y-2 text-sm text-gray-200">
            <p className="flex items-center gap-2"><FaCalendarAlt className="text-[#05DC7F]" /> Time: {startTimeFormatted}</p>
            <p className="flex items-center gap-2"><FaVideo className="text-[#05DC7F]" /> Video Call: {confirmedInterview.meeting_type}</p>
          </div>

          {confirmedInterview.meeting_link && (
            <a
              href={confirmedInterview.meeting_link}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 rounded-xl font-bold bg-[#05DC7F] text-black hover:bg-[#04c56f] transition flex items-center justify-center gap-2"
            >
              <FaVideo /> Join Video Room
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-black/80 rounded-3xl border border-[#05DC7F]/40 p-6 sm:p-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Select Your Interview Slot</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Hi <span className="text-white font-semibold">{data?.candidate_name}</span>, pick a time slot for <span className="text-[#05DC7F]">{data?.job_title}</span>.
          </p>
        </div>

        <div className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data?.available_slots?.map((slot: any) => {
              const isSelected = selectedSlotId === slot.id;
              const startFormatted = slot.schedule_start
                ? new Date(slot.schedule_start).toLocaleString()
                : "Slot";

              return (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={`p-4 rounded-2xl border text-left transition ${
                    isSelected ? "bg-[#05DC7F]/20 border-[#05DC7F]" : "bg-black/50 border-gray-800"
                  }`}
                >
                  <span className="text-white font-bold block">{startFormatted}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleConfirmBooking}
          disabled={!selectedSlotId || submitting}
          className={`w-full py-4 rounded-2xl font-bold text-base transition ${
            selectedSlotId && !submitting ? "bg-[#05DC7F] text-black hover:bg-[#04c56f]" : "bg-gray-800 text-gray-500 cursor-not-allowed"
          }`}
        >
          {submitting ? "Confirming Booking..." : "Confirm Selected Interview Slot"}
        </button>
      </div>
    </div>
  );
};
