import React from "react";
import { Box, Typography, Stack, Chip } from "@mui/material";
import { FileCheck, DollarSign, Calendar, ShieldCheck, PenTool } from "lucide-react";

interface OfferLetterSectionProps {
  offer?: {
    id: number;
    base_salary: number;
    bonus_equity?: string;
    start_date?: string;
    expiry_date?: string;
    offer_letter_text: string;
    signature_type?: string;
    signer_name?: string;
    signed_at?: string;
    decline_reason?: string;
    audit_hash?: string;
    approval?: {
      id: number;
      approver_name?: string;
      comments?: string;
      decided_at?: string;
    };
  };
}

export const OfferLetterSection: React.FC<OfferLetterSectionProps> = ({ offer }) => {
  if (!offer) return null;

  const isSigned = Boolean(offer.signed_at);

  return (
    <Box className="p-5 rounded-2xl bg-black/40 border border-gray-800/80 shadow-lg mb-6">
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3 }}>
        <FileCheck size={20} className="text-[#05DC7F]" />
        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>
          Offer Letter & Compensation Package
        </Typography>
      </Stack>

      <Stack spacing={3}>
        {/* Salary & Dates Header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 text-xs">
          <div className="flex items-center gap-2 text-gray-300">
            <DollarSign size={16} className="text-[#05DC7F]" />
            <div>
              <p className="text-gray-400 text-[10px]">Base Annual Salary</p>
              <p className="text-[#05DC7F] font-extrabold text-sm">${offer.base_salary?.toLocaleString()}</p>
            </div>
          </div>

          {offer.bonus_equity && (
            <div className="flex items-center gap-2 text-gray-300">
              <DollarSign size={16} className="text-emerald-400" />
              <div>
                <p className="text-gray-400 text-[10px]">Bonus / Equity</p>
                <p className="text-white font-bold">{offer.bonus_equity}</p>
              </div>
            </div>
          )}

          {offer.start_date && (
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar size={15} className="text-[#05DC7F]" />
              <div>
                <p className="text-gray-400 text-[10px]">Proposed Start Date</p>
                <p className="text-white font-bold">{offer.start_date}</p>
              </div>
            </div>
          )}
        </div>

        {/* Offer Letter Content */}
        {offer.offer_letter_text && (
          <div>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 1 }}>
              Offer Letter Text
            </Typography>
            <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800 text-xs font-mono text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {offer.offer_letter_text}
            </div>
          </div>
        )}

        {/* Signature Status */}
        <div className="p-3.5 rounded-xl bg-black/50 border border-gray-800 flex justify-between items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <PenTool size={15} className={isSigned ? "text-[#05DC7F]" : "text-amber-400"} />
            <span className="text-gray-300 font-medium">Signature Status:</span>
            {isSigned ? (
              <Chip label={`Signed by ${offer.signer_name || "Candidate"}`} size="small" color="success" />
            ) : (
              <Chip label="Pending Signature" size="small" color="warning" variant="outlined" />
            )}
          </div>

          {offer.audit_hash && (
            <div className="flex items-center gap-1.5 text-gray-500 text-[10px]">
              <ShieldCheck size={13} className="text-[#05DC7F]" />
              <span className="font-mono truncate max-w-[160px]" title={offer.audit_hash}>Hash: {offer.audit_hash}</span>
            </div>
          )}
        </div>
      </Stack>
    </Box>
  );
};
