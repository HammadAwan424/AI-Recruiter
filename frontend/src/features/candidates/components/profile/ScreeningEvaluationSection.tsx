import React from "react";
import { Tooltip } from "@mui/material";
import { Sparkles, FileText, Target, ShieldAlert, HelpCircle, CheckCircle2 } from "lucide-react";
import { ApplicationScreeningDetail, EvidenceSet } from "../../../../shared/types/candidate.types";
import { FitFlagBadgeList } from "../../../../shared/components/FitFlagBadge";

interface ScreeningEvaluationSectionProps {
  screening?: ApplicationScreeningDetail & {
    cv_pdf_path?: string;
    cv_text?: string;
    weights_used?: string | any;
  };
}

export const ScreeningEvaluationSection: React.FC<ScreeningEvaluationSectionProps> = ({ screening }) => {
  if (!screening) return null;

  const { match_score, skills_match, experience_match, education_match, keyword_coverage, confidence, data_quality_flag, cv_pdf_path } = screening;

  if (match_score === undefined && skills_match === undefined && !cv_pdf_path) {
    return null;
  }

  // Parse evidence object if stringified JSON
  const parsedEvidence: EvidenceSet | null = typeof screening.evidence === "string"
    ? (() => { try { return JSON.parse(screening.evidence); } catch { return null; } })()
    : (screening.evidence || null);

  // Parse dimension weights used for calculation
  const rawWeights = typeof screening.weights_used === "string"
    ? (() => { try { return JSON.parse(screening.weights_used); } catch { return null; } })()
    : (screening.weights_used || null);

  const skillsPct = rawWeights ? Math.round((rawWeights.skills_match || 0.35) * 100) : 35;
  const expPct = rawWeights ? Math.round((rawWeights.experience_match || 0.35) * 100) : 35;
  const eduPct = rawWeights ? Math.round((rawWeights.education_match || 0.15) * 100) : 15;
  const kwPct = rawWeights ? Math.round((rawWeights.keyword_coverage || 0.15) * 100) : 15;

  // Extract all matched category items (Experience, Skills, Education, Keywords)
  const matchedCategories = [
    { label: "Experience Requirements Matched", color: "text-amber-400", items: parsedEvidence?.experience_match?.matched || [] },
    { label: "Skills Requirements Matched", color: "text-cyan-400", items: parsedEvidence?.skills_match?.matched || [] },
    { label: "Education Requirements Matched", color: "text-emerald-400", items: parsedEvidence?.education_match?.matched || [] },
    { label: "Keywords Matched", color: "text-purple-400", items: parsedEvidence?.keyword_coverage?.matched || [] },
  ].filter(cat => cat.items && cat.items.length > 0);

  const totalMatchedCount = matchedCategories.reduce((acc, cat) => acc + cat.items.length, 0);

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
        {/* AI Screening Score */}
        {match_score != null && !isNaN(Number(match_score)) && (
          <div className="flex justify-between items-center py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-[#05DC7F]" />
              <span className="text-white/90 text-xs font-bold">AI Score</span>
              
              {/* Question Mark Tooltip Explaining Weight Distribution */}
              <Tooltip
                title={
                  <div className="p-1 space-y-1.5 text-xs">
                    <p className="font-bold text-[#05DC7F]">Screening Weight Distribution</p>
                    <p className="text-white/80 text-[11px] leading-relaxed">
                      The AI score is a weighted rollup calculated from candidate dimensions:
                    </p>
                    <div className="space-y-1 pt-1 font-mono text-[11px]">
                      <div className="flex justify-between text-cyan-300">
                        <span>Skills Match:</span>
                        <span className="font-bold">{skillsPct}%</span>
                      </div>
                      <div className="flex justify-between text-amber-300">
                        <span>Experience Match:</span>
                        <span className="font-bold">{expPct}%</span>
                      </div>
                      <div className="flex justify-between text-emerald-300">
                        <span>Education Match:</span>
                        <span className="font-bold">{eduPct}%</span>
                      </div>
                      <div className="flex justify-between text-purple-300">
                        <span>Keyword Coverage:</span>
                        <span className="font-bold">{kwPct}%</span>
                      </div>
                    </div>
                  </div>
                }
                arrow
                placement="top"
                slotProps={{
                  tooltip: {
                    sx: {
                      bgcolor: "#1F2937",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
                      maxWidth: 280,
                    },
                  },
                  arrow: {
                    sx: { color: "#1F2937" },
                  },
                }}
              >
                <button type="button" className="text-[#05DC7F]/80 hover:text-[#05DC7F] transition p-0.5 inline-flex items-center cursor-help">
                  <HelpCircle size={15} />
                </button>
              </Tooltip>
            </div>
            <span className="text-[#05DC7F] font-extrabold text-base font-mono">{Number(match_score).toFixed(1)}%</span>
          </div>
        )}

        {/* 4 Dimension Scores Breakdown Grid */}
        {skills_match !== undefined && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center relative group">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-white/50 font-semibold uppercase">Skills</span>
                <Tooltip title={`Weight: ${skillsPct}% of total score`} arrow placement="top">
                  <span className="cursor-help"><HelpCircle size={10} className="text-cyan-400/80 hover:text-cyan-300" /></span>
                </Tooltip>
              </div>
              <span className="text-sm font-bold text-white font-mono mt-0.5">{skills_match}/100</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center relative group">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-white/50 font-semibold uppercase">Experience</span>
                <Tooltip title={`Weight: ${expPct}% of total score`} arrow placement="top">
                  <span className="cursor-help"><HelpCircle size={10} className="text-amber-400/80 hover:text-amber-300" /></span>
                </Tooltip>
              </div>
              <span className="text-sm font-bold text-white font-mono mt-0.5">{experience_match}/100</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center relative group">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-white/50 font-semibold uppercase">Education</span>
                <Tooltip title={`Weight: ${eduPct}% of total score`} arrow placement="top">
                  <span className="cursor-help"><HelpCircle size={10} className="text-emerald-400/80 hover:text-emerald-300" /></span>
                </Tooltip>
              </div>
              <span className="text-sm font-bold text-white font-mono mt-0.5">{education_match}/100</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center relative group">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-white/50 font-semibold uppercase">Keywords</span>
                <Tooltip title={`Weight: ${kwPct}% of total score`} arrow placement="top">
                  <span className="cursor-help"><HelpCircle size={10} className="text-purple-400/80 hover:text-purple-300" /></span>
                </Tooltip>
              </div>
              <span className="text-sm font-bold text-white font-mono mt-0.5">{keyword_coverage}/100</span>
            </div>
          </div>
        )}

        {/* Fit Flags Section */}
        {screening.fit_flags && (
          <div className="pt-1">
            <p className="text-xs font-semibold text-white/70 mb-2">Identified Fit Patterns & Risk Flags</p>
            <FitFlagBadgeList fitFlags={screening.fit_flags} size="md" />
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

        {/* All Matched Requirements & Quoted Resume Evidence */}
        {matchedCategories.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[#05DC7F]" /> Matched Requirements & Resume Evidence
              </p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#05DC7F]/15 text-[#05DC7F] border border-[#05DC7F]/30">
                {totalMatchedCount} matched items
              </span>
            </div>

            <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
              {matchedCategories.map((cat, cIdx) => (
                <div key={cIdx} className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-extrabold uppercase tracking-wider ${cat.color}`}>
                      {cat.label}
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">({cat.items.length})</span>
                  </div>
                  <div className="space-y-2">
                    {cat.items.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5 shadow-sm">
                        <div className="flex items-start gap-1.5 text-xs font-bold text-white">
                          <span className="text-[#05DC7F] shrink-0 mt-0.5">•</span>
                          <span>{item.requirement}</span>
                        </div>
                        {item.resume_evidence && (
                          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] text-white/80 italic font-mono leading-relaxed">
                            "{item.resume_evidence}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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
