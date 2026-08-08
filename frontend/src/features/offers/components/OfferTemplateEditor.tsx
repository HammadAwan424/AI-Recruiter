import React, { useState, useEffect } from "react";
import { FaSave, FaTimes, FaArrowLeft, FaFileAlt } from "react-icons/fa";
import { FIXED_OFFER_PLACEHOLDERS } from "../../../shared/utils/offerTemplateUtils";
import { OfferTemplate } from "../../../shared/types/offer.types";

interface OfferTemplateEditorProps {
  template?: OfferTemplate | null;
  onSave: (data: { title: string; department: string; content: string }) => Promise<void>;
  onCancel: () => void;
}

export const OfferTemplateEditor: React.FC<OfferTemplateEditorProps> = ({
  template,
  onSave,
  onCancel,
}) => {
  const isEditing = Boolean(template);

  const [title, setTitle] = useState(template?.title || "");
  const [department, setDepartment] = useState(template?.department || "GLOBAL");
  const [content, setContent] = useState(template?.content || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setDepartment(template.department || "GLOBAL");
      setContent(template.content);
    } else {
      setTitle("");
      setDepartment("GLOBAL");
      setContent("");
    }
  }, [template]);

  const handleInsertPlaceholder = (tag: string) => {
    setContent((prev) => prev + ` ${tag} `);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("Please provide a template title and body text.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({ title: title.trim(), department: department.trim() || "GLOBAL", content: content.trim() });
    } catch (err: any) {
      alert(err?.data?.detail || "Failed to save template.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#111827]/90 border border-white/10 rounded-2xl p-6 space-y-6 shadow-2xl animate-fadeIn">
      {/* Top Header Bar */}
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl bg-white/10 text-[#05DC7F] hover:bg-white/20 transition flex items-center justify-center shrink-0"
            title="Back to Template Library"
          >
            <FaArrowLeft size={16} />
          </button>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
              <FaFileAlt className="text-[#05DC7F]" />
              {isEditing ? `Edit Template: ${template?.title}` : "Create New Offer Template"}
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              Full-screen template editor with interactive placeholder chips.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-[#05DC7F] text-black font-bold text-xs shadow-[0_0_15px_rgba(5,220,127,0.4)] hover:bg-[#04b869] transition flex items-center gap-2"
          >
            <FaSave /> {isSaving ? "Saving..." : isEditing ? "Update Template" : "Save Offer Template"}
          </button>
        </div>
      </div>

      {/* Editor Form Body */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-white/70 block mb-1">Template Title *</label>
            <input
              type="text"
              placeholder="e.g. Standard Executive Offer Package"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#1F2937] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#05DC7F] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-white/70 block mb-1">Department</label>
            <input
              type="text"
              placeholder="e.g. ENGINEERING, SALES, GLOBAL"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-[#1F2937] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#05DC7F] outline-none"
            />
          </div>
        </div>

        {/* Interactive Placeholder Chips Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-white/70">Offer Letter Body *</label>
            <span className="text-[11px] text-white/40">Click any chip below to insert standard placeholder:</span>
          </div>

          <div className="flex flex-wrap gap-1.5 p-2 bg-white/5 rounded-xl border border-white/10 mb-3">
            {FIXED_OFFER_PLACEHOLDERS.map((p) => (
              <button
                key={p.tag}
                type="button"
                onClick={() => handleInsertPlaceholder(p.tag)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#05DC7F]/20 hover:text-[#05DC7F] text-white/80 text-xs transition border border-white/10 font-mono flex items-center gap-1"
              >
                <span className="text-[#05DC7F] font-bold">+</span> {p.label}
              </button>
            ))}
          </div>

          {/* Big Monospace Textarea */}
          <textarea
            rows={14}
            placeholder="Dear {{candidate_name}},\n\nOn behalf of {{company_name}}, I am delighted to extend to you a formal offer..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-[#1F2937] border border-white/10 rounded-2xl p-4 text-sm text-white font-mono leading-relaxed outline-none focus:border-[#05DC7F] shadow-inner"
          />
        </div>
      </form>
    </div>
  );
};
