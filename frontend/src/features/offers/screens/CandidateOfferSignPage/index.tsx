import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { FaShieldAlt, FaTimesCircle, FaPrint, FaPen, FaFont, FaUndo, FaBuilding } from "react-icons/fa";
import { getApiBaseUrl } from "../../../../shared/utils/config";
import { OfferPublicResponse, SignatureType } from "../../../../shared/types/offer.types";

export const CandidateOfferSignPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [offer, setOffer] = useState<OfferPublicResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sigType, setSigType] = useState<SignatureType>("DRAWN");
  const [typedName, setTypedName] = useState("");
  const [legalConsent, setLegalConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    fetchPublicOffer();
  }, [token]);

  const fetchPublicOffer = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/offers/public/${token}`);
      if (res.ok) {
        const data: OfferPublicResponse = await res.json();
        setOffer(data);
        setTypedName(data.candidate_name || "");
      } else {
        const errData = await res.json();
        setError(errData.detail || "Invalid or expired offer link.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#05DC7F";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSignOffer = async () => {
    if (!legalConsent) {
      alert("Please check the legal consent box to accept the offer.");
      return;
    }

    let signatureData = "";
    if (sigType === "DRAWN") {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) {
        alert("Please draw your signature on the canvas pad.");
        return;
      }
      signatureData = canvas.toDataURL("image/png");
    } else {
      if (!typedName.trim()) {
        alert("Please type your full legal name.");
        return;
      }
      signatureData = typedName.trim();
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/offers/public/${token}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: "signed",
          signature_type: sigType,
          signature_data: signatureData,
          signer_name: typedName || (offer ? offer.candidate_name : "Candidate"),
        }),
      });

      if (res.ok) {
        const updatedData: OfferPublicResponse = await res.json();
        setOffer(updatedData);
      } else {
        const err = await res.json();
        alert(`Failed to sign offer: ${err.detail}`);
      }
    } catch (err) {
      console.error("Sign error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeclineOffer = async () => {
    if (!declineReason.trim()) return alert("Please provide a reason.");

    try {
      const res = await fetch(`${getApiBaseUrl()}/offers/public/${token}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: "declined",
          decline_reason: declineReason,
        }),
      });

      if (res.ok) {
        const updatedData: OfferPublicResponse = await res.json();
        setOffer(updatedData);
        setShowDeclineModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-white">
        <p className="text-white/60 text-sm animate-pulse">Verifying secure offer link...</p>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4 text-white">
        <div className="bg-[#111827] border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <FaTimesCircle size={48} className="text-red-400 mx-auto" />
          <h2 className="text-xl font-bold">Offer Link Invalid</h2>
          <p className="text-sm text-white/60">{error || "Link expired or invalid."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-[#111827] border border-[#05DC7F]/30 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#05DC7F] font-semibold text-xs tracking-wider uppercase mb-1">
              <FaBuilding /> {offer.company_name}
            </div>
            <h1 className="text-2xl font-bold text-white">Employment Offer Letter</h1>
            <p className="text-xs text-white/60 mt-0.5">Prepared for: <span className="text-white font-medium">{offer.candidate_name}</span></p>
          </div>

          <div className="flex items-center gap-3">
            {offer.status === "SIGNED" && (
              <button onClick={() => window.print()} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs transition flex items-center gap-2">
                <FaPrint /> Print / Save PDF
              </button>
            )}
            <span className="px-3 py-1 rounded-full text-xs font-medium border bg-[#05DC7F]/20 text-[#05DC7F]">
              {offer.status}
            </span>
          </div>
        </div>

        <div className="bg-white text-gray-900 rounded-2xl p-8 shadow-2xl font-sans leading-relaxed text-sm space-y-4">
          <div className="whitespace-pre-wrap font-sans text-gray-800 text-sm leading-6">
            {offer.offer_letter_text}
          </div>

          {offer.status === "SIGNED" && (
            <div className="mt-8 pt-6 border-t border-gray-300 font-sans text-xs text-gray-700 bg-gray-50 p-4 rounded-xl border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#04b869] font-bold flex items-center gap-2"><FaShieldAlt /> Digitally Signed Audit Certificate</span>
                <span className="font-mono text-[10px] bg-gray-200 px-2 py-1 rounded">{offer.signed_at}</span>
              </div>
              <p>Signer: <strong>{offer.candidate_name}</strong></p>
            </div>
          )}
        </div>

        {offer.status !== "SIGNED" && offer.status !== "DECLINED" && (
          <div className="bg-[#111827] border border-[#05DC7F]/40 rounded-2xl p-6 space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FaPen className="text-[#05DC7F]" /> Electronic Signature Execution
            </h3>

            <div className="flex gap-2 border-b border-white/10 pb-3">
              <button onClick={() => setSigType("DRAWN")} className={`px-4 py-2 rounded-xl text-xs font-semibold ${sigType === "DRAWN" ? "bg-[#05DC7F] text-black" : "bg-white/5 text-white/60"}`}>
                <FaPen /> Draw Signature
              </button>
              <button onClick={() => setSigType("TYPED")} className={`px-4 py-2 rounded-xl text-xs font-semibold ${sigType === "TYPED" ? "bg-[#05DC7F] text-black" : "bg-white/5 text-white/60"}`}>
                <FaFont /> Type Signature
              </button>
            </div>

            {sigType === "DRAWN" ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-white/60">
                  <span>Draw signature below:</span>
                  <button onClick={clearCanvas} className="text-amber-400 hover:underline flex items-center gap-1"><FaUndo /> Clear</button>
                </div>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full bg-[#1F2937] border-2 border-dashed border-[#05DC7F]/40 rounded-xl cursor-crosshair"
                />
              </div>
            ) : (
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Type full legal name"
                className="w-full bg-[#1F2937] border border-white/20 rounded-xl p-3 text-sm text-white outline-none"
              />
            )}

            <div className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
              <input type="checkbox" id="legalConsent" checked={legalConsent} onChange={(e) => setLegalConsent(e.target.checked)} className="mt-1 accent-[#05DC7F]" />
              <label htmlFor="legalConsent" className="text-xs text-white/80">I confirm my acceptance of the employment offer terms above.</label>
            </div>

            <div className="flex justify-between items-center">
              <button onClick={() => setShowDeclineModal(true)} className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 text-xs font-semibold">Decline Offer</button>
              <button onClick={handleSignOffer} disabled={submitting} className="px-6 py-3 rounded-xl bg-[#05DC7F] text-black font-bold text-sm">
                {submitting ? "Processing..." : "Accept & Sign Offer"}
              </button>
            </div>
          </div>
        )}

        {/* Decline Modal */}
        {showDeclineModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111827] border border-red-500/40 rounded-2xl p-6 max-w-md w-full text-white space-y-4 shadow-2xl">
              <h3 className="text-lg font-bold text-white">Decline Employment Offer</h3>
              <p className="text-xs text-white/60">Please let us know the reason you are declining this offer:</p>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={3}
                placeholder="e.g. Accepted another position..."
                className="w-full bg-[#1F2937] border border-white/10 rounded-xl p-3 text-xs text-white outline-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowDeclineModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeclineOffer}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold"
                >
                  Confirm Decline
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
