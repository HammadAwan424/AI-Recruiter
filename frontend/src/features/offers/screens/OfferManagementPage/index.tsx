import React, { useState } from "react";
import {
  FaFileContract,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaPaperPlane,
  FaPlus,
  FaCopy,
  FaEye,
  FaLock,
  FaShieldAlt,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { useOffers } from "../../hooks/useOffers";
import { useOfferMutations } from "../../hooks/useOfferMutations";
import { useGetJobsQuery } from "../../../jobs/api";
import { OfferItem, OfferCreatePayload } from "../../../../shared/types/offer.types";
import { usePermission } from "../../../../shared/hooks/usePermission";
import { OFFER_PERMISSIONS } from "../../permissions";

export const OfferManagementPage: React.FC = () => {
  const { offers, templates, isLoading } = useOffers();
  const { data: jobsData } = useGetJobsQuery();
  const jobs = jobsData?.jobs || [];

  const { hasPermission } = usePermission();
  const canGenerateOffer = hasPermission(OFFER_PERMISSIONS.GENERATE);
  const canApproveOffer = hasPermission(OFFER_PERMISSIONS.APPROVE);

  const { createOffer, submitOfferApproval, approveOfferAction, sendOffer } = useOfferMutations();

  const [activeFilter, setActiveFilter] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<OfferItem | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const [formData, setFormData] = useState<OfferCreatePayload>({
    candidate_id: 0,
    job_id: 0,
    job_title: "",
    department: "",
    base_salary: 0,
    bonus_equity: "",
    start_date: "",
    expiry_date: "",
    offer_letter_text: "",
  });

  const [approvalComments, setApprovalComments] = useState("");

  const handleTemplateChange = (templateId: string) => {
    const tmpl = templates.find((t) => String(t.id) === String(templateId));
    let content = tmpl ? tmpl.content : "";

    if (content) {
      content = content
        .replace(/{{job_title}}/g, formData.job_title || "[Job Title]")
        .replace(/{{base_salary}}/g, formData.base_salary ? `$${Number(formData.base_salary).toLocaleString()}` : "[Base Salary]")
        .replace(/{{start_date}}/g, formData.start_date || "[Start Date]")
        .replace(/{{department}}/g, formData.department || "[Department]");
    } else if (!formData.offer_letter_text) {
      content = `Dear Candidate,\n\nWe are thrilled to offer you the position of ${formData.job_title || "[Job Title]"} at AI Recruiter.\n\nYour annual starting salary will be $${formData.base_salary ? Number(formData.base_salary).toLocaleString() : "[Salary]"} per year, starting on ${formData.start_date || "[Date]"}.\n\nPlease review and sign this offer letter before the expiration date.\n\nSincerely,\nAI Recruiter Team`;
    }

    setFormData((prev) => ({
      ...prev,
      offer_letter_text: content,
    }));
  };

  const handleCreateOffer = async (submitDirectly = false) => {
    if (!formData.job_id || !formData.base_salary || !formData.start_date) {
      alert("Please fill in required job, salary, and start date fields.");
      return;
    }

    try {
      await createOffer({
        ...formData,
        candidate_id: formData.candidate_id || 1,
        submit_for_approval: submitDirectly,
      });

      alert(submitDirectly ? "Offer created and submitted for approval!" : "Offer draft saved successfully!");
      setShowCreateModal(false);
    } catch (err: any) {
      alert(`Error: ${err?.data?.detail || "Failed to create offer"}`);
    }
  };

  const handleSubmitApproval = async (offerId: number) => {
    try {
      await submitOfferApproval(offerId);
      alert("Offer submitted for approval!");
    } catch (err: any) {
      alert(err?.data?.detail || "Error submitting approval");
    }
  };

  const handleApprovalAction = async (offerId: number, action: "APPROVE" | "REJECT") => {
    try {
      await approveOfferAction(offerId, action, approvalComments);
      alert(`Offer ${action === "APPROVE" ? "Approved" : "Rejected"} successfully!`);
      setApprovalComments("");
      setSelectedOffer(null);
    } catch (err: any) {
      alert(err?.data?.detail || "Error processing approval");
    }
  };

  const handleSendOffer = async (offerId: number) => {
    try {
      const res = await sendOffer(offerId);
      const candidateLink = `${window.location.origin}/offer/sign/${res.secure_token}`;
      alert(`Offer Sent Successfully!\n\nCandidate Public Signing Link:\n${candidateLink}`);
    } catch (err: any) {
      alert(err?.data?.detail || "Error sending offer");
    }
  };

  const handleCopyLink = (secureToken: string) => {
    const candidateLink = `${window.location.origin}/offer/sign/${secureToken}`;
    navigator.clipboard.writeText(candidateLink);
    setCopiedToken(secureToken);
    setTimeout(() => setCopiedToken(null), 3000);
  };

  const filteredOffers = offers.filter((o) => {
    if (activeFilter === "ALL") return true;
    return o.status === activeFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <span className="px-2.5 py-1 rounded-full text-xs bg-gray-500/20 text-gray-300 border border-gray-500/30 flex items-center gap-1.5 w-fit"><FaClock className="text-xs" /> Draft</span>;
      case "PENDING_APPROVAL":
        return <span className="px-2.5 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 w-fit"><FaClock className="text-xs" /> Pending Approval</span>;
      case "APPROVED":
        return <span className="px-2.5 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1.5 w-fit"><FaCheckCircle className="text-xs" /> Approved</span>;
      case "SENT":
        return <span className="px-2.5 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1.5 w-fit"><FaPaperPlane className="text-xs" /> Sent to Candidate</span>;
      case "SIGNED":
        return <span className="px-2.5 py-1 rounded-full text-xs bg-[#05DC7F]/20 text-[#05DC7F] border border-[#05DC7F]/40 flex items-center gap-1.5 w-fit font-medium"><FaShieldAlt className="text-xs" /> Signed & Hired</span>;
      case "DECLINED":
        return <span className="px-2.5 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1.5 w-fit"><FaTimesCircle className="text-xs" /> Declined</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs bg-gray-500/20 text-gray-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Top Header & Quick Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111827]/80 p-6 rounded-2xl border border-[#05DC7F]/30 backdrop-blur-md shadow-[0_0_15px_rgba(5,220,127,0.1)]">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
            <FaFileContract className="text-[#05DC7F]" /> Offer Management & E-Signatures
          </h2>
          <p className="text-white/60 text-sm mt-1">
            Create offer letters, manage approval workflows, and track tamper-proof digital signatures.
          </p>
        </div>

        {canGenerateOffer && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#05DC7F] text-black font-semibold hover:bg-[#04b869] transition duration-300 shadow-[0_0_15px_rgba(5,220,127,0.4)]"
          >
            <FaPlus /> Create Offer Letter
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#1F2937]/70 p-4 rounded-xl border border-white/10">
          <p className="text-white/50 text-xs uppercase tracking-wider">Total Offers</p>
          <p className="text-2xl font-bold text-white mt-1">{offers.length}</p>
        </div>
        <div className="bg-[#1F2937]/70 p-4 rounded-xl border border-amber-500/30">
          <p className="text-amber-400/80 text-xs uppercase tracking-wider">Pending Approval</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {offers.filter((o) => o.status === "PENDING_APPROVAL").length}
          </p>
        </div>
        <div className="bg-[#1F2937]/70 p-4 rounded-xl border border-purple-500/30">
          <p className="text-purple-400/80 text-xs uppercase tracking-wider">Sent to Candidate</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">
            {offers.filter((o) => o.status === "SENT").length}
          </p>
        </div>
        <div className="bg-[#1F2937]/70 p-4 rounded-xl border border-[#05DC7F]/40">
          <p className="text-[#05DC7F]/80 text-xs uppercase tracking-wider">Signed & Hired</p>
          <p className="text-2xl font-bold text-[#05DC7F] mt-1">
            {offers.filter((o) => o.status === "SIGNED").length}
          </p>
        </div>
        <div className="bg-[#1F2937]/70 p-4 rounded-xl border border-red-500/30">
          <p className="text-red-400/80 text-xs uppercase tracking-wider">Declined</p>
          <p className="text-2xl font-bold text-red-400 mt-1">
            {offers.filter((o) => o.status === "DECLINED").length}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-white/10 pb-2">
        {["ALL", "PENDING_APPROVAL", "APPROVED", "SENT", "SIGNED", "DECLINED", "DRAFT"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm transition whitespace-nowrap ${
              activeFilter === tab
                ? "bg-[#05DC7F]/20 text-[#05DC7F] border border-[#05DC7F]/40 font-medium"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Offers Table */}
      <div className="bg-[#111827]/90 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-8 text-center text-white/60">Loading offer letters...</div>
        ) : filteredOffers.length === 0 ? (
          <div className="p-12 text-center text-white/50 space-y-3">
            <FaFileContract size={40} className="mx-auto text-white/20" />
            <p className="text-base">No offer letters found for this status.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-white/50 text-xs uppercase tracking-wider border-b border-white/10">
                  <th className="p-4">Position & Dept</th>
                  <th className="p-4">Base Salary</th>
                  <th className="p-4">Start Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Audit Digest</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-white/80">
                {filteredOffers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-white/[0.02] transition">
                    <td className="p-4">
                      <p className="font-semibold text-white">{offer.job_title}</p>
                      <p className="text-xs text-white/50">{offer.department || "Engineering"}</p>
                    </td>
                    <td className="p-4 font-mono text-[#05DC7F]">
                      ${Number(offer.base_salary).toLocaleString()}/yr
                    </td>
                    <td className="p-4 text-white/70">{offer.start_date}</td>
                    <td className="p-4">{getStatusBadge(offer.status)}</td>
                    <td className="p-4">
                      {offer.audit_hash ? (
                        <div className="flex items-center gap-1.5 text-xs text-[#05DC7F] font-mono bg-[#05DC7F]/10 px-2.5 py-1 rounded border border-[#05DC7F]/30 w-fit">
                          <FaLock className="text-[10px]" />
                          {offer.audit_hash.substring(0, 12)}...
                        </div>
                      ) : (
                        <span className="text-xs text-white/30">—</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedOffer(offer)}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition inline-flex items-center gap-1"
                      >
                        <FaEye /> View
                      </button>

                      {offer.status === "DRAFT" && canGenerateOffer && (
                        <button
                          onClick={() => handleSubmitApproval(offer.id)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs transition"
                        >
                          Submit Approval
                        </button>
                      )}

                      {offer.status === "APPROVED" && canGenerateOffer && (
                        <button
                          onClick={() => handleSendOffer(offer.id)}
                          className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs transition inline-flex items-center gap-1"
                        >
                          <FaPaperPlane /> Send Offer
                        </button>
                      )}

                      {offer.secure_token && (
                        <button
                          onClick={() => handleCopyLink(offer.secure_token!)}
                          className="px-3 py-1.5 rounded-lg bg-[#05DC7F]/20 hover:bg-[#05DC7F]/30 text-[#05DC7F] border border-[#05DC7F]/40 text-xs transition inline-flex items-center gap-1"
                        >
                          <FaCopy /> {copiedToken === offer.secure_token ? "Copied!" : "Copy Link"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE OFFER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111827] border border-[#05DC7F]/30 rounded-2xl p-6 w-full max-w-3xl my-8 text-white space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-[#05DC7F]">
                <FaFileContract /> Create Offer Letter
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-white/50 hover:text-white">
                <FaTimes size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/60 block mb-1">Select Job Position *</label>
                <select
                  value={formData.job_id}
                  onChange={(e) => {
                    const jb = jobs.find((j) => String(j.id) === e.target.value);
                    setFormData({
                      ...formData,
                      job_id: Number(e.target.value),
                      job_title: jb ? jb.title : "",
                      department: jb ? jb.department || "Engineering" : "",
                    });
                  }}
                  className="w-full bg-[#1F2937] border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-[#05DC7F] outline-none"
                >
                  <option value="">-- Choose Job --</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.department || "Dept"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-1">Base Salary (USD/yr) *</label>
                <input
                  type="number"
                  placeholder="e.g. 95000"
                  value={formData.base_salary || ""}
                  onChange={(e) => setFormData({ ...formData, base_salary: Number(e.target.value) })}
                  className="w-full bg-[#1F2937] border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-[#05DC7F] outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-1">Bonus / Equity (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. $10,000 Signing Bonus + 0.1% Equity"
                  value={formData.bonus_equity}
                  onChange={(e) => setFormData({ ...formData, bonus_equity: e.target.value })}
                  className="w-full bg-[#1F2937] border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-[#05DC7F] outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-1">Target Start Date *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full bg-[#1F2937] border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-[#05DC7F] outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-1">Offer Expiration Date</label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="w-full bg-[#1F2937] border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-[#05DC7F] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1">Apply Offer Template</label>
              <select
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full bg-[#1F2937] border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-[#05DC7F] outline-none mb-2"
              >
                <option value="">-- Standard Engineering Offer Template --</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1">Offer Letter Body (Markdown / Text)</label>
              <textarea
                rows={6}
                value={formData.offer_letter_text}
                onChange={(e) => setFormData({ ...formData, offer_letter_text: e.target.value })}
                className="w-full bg-[#1F2937] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#05DC7F] outline-none font-mono"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => handleCreateOffer(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleCreateOffer(true)}
                className="px-5 py-2 rounded-xl bg-[#05DC7F] text-black font-semibold hover:bg-[#04b869] text-sm transition shadow-[0_0_10px_rgba(5,220,127,0.3)]"
              >
                Submit for Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL & APPROVAL MODAL */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111827] border border-white/20 rounded-2xl p-6 w-full max-w-2xl my-8 text-white space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedOffer.job_title} Offer</h3>
                <p className="text-xs text-white/50">Offer ID: #{selectedOffer.id}</p>
              </div>
              <button onClick={() => setSelectedOffer(null)} className="text-white/50 hover:text-white">
                <FaTimes size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-white/5 p-3 rounded-xl">
              <div>
                <span className="text-white/50">Base Salary:</span>{" "}
                <span className="font-semibold text-[#05DC7F]">${Number(selectedOffer.base_salary).toLocaleString()}/yr</span>
              </div>
              <div>
                <span className="text-white/50">Start Date:</span>{" "}
                <span className="font-semibold text-white">{selectedOffer.start_date}</span>
              </div>
              <div>
                <span className="text-white/50">Status:</span> {getStatusBadge(selectedOffer.status)}
              </div>
              <div>
                <span className="text-white/50">Audit Hash:</span>{" "}
                <span className="font-mono text-[#05DC7F]">{selectedOffer.audit_hash ? selectedOffer.audit_hash.substring(0, 10) + "..." : "None"}</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-white/60 mb-1 font-semibold">Offer Letter Content:</p>
              <div className="bg-[#1F2937] p-4 rounded-xl border border-white/10 text-xs whitespace-pre-wrap font-mono text-white/80 max-h-60 overflow-y-auto">
                {selectedOffer.offer_letter_text}
              </div>
            </div>

            {selectedOffer.status === "PENDING_APPROVAL" && canApproveOffer && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl space-y-3">
                <p className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                  <FaClock /> Executive Approval Action
                </p>
                <input
                  type="text"
                  placeholder="Approval comments (optional)"
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  className="w-full bg-[#1F2937] border border-white/10 rounded-lg p-2 text-xs text-white outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprovalAction(selectedOffer.id, "APPROVE")}
                    className="flex-1 py-2 bg-[#05DC7F] text-black font-semibold rounded-lg text-xs hover:bg-[#04b869] transition flex items-center justify-center gap-1"
                  >
                    <FaCheck /> Approve Offer
                  </button>
                  <button
                    onClick={() => handleApprovalAction(selectedOffer.id, "REJECT")}
                    className="flex-1 py-2 bg-red-500/20 text-red-400 border border-red-500/40 font-semibold rounded-lg text-xs hover:bg-red-500/30 transition flex items-center justify-center gap-1"
                  >
                    <FaTimes /> Reject Offer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
