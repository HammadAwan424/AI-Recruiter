import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  LockKeyhole,
  Mail,
  PenLine,
  Printer,
  RotateCcw,
  ShieldCheck,
  Type,
  X,
} from "lucide-react";
import { getApiBaseUrl } from "../../../../shared/utils/config";
import type {
  OfferPublicResponse,
  OfferStatus,
  SignatureType,
} from "../../../../shared/types/offer.types";
import logo from "../../../../images/logo.png";

const OFFER_API_PATH = "/offers/public";

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const getStatusCopy = (status: OfferStatus) => {
  if (status === "SIGNED") {
    return {
      label: "Signed",
      description: "Your signed offer has been securely recorded.",
      className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    };
  }
  if (status === "DECLINED") {
    return {
      label: "Declined",
      description: "This offer was marked as declined.",
      className: "border-rose-400/30 bg-rose-400/10 text-rose-300",
    };
  }
  return {
    label: "Action required",
    description: "Review the letter and choose how you would like to respond.",
    className: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  };
};

const readError = async (response: Response, fallback: string) => {
  try {
    const body = await response.json();
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) {
      return body.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join(" ") || fallback;
    }
  } catch {
    // The API may return an empty or non-JSON error response.
  }
  return fallback;
};

const PublicShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative min-h-screen overflow-hidden bg-[#07111f] text-slate-100">
    <div className="pointer-events-none absolute -left-32 -top-40 h-[32rem] w-[32rem] rounded-full bg-emerald-400/10 blur-3xl" />
    <div className="pointer-events-none absolute -right-48 top-1/3 h-[36rem] w-[36rem] rounded-full bg-blue-500/10 blur-3xl" />
    <header className="relative z-10 border-b border-white/10 bg-[#07111f]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/10">
            <img src={logo} alt="AI Recruiter" className="h-7 w-7 object-contain" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-white">AI Recruiter</p>
            <p className="text-[11px] text-slate-400">Candidate document portal</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <LockKeyhole size={14} className="text-emerald-300" />
          Secure signing link
        </div>
      </div>
    </header>
    {children}
  </div>
);

const LoadingState: React.FC = () => (
  <PublicShell>
    <main className="relative z-10 mx-auto flex min-h-[calc(100vh-73px)] max-w-xl items-center justify-center px-5 py-12">
      <div className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-black/20 sm:p-12">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10">
          <Loader2 className="animate-spin text-emerald-300" size={25} />
        </div>
        <h1 className="text-xl font-semibold text-white">Opening your offer</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">We’re verifying your secure link. This will only take a moment.</p>
      </div>
    </main>
  </PublicShell>
);

const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <PublicShell>
    <main className="relative z-10 mx-auto flex min-h-[calc(100vh-73px)] max-w-xl items-center justify-center px-5 py-12">
      <div className="w-full rounded-3xl border border-rose-300/20 bg-white/[0.04] p-8 text-center shadow-2xl shadow-black/20 sm:p-12">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-300/20 bg-rose-300/10">
          <AlertCircle className="text-rose-300" size={26} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">Unable to open offer</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">This signing link is unavailable</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-[#061019] transition hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-300/50"
        >
          <RotateCcw size={16} />
          Try again
        </button>
      </div>
    </main>
  </PublicShell>
);

const OfferSummary: React.FC<{ offer: OfferPublicResponse }> = ({ offer }) => (
  <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
        <FileText size={19} />
      </div>
      <div>
        <h2 className="font-semibold text-white">Offer summary</h2>
        <p className="text-xs text-slate-400">Key details at a glance</p>
      </div>
    </div>
    <dl className="space-y-4 text-sm">
      <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-4">
        <dt className="text-slate-400">Position</dt>
        <dd className="text-right font-medium text-white">{offer.job_title}</dd>
      </div>
      <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-4">
        <dt className="text-slate-400">Start date</dt>
        <dd className="text-right font-medium text-white">{formatDate(offer.start_date)}</dd>
      </div>
      <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-4">
        <dt className="text-slate-400">Base salary</dt>
        <dd className="text-right font-semibold text-emerald-300">{formatMoney(offer.base_salary)}</dd>
      </div>
      {offer.bonus_equity && (
        <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-4">
          <dt className="text-slate-400">Bonus / equity</dt>
          <dd className="max-w-[12rem] text-right font-medium text-white">{offer.bonus_equity}</dd>
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <dt className="text-slate-400">Offer expires</dt>
        <dd className="text-right font-medium text-white">{formatDate(offer.expiry_date)}</dd>
      </div>
    </dl>
  </section>
);

const CompletionCard: React.FC<{ offer: OfferPublicResponse }> = ({ offer }) => {
  const signed = offer.status === "SIGNED";
  return (
    <section className={`rounded-2xl border p-5 ${signed ? "border-emerald-300/20 bg-emerald-300/[0.07]" : "border-rose-300/20 bg-rose-300/[0.06]"}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${signed ? "bg-emerald-300/15 text-emerald-300" : "bg-rose-300/15 text-rose-300"}`}>
          {signed ? <CheckCircle2 size={19} /> : <X size={19} />}
        </div>
        <div>
          <h2 className="font-semibold text-white">{signed ? "Offer accepted" : "Offer declined"}</h2>
          <p className="mt-1 text-sm leading-5 text-slate-300">
            {signed ? "Thank you. A confirmation has been sent and the hiring team has been notified." : "The hiring team has been notified of your decision."}
          </p>
          {signed && offer.signed_at && (
            <p className="mt-3 text-xs text-emerald-200/80">Signed on {formatDate(offer.signed_at)}</p>
          )}
          {!signed && offer.decline_reason && (
            <p className="mt-3 border-l-2 border-rose-300/40 pl-3 text-xs italic text-rose-100/70">“{offer.decline_reason}”</p>
          )}
        </div>
      </div>
      {signed && (
        <div className="mt-5 flex items-center gap-2 border-t border-emerald-300/15 pt-4 text-xs text-emerald-200/80">
          <ShieldCheck size={15} />
          Your signature is protected by a tamper-evident audit record.
        </div>
      )}
    </section>
  );
};

export const CandidateOfferSignPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [offer, setOffer] = useState<OfferPublicResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signatureType, setSignatureType] = useState<SignatureType>("TYPED");
  const [signerName, setSignerName] = useState("");
  const [typedSignature, setTypedSignature] = useState("");
  const [legalConsent, setLegalConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [declineError, setDeclineError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const hasDrawnRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const fetchPublicOffer = useCallback(async (signal?: AbortSignal) => {
    if (!token) {
      setError("The offer link is missing its security token.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}${OFFER_API_PATH}/${encodeURIComponent(token)}`, { signal });
      if (!response.ok) {
        throw new Error(await readError(response, "The offer may have expired or already been withdrawn."));
      }
      const data: OfferPublicResponse = await response.json();
      setOffer(data);
      setSignerName((current) => current || data.candidate_name || "");
      setTypedSignature((current) => current || data.candidate_name || "");
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      setError(requestError instanceof Error ? requestError.message : "We could not connect to the signing service.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchPublicOffer(controller.signal);
    return () => controller.abort();
  }, [fetchPublicOffer]);

  const prepareCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(ratio, ratio);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 2.5;
    context.strokeStyle = "#6ee7b7";
  }, []);

  useEffect(() => {
    if (signatureType !== "DRAWN" || offer?.status !== "SENT") return;
    const frame = window.requestAnimationFrame(prepareCanvas);
    window.addEventListener("resize", prepareCanvas);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", prepareCanvas);
    };
  }, [offer?.status, prepareCanvas, signatureType]);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const point = pointFromEvent(event);
    const context = canvas?.getContext("2d");
    if (!canvas || !point || !context) return;
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
    drawingRef.current = true;
    hasDrawnRef.current = true;
    setHasDrawn(true);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const point = pointFromEvent(event);
    const context = canvasRef.current?.getContext("2d");
    if (!point || !context) return;
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const stopDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
    setHasDrawn(false);
  };

  const handleSignOffer = async () => {
    setFormError(null);
    const trimmedName = signerName.trim();
    const trimmedTypedSignature = typedSignature.trim();

    if (!trimmedName) {
      setFormError("Enter your full legal name before signing.");
      return;
    }
    if (!legalConsent) {
      setFormError("Confirm that you accept the terms of this offer to continue.");
      return;
    }

    let signatureData = trimmedTypedSignature;
    if (signatureType === "DRAWN") {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) {
        setFormError("Draw your signature in the signature field to continue.");
        return;
      }
      signatureData = canvas.toDataURL("image/png");
    } else if (!trimmedTypedSignature) {
      setFormError("Type your signature to continue.");
      return;
    }

    if (!token) {
      setFormError("This offer link is missing its security token.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}${OFFER_API_PATH}/${encodeURIComponent(token)}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: "signed",
          signer_name: trimmedName,
          signature_type: signatureType,
          signature_data: signatureData,
        }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "We could not record your signature. Please try again."));
      }
      setOffer(await response.json());
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : "We could not record your signature. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeclineOffer = async () => {
    setDeclineError(null);
    if (!declineReason.trim()) {
      setDeclineError("Please provide a short reason so the hiring team can follow up.");
      return;
    }
    if (!token) {
      setDeclineError("This offer link is missing its security token.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}${OFFER_API_PATH}/${encodeURIComponent(token)}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "declined", decline_reason: declineReason.trim() }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "We could not record your decision. Please try again."));
      }
      setOffer(await response.json());
      setShowDeclineModal(false);
    } catch (requestError) {
      setDeclineError(requestError instanceof Error ? requestError.message : "We could not record your decision. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error || !offer) return <ErrorState message={error || "The offer could not be loaded."} onRetry={() => void fetchPublicOffer()} />;

  const statusCopy = getStatusCopy(offer.status);
  const isAwaitingDecision = offer.status === "SENT";

  return (
    <PublicShell>
      <main className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              <Building2 size={15} />
              {offer.company_name}
              <span className="text-slate-600">/</span>
              Employment offer
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">Your next chapter starts here.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              {offer.job_title} offer prepared for <span className="font-medium text-slate-200">{offer.candidate_name}</span>.
            </p>
          </div>
          <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${statusCopy.className}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {statusCopy.label}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start">
          <div className="space-y-6">
            <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#f8fafc] shadow-2xl shadow-black/30">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-6 sm:flex-row sm:items-start sm:px-10">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Offer letter</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">{offer.job_title}</h2>
                  <p className="mt-1 text-sm text-slate-500">Prepared by {offer.company_name}</p>
                </div>
                <div className="rounded-xl bg-slate-100 px-3 py-2 text-right text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">{formatDate(offer.start_date)}</p>
                  <p>Proposed start date</p>
                </div>
              </div>
              <div className="px-6 py-8 sm:px-10 sm:py-10">
                <div className="whitespace-pre-wrap font-serif text-[15px] leading-8 text-slate-700">{offer.offer_letter_text}</div>
                {offer.status === "SIGNED" && (
                  <div className="mt-10 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    <ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={19} />
                    <div>
                      <p className="font-semibold">Digitally signed and recorded</p>
                      <p className="mt-1 text-xs leading-5 text-emerald-800/80">This document was accepted on {formatDate(offer.signed_at)}.</p>
                    </div>
                  </div>
                )}
              </div>
            </article>

            <div className="flex items-center justify-between gap-4 px-1 text-xs text-slate-500">
              <span className="flex items-center gap-2"><LockKeyhole size={14} className="text-emerald-300" /> Private candidate link</span>
              <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-white/5 hover:text-slate-300">
                <Printer size={14} /> Print letter
              </button>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6">
            <OfferSummary offer={offer} />
            {isAwaitingDecision ? (
              <section className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.07] p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-300/15 text-emerald-300">
                    <PenLine size={19} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">Review & sign</h2>
                    <p className="text-xs text-slate-400">Two quick steps to respond</p>
                  </div>
                </div>

                <div className="mb-5 flex items-center gap-2 text-[11px] font-medium text-slate-400">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-300 text-[#061019]">1</span>
                  Choose a signature
                  <span className="h-px flex-1 bg-white/10" />
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/20">2</span>
                  Confirm
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/10 p-1">
                  <button type="button" onClick={() => { setSignatureType("TYPED"); setFormError(null); }} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${signatureType === "TYPED" ? "bg-white text-slate-900 shadow" : "text-slate-400 hover:text-white"}`}>
                    <Type size={15} /> Type
                  </button>
                  <button type="button" onClick={() => { setSignatureType("DRAWN"); setFormError(null); }} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${signatureType === "DRAWN" ? "bg-white text-slate-900 shadow" : "text-slate-400 hover:text-white"}`}>
                    <PenLine size={15} /> Draw
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-medium text-slate-300">
                    Full legal name
                    <input value={signerName} onChange={(event) => setSignerName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#07111f]/70 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10" placeholder="Your full name" />
                  </label>

                  {signatureType === "TYPED" ? (
                    <label className="block text-xs font-medium text-slate-300">
                      Your signature
                      <input value={typedSignature} onChange={(event) => setTypedSignature(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#07111f]/70 px-3.5 py-3 font-serif text-lg italic text-white outline-none transition placeholder:font-sans placeholder:text-sm placeholder:not-italic placeholder:text-slate-600 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10" placeholder="Type your name" />
                    </label>
                  ) : (
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-300">
                        <span>Draw your signature</span>
                        <button type="button" onClick={clearCanvas} className="inline-flex items-center gap-1 text-slate-400 transition hover:text-emerald-300"><RotateCcw size={13} /> Clear</button>
                      </div>
                      <canvas ref={canvasRef} width={600} height={180} onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={stopDrawing} onPointerCancel={stopDrawing} className="h-36 w-full touch-none rounded-xl border border-dashed border-emerald-300/30 bg-[#07111f]/70" aria-label="Draw your signature" />
                      <p className="mt-1.5 text-[11px] text-slate-500">Use your finger, stylus, or mouse.</p>
                    </div>
                  )}

                  <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-white/10 bg-black/10 p-3 text-xs leading-5 text-slate-300">
                    <input type="checkbox" checked={legalConsent} onChange={(event) => { setLegalConsent(event.target.checked); setFormError(null); }} className="mt-1 h-4 w-4 shrink-0 accent-emerald-300" />
                    <span>I confirm that I have reviewed this offer and agree to its terms.</span>
                  </label>
                  {formError && <p className="flex items-start gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-xs leading-5 text-rose-200"><AlertCircle size={15} className="mt-0.5 shrink-0" />{formError}</p>}
                  <button type="button" onClick={handleSignOffer} disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3.5 text-sm font-bold text-[#061019] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-300/50">
                    {submitting ? <Loader2 className="animate-spin" size={17} /> : <Check size={17} />}
                    {submitting ? "Recording signature…" : "Accept & sign offer"}
                  </button>
                  <button type="button" onClick={() => { setDeclineError(null); setShowDeclineModal(true); }} disabled={submitting} className="w-full rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 transition hover:bg-rose-300/10 hover:text-rose-200 disabled:opacity-50">I want to decline this offer</button>
                </div>
              </section>
            ) : (
              <CompletionCard offer={offer} />
            )}

            <div className="flex items-start gap-2.5 px-1 text-xs leading-5 text-slate-500">
              <Mail size={14} className="mt-0.5 shrink-0 text-slate-400" />
              Questions? Contact the hiring team using the email address that sent this offer.
            </div>
          </aside>
        </div>
      </main>

      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020611]/80 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="decline-title">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d1a2b] p-6 shadow-2xl shadow-black/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-300">Offer response</p>
                <h2 id="decline-title" className="mt-2 text-xl font-semibold text-white">Decline this offer?</h2>
              </div>
              <button type="button" onClick={() => setShowDeclineModal(false)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Close decline dialog"><X size={18} /></button>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">A short reason helps the hiring team understand your decision. This action cannot be undone from this link.</p>
            <label className="mt-5 block text-xs font-medium text-slate-300">
              Reason for declining
              <textarea value={declineReason} onChange={(event) => setDeclineReason(event.target.value)} rows={4} maxLength={1000} className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-[#07111f]/80 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-rose-300/50 focus:ring-2 focus:ring-rose-300/10" placeholder="For example: I’ve accepted another opportunity." />
            </label>
            {declineError && <p className="mt-3 flex items-start gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-xs leading-5 text-rose-200"><AlertCircle size={15} className="mt-0.5 shrink-0" />{declineError}</p>}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setShowDeclineModal(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10">Keep reviewing</button>
              <button type="button" onClick={handleDeclineOffer} disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-400 px-4 py-3 text-sm font-semibold text-[#21090f] transition hover:bg-rose-300 disabled:opacity-60">
                {submitting && <Loader2 className="animate-spin" size={16} />}
                Confirm decline
              </button>
            </div>
          </div>
        </div>
      )}
    </PublicShell>
  );
};
