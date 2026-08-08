import React, { useState, useEffect } from "react";
import { FaFileContract, FaTimes, FaPaperPlane, FaCheck } from "react-icons/fa";
import { useGetOfferTemplatesQuery, useCreateOfferMutation } from "../../features/offers/api";
import { useGetJobsQuery } from "../../features/jobs/api";
import { OfferCreatePayload } from "../types/offer.types";
import { renderOfferTemplate } from "../utils/offerTemplateUtils";

interface RequestOfferApprovalModalProps {
  open: boolean;
  candidate: any | null;
  onClose: () => void;
  onSuccess?: (offer: any) => void;
}

export const RequestOfferApprovalModal: React.FC<RequestOfferApprovalModalProps> = ({
  open,
  candidate,
  onClose,
  onSuccess,
}) => {
  const { data: templatesData } = useGetOfferTemplatesQuery();
  const templates = Array.isArray(templatesData) ? templatesData : [];

  const { data: jobsData } = useGetJobsQuery();
  const jobs = jobsData?.jobs || [];

  const [createOfferApi, { isLoading: isSubmitting }] = useCreateOfferMutation();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>("ALL");

  const [formData, setFormData] = useState<OfferCreatePayload>({
    candidate_id: 0,
    application_id: 0,
    job_id: 0,
    job_title: "",
    department: "",
    base_salary: 110000,
    bonus_equity: "$10,000 Signing Bonus",
    start_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    expiry_date: new Date(Date.now() + 21 * 86400000).toISOString().split("T")[0],
    offer_letter_text: "",
  });

  useEffect(() => {
    if (candidate) {
      const selectedJob = jobs.find((j) => j.id === candidate.job_id) || jobs[0];
      setFormData({
        candidate_id: candidate.candidate_id || candidate.id,
        application_id: candidate.id || candidate.application_id,
        job_id: candidate.job_id || selectedJob?.id || 1,
        job_title: selectedJob ? selectedJob.title : "Position",
        department: selectedJob ? selectedJob.department || "Engineering" : "Engineering",
        base_salary: 110000,
        bonus_equity: "$10,000 Signing Bonus",
        start_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
        expiry_date: new Date(Date.now() + 21 * 86400000).toISOString().split("T")[0],
        offer_letter_text: "",
      });
    }
  }, [candidate, jobs]);

  if (!open || !candidate) return null;

  // Derive unique department options from existing templates
  const availableDepartments = Array.from(
    new Set(templates.map((t) => (t.department || "GLOBAL").toUpperCase()))
  );

  const filteredTemplates = templates.filter((t) => {
    if (selectedDepartmentFilter === "ALL") return true;
    return (t.department || "GLOBAL").toUpperCase() === selectedDepartmentFilter;
  });

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = templates.find((t) => String(t.id) === String(templateId));
    let content = tmpl ? tmpl.content : "";

    if (content) {
      content = renderOfferTemplate(content, {
        ...formData,
        candidate_name: candidate?.candidate_name || candidate?.full_name,
      });
    } else if (!formData.offer_letter_text) {
      content = `Dear Candidate,\n\nWe are thrilled to offer you the position of ${formData.job_title || "[Job Title]"} at AI Recruiter.\n\nYour annual starting salary will be $${formData.base_salary ? Number(formData.base_salary).toLocaleString() : "[Salary]"} per year, starting on ${formData.start_date || "[Date]"}.\n\nPlease review and sign this offer letter before the expiration date.\n\nSincerely,\nAI Recruiter Team`;
    }

    setFormData((prev) => ({
      ...prev,
      offer_letter_text: content,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.base_salary || !formData.start_date) {
      alert("Please enter base salary and target start date.");
      return;
    }

    try {
      const res = await createOfferApi({
        ...formData,
        submit_for_approval: true,
      }).unwrap();

      alert("Offer approval request submitted successfully!");
      if (onSuccess) onSuccess(res);
      onClose();
    } catch (err: any) {
      alert(`Error: ${err?.data?.detail || "Failed to submit offer request"}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#111827] border border-[#05DC7F]/40 rounded-2xl p-6 w-full max-w-2xl my-8 text-white space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div>
            <h3 className="text-xl font-bold text-[#05DC7F] flex items-center gap-2">
              <FaFileContract /> Request Offer Approval
            </h3>
            <p className="text-xs text-white/50">
              Candidate #{candidate.candidate_id || candidate.id} — {formData.job_title}
            </p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/60 block mb-1">Base Salary (USD/yr) *</label>
            <input
              type="number"
              value={formData.base_salary || ""}
              onChange={(e) => setFormData({ ...formData, base_salary: Number(e.target.value) })}
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
        </div>

        <div>
          <label className="text-xs text-white/60 block mb-1">Bonus / Equity Terms</label>
          <input
            type="text"
            placeholder="e.g. $10,000 Signing Bonus + 0.1% Equity"
            value={formData.bonus_equity}
            onChange={(e) => setFormData({ ...formData, bonus_equity: e.target.value })}
            className="w-full bg-[#1F2937] border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-[#05DC7F] outline-none"
          />
        </div>

        {/* Visual Offer Template Picker Cards with Department Filter Chips */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <label className="text-xs font-semibold text-white/70">Offer Template Baseline</label>

            {/* Department Filter Chips */}
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setSelectedDepartmentFilter("ALL")}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition border ${
                  selectedDepartmentFilter === "ALL"
                    ? "bg-[#05DC7F] text-black border-[#05DC7F]"
                    : "bg-white/5 text-white/60 border-white/10 hover:text-white"
                }`}
              >
                ALL ({templates.length})
              </button>
              {availableDepartments.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setSelectedDepartmentFilter(dept)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition border ${
                    selectedDepartmentFilter === dept
                      ? "bg-[#05DC7F] text-black border-[#05DC7F]"
                      : "bg-white/5 text-white/60 border-white/10 hover:text-white"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="p-3 text-center text-xs text-white/40 bg-white/5 rounded-xl border border-white/5">
              No templates found for department '{selectedDepartmentFilter}'.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {filteredTemplates.map((t) => {
                const isSelected = String(selectedTemplateId) === String(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTemplateChange(String(t.id))}
                    className={`p-2.5 rounded-xl text-left transition border flex flex-col justify-between ${
                      isSelected
                        ? "bg-[#05DC7F]/10 border-[#05DC7F] text-white shadow-[0_0_10px_rgba(5,220,127,0.2)]"
                        : "bg-white/5 border-white/10 hover:border-white/30 text-white/80"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-bold truncate flex items-center gap-1.5">
                        {isSelected && <FaCheck className="text-[#05DC7F]" size={10} />}
                        {t.title}
                      </span>
                      <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-white/60 font-mono">
                        {t.department || "GLOBAL"}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/50 line-clamp-1 mt-1 font-mono">{t.content}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs text-white/60 block mb-1">Offer Letter Body</label>
          <textarea
            rows={5}
            value={formData.offer_letter_text}
            onChange={(e) => setFormData({ ...formData, offer_letter_text: e.target.value })}
            className="w-full bg-[#1F2937] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#05DC7F] outline-none font-mono"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm"
          >
            Cancel
          </button>
          <button
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="px-6 py-2 rounded-xl bg-[#05DC7F] text-black font-bold text-sm shadow-[0_0_10px_rgba(5,220,127,0.4)] flex items-center gap-2 hover:bg-[#04b869] transition"
          >
            <FaPaperPlane /> {isSubmitting ? "Submitting..." : "Submit Offer for Approval"}
          </button>
        </div>
      </div>
    </div>
  );
};
