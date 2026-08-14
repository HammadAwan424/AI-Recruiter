import React from "react";
import { FileCheck, DollarSign, Calendar, ShieldCheck, PenTool } from "lucide-react";
import { OfferResponse } from "../../../../shared/types/offer.types";

interface OfferLetterSectionProps {
  offer?: OfferResponse | null;
}

export const OfferLetterSection: React.FC<OfferLetterSectionProps> = ({ offer }) => {
  if (!offer) return null;

  const isSigned = Boolean(offer.signed_at);

  return (
    <div className="pb-6 border-b border-white/10 space-y-4">
      <div className="flex items-center gap-2 text-[#05DC7F]">
        <FileCheck size={18} />
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Offer Letter & Compensation Package</h4>
      </div>

      <div className="space-y-3">
        {/* Salary & Dates Header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-[#05DC7F]" />
            <div>
              <p className="text-white/40 text-[10px]">Base Annual Salary</p>
              <p className="text-[#05DC7F] font-extrabold text-sm font-mono">${offer.base_salary?.toLocaleString()}</p>
            </div>
          </div>

          {offer.bonus_equity && (
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-400" />
              <div>
                <p className="text-white/40 text-[10px]">Bonus / Equity</p>
                <p className="text-white font-bold">{offer.bonus_equity}</p>
              </div>
            </div>
          )}

          {offer.start_date && (
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-[#05DC7F]" />
              <div>
                <p className="text-white/40 text-[10px]">Proposed Start Date</p>
                <p className="text-white font-bold">{offer.start_date}</p>
              </div>
            </div>
          )}
        </div>

        {/* Offer Letter Content */}
        {offer.offer_letter_text && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-white/70">Offer Letter Body</p>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs font-mono text-white/80 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
              {offer.offer_letter_text}
            </div>
          </div>
        )}

        {/* Signature Status */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <PenTool size={15} className={isSigned ? "text-[#05DC7F]" : "text-amber-400"} />
            <span className="text-white/70 font-medium">Signature Status:</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isSigned
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}
            >
              {isSigned ? `Signed by ${offer.signer_name || "Candidate"}` : "Pending Signature"}
            </span>
          </div>

          {offer.audit_hash && (
            <div className="flex items-center gap-1.5 text-white/40 text-[10px]">
              <ShieldCheck size={13} className="text-[#05DC7F]" />
              <span className="font-mono truncate max-w-[160px]" title={offer.audit_hash}>Hash: {offer.audit_hash}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferLetterSection;
