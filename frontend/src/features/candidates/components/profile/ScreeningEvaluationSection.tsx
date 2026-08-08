import React from "react";
import { Sparkles, FileText, Target, ShieldAlert } from "lucide-react";
import { ApplicationScreeningDetail, EvidenceSet } from "../../../../shared/types/candidate.types";

interface ScreeningEvaluationSectionProps {
  screening?: ApplicationScreeningDetail & {
    cv_pdf_path?: string;
    cv_text?: string;
  };
}

export const ScreeningEvaluationSection: React.FC<ScreeningEvaluationSectionProps> = ({ screening }) => {
  if (!screening) return null;

  const { match_score, skills_match, experience_match, education_match, keyword_coverage, confidence, data_quality_flag, cv_pdf_path } = screening;

  if (match_score === undefined && skills_match === undefined && !cv_pdf_path) {
    return null;
  }

  // Helper to parse evidence object if stringified JSON
  const parsedEvidence: EvidenceSet | null = typeof screening.evidence === "string"
    ? (() => { try { return JSON.parse(screening.evidence); } catch { return null; } })()
    : (screening.evidence || null);

  return (
    <div className="pb-6 border-b border-white/10 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[#05DC7F]">
          <Sparkles size={18} />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">AI Structured Resume Evaluation</h4>
        </div>
        {confidence !== undefined && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#05DC7F]/15 text-[#05DC7F] border border-[#05DC7F]/30">
            {confidence}% Confidence
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* Overall Match Score Header */}
        {match_score != null && !isNaN(Number(match_score)) && (
          <div className="flex justify-between items-center py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-[#05DC7F]" />
              <span className="text-white/90 text-xs font-bold">Calculated Match Score</span>
            </div>
            <span className="text-[#05DC7F] font-extrabold text-base font-mono">{Number(match_score).toFixed(1)}%</span>
          </div>
        )}

        {/* 4 Dimension Scores Breakdown Grid */}
        {skills_match !== undefined && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center">
              <span className="text-[10px] text-white/50 font-semibold uppercase">Skills</span>
              <span className="text-sm font-bold text-white font-mono mt-0.5">{skills_match}/100</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center">
              <span className="text-[10px] text-white/50 font-semibold uppercase">Experience</span>
              <span className="text-sm font-bold text-white font-mono mt-0.5">{experience_match}/100</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center">
              <span className="text-[10px] text-white/50 font-semibold uppercase">Education</span>
              <span className="text-sm font-bold text-white font-mono mt-0.5">{education_match}/100</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center">
              <span className="text-[10px] text-white/50 font-semibold uppercase">Keywords</span>
              <span className="text-sm font-bold text-white font-mono mt-0.5">{keyword_coverage}/100</span>
            </div>
          </div>
        )}

        {/* Data Quality Flag Alert */}
        {data_quality_flag && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
            <ShieldAlert size={16} className="shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold">Data Quality Flag</p>
              <p className="text-amber-200/80 text-[11px] leading-relaxed mt-0.5">{data_quality_flag}</p>
            </div>
          </div>
        )}

        {/* Quoted Resume Evidence Highlights */}
        {parsedEvidence && (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-semibold text-white/70">Key Evidence & Matched Requirements</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {[
                ...parsedEvidence.skills_match.matched,
                ...parsedEvidence.experience_match.matched
              ].map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs">
                  <span className="text-[#05DC7F] font-bold block mb-0.5">{item.requirement}</span>
                  <span className="text-white/70 italic text-[11px]">"{item.resume_evidence}"</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CV Document Link */}
        {cv_pdf_path && (
          <div className="pt-1">
            <a
              href={cv_pdf_path}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#05DC7F] text-xs font-semibold transition border border-white/10"
            >
              <FileText size={14} /> View Candidate CV Document
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScreeningEvaluationSection;
