import React, { useState } from "react";
import {
  FaClock,
  FaPlus,
  FaCheck,
  FaCog,
  FaUserCheck,
  FaExclamationTriangle,
  FaPaperPlane,
  FaEye,
  FaFileAlt,
  FaEdit,
  FaArrowLeft,
} from "react-icons/fa";
import { useOffers } from "../../hooks/useOffers";
import { useOfferMutations } from "../../hooks/useOfferMutations";
import { useGetJobsQuery } from "../../../jobs/api";
import { useGetApplicationsQuery } from "../../../candidates/api";
import { OfferItem, OfferTemplate } from "../../../../shared/types/offer.types";
import { usePermission } from "../../../../shared/hooks/usePermission";
import { OFFER_PERMISSIONS } from "../../permissions";
import { isDraggableInterviewCandidate, isPendingApprovalOffer } from "../../../../shared/utils/candidateEvaluation";
import { InterviewCandidateCard } from "../../../candidates/components/cards/InterviewCandidateCard";
import { RequestOfferApprovalModal } from "../../../../shared/components/RequestOfferApprovalModal";
import { CandidateProfile } from "../../../../shared/components/CandidateProfile";
import { OfferTemplateEditor } from "../../components/OfferTemplateEditor";
import { useUpdateOfferTemplateMutation } from "../../api";

export const OfferManagementPage: React.FC = () => {
  const { offers, templates, isLoading } = useOffers();
  const { data: jobsData } = useGetJobsQuery();
  const jobs = jobsData?.jobs || [];

  // Selected job filter for candidate queries
  const [selectedJobId, setSelectedJobId] = useState<number>(jobs[0]?.id || 1);
  const { data: applicationsData, isLoading: isAppsLoading } = useGetApplicationsQuery(selectedJobId, {
    skip: !selectedJobId,
  });

  const applications = Array.isArray(applicationsData) ? applicationsData : [];

  const { hasPermission } = usePermission();
  const canGenerateOffer = hasPermission(OFFER_PERMISSIONS.GENERATE);
  const canApproveOffer = hasPermission(OFFER_PERMISSIONS.APPROVE);

  const { createOfferTemplate, updateOfferTemplate, approveOfferAction } = useOfferMutations();

  // Navigation Tabs: 2 Main Tabs ("CREATION" | "APPROVAL")
  const [activeTab, setActiveTab] = useState<"CREATION" | "APPROVAL">("CREATION");

  // Template Manager Toggle inside Offer Creation section
  const [showTemplatesView, setShowTemplatesView] = useState(false);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("ALL");

  // Template Full View Editor State: null | "NEW" | OfferTemplate
  const [editingTemplate, setEditingTemplate] = useState<OfferTemplate | "NEW" | null>(null);

  // ──── NESTED NAVIGATION STATES ────
  // 1. Offer Creation Candidate Selection
  const [selectedCandidateForCreation, setSelectedCandidateForCreation] = useState<any | null>(null);
  const [showRequestApprovalModal, setShowRequestApprovalModal] = useState(false);

  // 2. Offer Approval Item Selection
  const [selectedOfferForApproval, setSelectedOfferForApproval] = useState<OfferItem | null>(null);
  const [showApproveConfirmModal, setShowApproveConfirmModal] = useState(false);

  const [approvalComments, setApprovalComments] = useState("");

  // Centralized candidate & offer filtering logic mapping directly to Kanban columns
  const interviewedCandidates = applications.filter((app) => isDraggableInterviewCandidate(app));

  const pendingApprovalOffers = offers.filter((o) => {
    const isPending = isPendingApprovalOffer(o);
    if (!isPending) return false;
    // Map offer to active requisition (selectedJobId)
    const appId = o.application_id;
    const app = applications.find((a) => a.id === appId);
    if (app) return app.job_id === selectedJobId;
    return o.job_id === selectedJobId || !selectedJobId;
  });

  const handleTabSelect = (tab: "CREATION" | "APPROVAL") => {
    setActiveTab(tab);
    setSelectedCandidateForCreation(null);
    setSelectedOfferForApproval(null);
    setShowTemplatesView(false);
    setEditingTemplate(null);
  };

  const handleOpenCreationDetail = (candidateApp: any) => {
    setSelectedCandidateForCreation(candidateApp);
  };

  const handleSaveTemplateEditor = async (data: { title: string; department: string; content: string }) => {
    if (editingTemplate && typeof editingTemplate === "object") {
      await updateOfferTemplate(editingTemplate.id, data);
      alert("Offer Template Updated Successfully!");
    } else {
      await createOfferTemplate(data);
      alert("Offer Template Created Successfully!");
    }
    setEditingTemplate(null);
  };

  const handleApproveActionSubmit = async (action: "APPROVE" | "REJECT") => {
    if (!selectedOfferForApproval) return;

    try {
      await approveOfferAction(selectedOfferForApproval.id, action, approvalComments);
      alert(`Offer ${action === "APPROVE" ? "Approved & Email Dispatched to Candidate" : "Declined"} Successfully!`);
      setApprovalComments("");
      setShowApproveConfirmModal(false);
      setSelectedOfferForApproval(null);
    } catch (err: any) {
      alert(err?.data?.detail || "Error processing offer approval");
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* ──── TWO MAIN NAVIGATION TABS (ALWAYS VISIBLE AT ALL TIMES) ──── */}
      <div className="flex w-full bg-[#111827]/90 border border-white/10 rounded-2xl p-1.5 shadow-lg">
        <button
          onClick={() => handleTabSelect("CREATION")}
          className={`flex-1 py-3 px-4 text-center text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === "CREATION"
              ? "bg-[#05DC7F] text-black shadow-[0_0_15px_rgba(5,220,127,0.4)] font-bold"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <FaPlus /> Offer Creation
        </button>

        <button
          onClick={() => handleTabSelect("APPROVAL")}
          className={`flex-1 py-3 px-4 text-center text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === "APPROVAL"
              ? "bg-[#05DC7F] text-black shadow-[0_0_15px_rgba(5,220,127,0.4)] font-bold"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <FaClock /> Offer Approvals
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: OFFER CREATION FLOW (WITH INTEGRATED TEMPLATES MANAGER) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "CREATION" && (
        <>
          {showTemplatesView ? (
            /* TEMPLATES SUB-VIEW INSIDE OFFER CREATION */
            editingTemplate !== null ? (
              /* Full View Reusable Template Editor */
              <OfferTemplateEditor
                template={typeof editingTemplate === "object" ? editingTemplate : null}
                onSave={handleSaveTemplateEditor}
                onCancel={() => setEditingTemplate(null)}
              />
            ) : (
              /* Templates Library View with Standardized Back Button */
              <div className="bg-[#111827]/90 border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl animate-fadeIn">
                {/* Header Bar with Standardized Back Button */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTemplatesView(false);
                        setEditingTemplate(null);
                      }}
                      className="p-2 rounded-xl bg-white/10 text-[#05DC7F] hover:bg-white/20 transition flex items-center justify-center shrink-0"
                      title="Back to Offer Creation"
                    >
                      <FaArrowLeft size={16} />
                    </button>
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <FaFileAlt className="text-[#05DC7F]" /> Offer Templates Library ({templates.length})
                      </h3>
                      <p className="text-xs text-white/50 mt-0.5">Create and edit reusable offer letter baselines with placeholders.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Department Filter Chips */}
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedDeptFilter("ALL")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                          selectedDeptFilter === "ALL"
                            ? "bg-[#05DC7F] text-black border-[#05DC7F]"
                            : "bg-white/5 text-white/60 border-white/10 hover:text-white"
                        }`}
                      >
                        ALL
                      </button>
                      {Array.from(new Set(templates.map((t) => (t.department || "GLOBAL").toUpperCase()))).map((dept) => (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => setSelectedDeptFilter(dept)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                            selectedDeptFilter === dept
                              ? "bg-[#05DC7F] text-black border-[#05DC7F]"
                              : "bg-white/5 text-white/60 border-white/10 hover:text-white"
                          }`}
                        >
                          {dept}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setEditingTemplate("NEW")}
                      className="px-4 py-2 bg-[#05DC7F] text-black font-bold rounded-xl text-xs hover:bg-[#04b869] transition shadow-[0_0_15px_rgba(5,220,127,0.3)] flex items-center gap-2"
                    >
                      <FaPlus /> Create New Template
                    </button>
                  </div>
                </div>

                {templates.length === 0 ? (
                  <div className="p-12 text-center text-xs text-white/40">
                    No templates created yet. Click "Create New Template" above to add one.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates
                      .filter((t) => selectedDeptFilter === "ALL" || (t.department || "GLOBAL").toUpperCase() === selectedDeptFilter)
                      .map((t) => (
                        <div
                          key={t.id}
                          className="bg-[#1F2937]/80 border border-white/10 hover:border-[#05DC7F]/40 rounded-2xl p-5 space-y-3 transition duration-300 hover:shadow-[0_0_20px_rgba(5,220,127,0.15)] flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-white text-base truncate">{t.title}</h4>
                              <span className="text-[10px] bg-[#05DC7F]/20 text-[#05DC7F] px-2.5 py-0.5 rounded-full font-mono font-bold border border-[#05DC7F]/30 shrink-0">
                                {t.department}
                              </span>
                            </div>

                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-xs text-white/70 font-mono whitespace-pre-wrap line-clamp-6 leading-relaxed max-h-48 overflow-y-auto">
                              {t.content}
                            </div>
                          </div>

                          <button
                            onClick={() => setEditingTemplate(t)}
                            className="w-full py-2.5 bg-white/10 hover:bg-[#05DC7F] hover:text-black font-semibold rounded-xl text-xs text-white transition duration-300 flex items-center justify-center gap-2 border border-white/10"
                          >
                            <FaEdit /> Edit Template in Full View
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )
          ) : !selectedCandidateForCreation ? (
            /* CANDIDATES LIST VIEW UNDER OFFER CREATION */
            <div className="bg-[#111827]/90 border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl">
              {/* Integrated Header Bar with Job Filter & Settings Button */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                    <FaUserCheck className="text-[#05DC7F]" /> Candidates Ready for Offer
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">Candidates who completed technical interviews.</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50">Filter Job:</span>
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(Number(e.target.value))}
                    className="bg-[#1F2937] border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-[#05DC7F]"
                  >
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} ({j.department || "Dept"})
                      </option>
                    ))}
                  </select>

                  {/* Settings / Template Manager Icon Button */}
                  {canGenerateOffer && (
                    <button
                      type="button"
                      onClick={() => setShowTemplatesView(true)}
                      title="Manage Offer Templates"
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-[#05DC7F] transition border border-white/10 flex items-center justify-center"
                    >
                      <FaCog size={15} />
                    </button>
                  )}
                </div>
              </div>

              {isAppsLoading ? (
                <div className="p-8 text-center text-white/60">Loading candidates...</div>
              ) : interviewedCandidates.length === 0 ? (
                <div className="p-12 text-center text-white/40 space-y-2">
                  <FaUserCheck size={36} className="mx-auto text-white/20" />
                  <p className="text-sm">No completed interview candidates found for this position.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {interviewedCandidates.map((cand) => (
                    <InterviewCandidateCard
                      key={cand.id}
                      candidate={cand}
                      isDraggable={true}
                      onSelectCandidate={() => handleOpenCreationDetail(cand)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* CANDIDATE PROFILE VIEW */
            <CandidateProfile
              displayMode="fullPage"
              candidate={selectedCandidateForCreation}
              onClose={() => setSelectedCandidateForCreation(null)}
              actionButton={
                canGenerateOffer && (
                  <button
                    onClick={() => setShowRequestApprovalModal(true)}
                    className="px-6 py-2.5 rounded-xl bg-[#05DC7F] text-black font-bold hover:bg-[#04b869] transition shadow-[0_0_20px_rgba(5,220,127,0.4)] text-sm flex items-center gap-2"
                  >
                    <FaPaperPlane /> Request Approval
                  </button>
                )
              }
            />
          )}
        </>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: OFFER APPROVAL QUEUE FLOW                              */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "APPROVAL" && (
        <>
          {!selectedOfferForApproval ? (
            /* Merged Main Information Container */
            <div className="bg-[#111827]/90 border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl">
              {/* Integrated Header Bar */}
              <div className="pb-4 border-b border-white/10">
                <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                  <FaClock className="text-amber-400" /> Offers Awaiting Approval ({pendingApprovalOffers.length})
                </h3>
                <p className="text-xs text-white/50 mt-0.5">Drafted offer packages awaiting executive sign-off.</p>
              </div>

              {pendingApprovalOffers.length === 0 ? (
                <div className="p-12 text-center text-white/40 space-y-2">
                  <FaCheck className="mx-auto text-[#05DC7F]/40" size={32} />
                  <p className="text-sm">No offers currently pending executive approval.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingApprovalOffers.map((offer) => (
                    <div
                      key={offer.id}
                      onClick={() => setSelectedOfferForApproval(offer)}
                      className="bg-[#1F2937]/80 border border-amber-500/30 hover:border-amber-500 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-white text-base">{offer.job_title}</h4>
                          <p className="text-xs text-white/50">{offer.department || "Engineering"}</p>
                        </div>
                        <span className="font-mono text-[#05DC7F] font-bold text-sm">
                          ${Number(offer.base_salary).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-xs text-white/70 bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
                        <p><span className="text-white/40">Target Start:</span> {offer.start_date}</p>
                        <p><span className="text-white/40">Bonus/Equity:</span> {offer.bonus_equity || "None"}</p>
                      </div>

                      <button className="w-full py-2 bg-amber-500/20 text-amber-300 font-semibold rounded-xl text-xs hover:bg-amber-500/30 transition flex items-center justify-center gap-1.5 border border-amber-500/40">
                        <FaEye /> Inspect & Approve Offer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Nested Approval Detail Screen with Standardized Back Button & Header */
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#111827]/90 border border-amber-500/40 rounded-2xl p-6 space-y-6 shadow-2xl">
                {/* Hero Header Bar with Standardized Back Button */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedOfferForApproval(null)}
                      className="p-2 rounded-xl bg-white/10 text-[#05DC7F] hover:bg-white/20 transition flex items-center justify-center shrink-0"
                      title="Back to Approvals List"
                    >
                      <FaArrowLeft size={16} />
                    </button>
                    <div>
                      <span className="px-3 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold uppercase tracking-wider">
                        Pending Executive Approval
                      </span>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2.5 mt-1">
                        <FaClock className="text-amber-400" /> {selectedOfferForApproval.job_title} Offer Package
                      </h3>
                      <p className="text-white/60 text-xs mt-0.5">Offer ID #{selectedOfferForApproval.id} • Awaiting Sign-off</p>
                    </div>
                  </div>

                  {canApproveOffer && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowApproveConfirmModal(true)}
                        className="px-6 py-3 rounded-xl bg-[#05DC7F] text-black font-bold hover:bg-[#04b869] transition shadow-[0_0_20px_rgba(5,220,127,0.4)] text-sm flex items-center gap-2"
                      >
                        <FaCheck /> Approve & Send Offer
                      </button>
                    </div>
                  )}
                </div>

                {/* Offer Terms Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-1">
                    <p className="text-xs text-white/50">Base Salary</p>
                    <p className="text-xl font-bold text-[#05DC7F]">${Number(selectedOfferForApproval.base_salary).toLocaleString()}/yr</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-1">
                    <p className="text-xs text-white/50">Target Start Date</p>
                    <p className="text-xl font-bold text-white">{selectedOfferForApproval.start_date}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-1">
                    <p className="text-xs text-white/50">Bonus / Equity Terms</p>
                    <p className="text-base font-bold text-white">{selectedOfferForApproval.bonus_equity || "None"}</p>
                  </div>
                </div>

                {/* Offer Letter Text */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white">Offer Letter Body</h4>
                  <div className="bg-[#1F2937] p-4 rounded-xl border border-white/10 text-xs text-white/80 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {selectedOfferForApproval.offer_letter_text}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ──── MODAL 1: REQUEST APPROVAL MODAL (Shared Component) ──── */}
      <RequestOfferApprovalModal
        open={showRequestApprovalModal}
        candidate={selectedCandidateForCreation}
        onClose={() => setShowRequestApprovalModal(false)}
        onSuccess={() => {
          setShowRequestApprovalModal(false);
          setSelectedCandidateForCreation(null);
        }}
      />

      {/* ──── MODAL 2: IRREVERSIBLE APPROVE CONFIRMATION MODAL ──── */}
      {showApproveConfirmModal && selectedOfferForApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111827] border border-amber-500/50 rounded-2xl p-6 w-full max-w-lg text-white space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400 border-b border-white/10 pb-3">
              <FaExclamationTriangle size={24} />
              <h3 className="text-lg font-bold text-white">Confirm Executive Offer Approval</h3>
            </div>

            <p className="text-sm text-white/80 leading-relaxed">
              This action is <strong className="text-amber-400">irreversible</strong>. Approving this offer will immediately set the candidate stage to <strong className="text-[#05DC7F]">Offer Sent</strong> and dispatch the formal offer letter & e-signature link directly to the candidate.
            </p>

            <div>
              <label className="text-xs text-white/60 block mb-1">Approval Comments (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Approved by Executive Board"
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                className="w-full bg-[#1F2937] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setShowApproveConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApproveActionSubmit("APPROVE")}
                className="px-5 py-2 rounded-xl bg-[#05DC7F] text-black font-bold text-sm shadow-[0_0_15px_rgba(5,220,127,0.4)] flex items-center gap-2"
              >
                <FaCheck /> Confirm Approval & Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
