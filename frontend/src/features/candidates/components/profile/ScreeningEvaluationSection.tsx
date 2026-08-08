import React from "react";
import { Sparkles, FileText, Target, AlertTriangle } from "lucide-react";

interface ScreeningEvaluationSectionProps {
  screening?: {
    match_score?: number;
    skill_gap?: string;
    summary?: string;
    cv_pdf_path?: string;
    cv_text?: string;
  };
}

export const ScreeningEvaluationSection: React.FC<ScreeningEvaluationSectionProps> = ({ screening }) => {
  if (!screening) return null;

  const { match_score, skill_gap, summary, cv_pdf_path } = screening;
  if (match_score === undefined && !skill_gap && !summary && !cv_pdf_path) {
    return null;
  }

  return (
    <div className="pb-6 border-b border-white/10 space-y-4">
      <div className="flex items-center gap-2 text-[#05DC7F]">
        <Sparkles size={18} />
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">AI Screening & Evaluation</h4>
      </div>

      <div className="space-y-3">
        {/* Match Score */}
        {match_score !== undefined && (
          <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2">
              <Target size={15} className="text-[#05DC7F]" />
              <span className="text-white/80 text-xs font-semibold">Resume Match Score</span>
            </div>
            <span className="text-[#05DC7F] font-extrabold text-base font-mono">{match_score.toFixed(1)}%</span>
          </div>
        )}

        {/* Executive Summary */}
        {summary && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-white/70">Executive Summary</p>
            <p className="text-white/80 text-xs leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
              {summary}
            </p>
          </div>
        )}

        {/* Skill Gap Analysis */}
        {skill_gap && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400">
              <AlertTriangle size={14} />
              <span className="text-xs font-semibold">Skill Gap & Qualifications Check</span>
            </div>
            <p className="text-amber-200/90 text-xs leading-relaxed bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              {skill_gap}
            </p>
          </div>
        )}

        {/* CV Attachment */}
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
