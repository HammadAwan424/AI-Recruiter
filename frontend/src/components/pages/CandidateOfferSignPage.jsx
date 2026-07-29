import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  FaShieldAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaPrint,
  FaPen,
  FaFont,
  FaUndo,
  FaLock,
  FaFileContract,
  FaBuilding,
  FaCalendarAlt,
  FaDollarSign,
} from "react-icons/fa";

export default function CandidateOfferSignPage() {
  const { token } = useParams();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Signing State
  const [sigType, setSigType] = useState("DRAWN"); // DRAWN | TYPED
  const [typedName, setTypedName] = useState("");
  const [legalConsent, setLegalConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signedSuccess, setSignedSuccess] = useState(false);

  // Decline State
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  // Canvas Refs
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    fetchPublicOffer();
  }, [token]);

  const fetchPublicOffer = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/offers/public/${token}`);
      if (res.ok) {
        const data = await res.json();
        setOffer(data);
        setTypedName(data.candidate_name || "");
        if (data.status === "SIGNED") {
          setSignedSuccess(true);
        }
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

  // Canvas Drawing Handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Submit Signature Handler
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
      const res = await fetch(`http://localhost:8000/offers/public/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature_type: sigType,
          signature_data: signatureData,
          signer_name: typedName || (offer ? offer.candidate_name : "Candidate"),
        }),
      });

      if (res.ok) {
        const updatedData = await res.json();
        setOffer(updatedData);
        setSignedSuccess(true);
      } else {
        const err = await res.json();
        alert(`Failed to sign offer: ${err.detail}`);
      }
    } catch (err) {
      console.error("Sign error:", err);
      alert("An error occurred while submitting your signature.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeclineOffer = async () => {
    if (!declineReason.trim()) {
      alert("Please provide a reason for declining.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/offers/public/${token}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decline_reason: declineReason }),
      });

      if (res.ok) {
        const updatedData = await res.json();
        setOffer(updatedData);
        setShowDeclineModal(false);
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#05DC7F] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white/60 text-sm">Verifying secure offer link...</p>
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4 text-white">
        <div className="bg-[#111827] border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <FaTimesCircle size={48} className="text-red-400 mx-auto" />
          <h2 className="text-xl font-bold">Offer Link Invalid</h2>
          <p className="text-sm text-white/60">{error || "This offer link is invalid, expired, or has been revoked."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-[#111827] border border-[#05DC7F]/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(5,220,127,0.1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#05DC7F] font-semibold text-xs tracking-wider uppercase mb-1">
              <FaBuilding /> {offer.company_name}
            </div>
            <h1 className="text-2xl font-bold text-white">Official Employment Offer Letter</h1>
            <p className="text-xs text-white/60 mt-0.5">Prepared for: <span className="text-white font-medium">{offer.candidate_name}</span></p>
          </div>

          <div className="flex items-center gap-3">
            {offer.status === "SIGNED" && (
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition flex items-center gap-2"
              >
                <FaPrint /> Print / Save as PDF
              </button>
            )}

            <div className="text-right">
              <span className="text-xs text-white/40 block">Offer Status</span>
              {offer.status === "SIGNED" ? (
                <span className="px-3 py-1 rounded-full text-xs bg-[#05DC7F]/20 text-[#05DC7F] border border-[#05DC7F]/40 font-medium inline-flex items-center gap-1">
                  <FaCheckCircle /> Signed & Accepted
                </span>
              ) : offer.status === "DECLINED" ? (
                <span className="px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30 font-medium inline-flex items-center gap-1">
                  <FaTimesCircle /> Declined
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium">
                  Awaiting E-Signature
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Offer Terms Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#111827] p-4 rounded-xl border border-white/10">
            <span className="text-white/40 text-xs block mb-1">Position Title</span>
            <p className="font-semibold text-white text-sm">{offer.job_title}</p>
          </div>
          <div className="bg-[#111827] p-4 rounded-xl border border-white/10">
            <span className="text-white/40 text-xs block mb-1">Department</span>
            <p className="font-semibold text-white text-sm">{offer.department || "Engineering"}</p>
          </div>
          <div className="bg-[#111827] p-4 rounded-xl border border-[#05DC7F]/30">
            <span className="text-[#05DC7F]/70 text-xs block mb-1">Base Salary</span>
            <p className="font-bold text-[#05DC7F] text-sm">${Number(offer.base_salary).toLocaleString()} / year</p>
          </div>
          <div className="bg-[#111827] p-4 rounded-xl border border-white/10">
            <span className="text-white/40 text-xs block mb-1">Target Start Date</span>
            <p className="font-semibold text-white text-sm">{offer.start_date}</p>
          </div>
        </div>

        {/* Offer Letter Document Viewer */}
        <div className="bg-white text-gray-900 rounded-2xl p-8 shadow-2xl font-serif leading-relaxed text-sm space-y-4 relative">
          <div className="flex justify-between items-center border-b pb-4 mb-4 font-sans text-xs text-gray-500">
            <div>
              <p className="font-bold text-gray-900 text-sm">{offer.company_name}</p>
              <p>Human Resources & Talent Acquisition</p>
            </div>
            <div className="text-right">
              <p>Offer Date: {new Date().toLocaleDateString()}</p>
              <p>Ref ID: #{offer.secure_token.substring(0, 8).toUpperCase()}</p>
            </div>
          </div>

          <div className="whitespace-pre-wrap font-sans text-gray-800 text-sm leading-6">
            {offer.offer_letter_text}
          </div>

          {/* Signed Certificate Block in Document */}
          {offer.status === "SIGNED" && (
            <div className="mt-8 pt-6 border-t border-gray-300 font-sans text-xs text-gray-700 bg-gray-50 p-4 rounded-xl border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-[#04b869] font-bold text-sm">
                  <FaShieldAlt /> Digitally Signed & Tamper-Proof Audit Certificate
                </div>
                <span className="bg-[#04b869]/10 text-[#04b869] px-2.5 py-1 rounded font-mono font-semibold">
                  SHA-256 VERIFIED
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 block">Signer Legal Name</span>
                  <span className="font-semibold text-gray-900">{offer.signer_name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Signed Timestamp</span>
                  <span className="font-semibold text-gray-900">{new Date(offer.signed_at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Signature Type</span>
                  <span className="font-semibold text-gray-900">{offer.signature_type}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Verification Digest</span>
                  <span className="font-mono text-gray-900 text-[10px] block truncate">{offer.audit_hash}</span>
                </div>
              </div>

              {offer.signature_data && (
                <div className="mt-4 pt-3 border-t">
                  <span className="text-gray-500 block mb-1">Captured Signature Stamp:</span>
                  {offer.signature_type === "DRAWN" ? (
                    <img src={offer.signature_data} alt="Signature Stamp" className="h-12 object-contain bg-white p-1 border rounded" />
                  ) : (
                    <span className="text-2xl font-serif italic text-blue-900">{offer.signature_data}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* E-SIGNATURE INTERACTIVE WIDGET (Shown if not yet signed or declined) */}
        {offer.status !== "SIGNED" && offer.status !== "DECLINED" && (
          <div className="bg-[#111827] border border-[#05DC7F]/40 rounded-2xl p-6 shadow-2xl space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FaPen className="text-[#05DC7F]" /> Electronic Signature Execution
            </h3>

            {/* Signature Type Switcher */}
            <div className="flex gap-2 border-b border-white/10 pb-3">
              <button
                onClick={() => setSigType("DRAWN")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                  sigType === "DRAWN"
                    ? "bg-[#05DC7F] text-black shadow-[0_0_10px_rgba(5,220,127,0.4)]"
                    : "bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                <FaPen /> Draw Signature
              </button>
              <button
                onClick={() => setSigType("TYPED")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                  sigType === "TYPED"
                    ? "bg-[#05DC7F] text-black shadow-[0_0_10px_rgba(5,220,127,0.4)]"
                    : "bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                <FaFont /> Type Signature
              </button>
            </div>

            {/* Signature Input Canvas or Input */}
            {sigType === "DRAWN" ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-white/60">
                  <span>Draw your signature inside the box below:</span>
                  <button onClick={clearCanvas} className="text-amber-400 hover:underline flex items-center gap-1">
                    <FaUndo /> Clear Canvas
                  </button>
                </div>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full bg-[#1F2937] border-2 border-dashed border-[#05DC7F]/40 rounded-xl cursor-crosshair touch-none"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-xs text-white/60 block">Type Full Legal Name:</label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  className="w-full bg-[#1F2937] border border-white/20 rounded-xl p-3 text-sm text-white focus:border-[#05DC7F] outline-none"
                  placeholder="e.g. Jane Doe"
                />
                {typedName && (
                  <div className="p-4 bg-[#1F2937] rounded-xl border border-white/10 text-center">
                    <span className="text-3xl font-serif italic text-[#05DC7F] tracking-wider">{typedName}</span>
                  </div>
                )}
              </div>
            )}

            {/* Legal Consent Checkbox */}
            <div className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
              <input
                type="checkbox"
                id="legalConsent"
                checked={legalConsent}
                onChange={(e) => setLegalConsent(e.target.checked)}
                className="mt-1 w-4 h-4 accent-[#05DC7F] cursor-pointer"
              />
              <label htmlFor="legalConsent" className="text-xs text-white/80 leading-relaxed cursor-pointer">
                I understand that submitting this electronic signature constitutes a legally binding agreement under applicable Electronic Signature regulations. I confirm my acceptance of the employment offer terms above.
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setShowDeclineModal(true)}
                className="px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-semibold hover:bg-red-500/30 transition"
              >
                Decline Offer
              </button>

              <button
                onClick={handleSignOffer}
                disabled={submitting}
                className="px-6 py-3 rounded-xl bg-[#05DC7F] text-black font-bold hover:bg-[#04b869] text-sm transition shadow-[0_0_15px_rgba(5,220,127,0.4)] disabled:opacity-50"
              >
                {submitting ? "Processing E-Signature..." : "Accept & Sign Offer"}
              </button>
            </div>
          </div>
        )}

        {/* Decline Modal */}
        {showDeclineModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111827] border border-red-500/40 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
              <h3 className="text-lg font-bold text-red-400">Decline Employment Offer</h3>
              <p className="text-xs text-white/60">
                Please provide feedback for why you are declining this offer letter:
              </p>
              <textarea
                rows={4}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g. Accepted another offer / Compensation expectations..."
                className="w-full bg-[#1F2937] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-red-400"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeclineModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeclineOffer}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold text-xs hover:bg-red-600 transition"
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
}
