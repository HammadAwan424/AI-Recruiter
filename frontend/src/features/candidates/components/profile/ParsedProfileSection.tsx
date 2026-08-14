import React from "react";
import { UserCheck, Briefcase, GraduationCap, Award, Cpu, AlertTriangle, Calendar, Building2 } from "lucide-react";
import { ParsedResumeProfile, ParsingLLMOutput } from "../../../../shared/types/candidate.types";

interface ParsedProfileSectionProps {
  parsedProfile?: string | ParsedResumeProfile | ParsingLLMOutput | any;
}

export const ParsedProfileSection: React.FC<ParsedProfileSectionProps> = ({ parsedProfile }) => {
  if (!parsedProfile) return null;

  let rawObj: any = null;
  if (typeof parsedProfile === "string") {
    try {
      rawObj = JSON.parse(parsedProfile);
    } catch (e) {
      return null;
    }
  } else {
    rawObj = parsedProfile;
  }

  if (!rawObj) return null;

  const profile: ParsingLLMOutput = rawObj.profile || rawObj;

  const {
    skills = [],
    work_history = [],
    education = [],
    certifications = [],
    needs_review = false,
    review_reason = "",
  } = profile || {};

  if (
    skills.length === 0 &&
    work_history.length === 0 &&
    education.length === 0 &&
    certifications.length === 0 &&
    !needs_review
  ) {
    return null;
  }

  return (
    <div className="pb-6 border-b border-white/10 space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 bg-cyan-950/20 p-3 rounded-2xl border border-cyan-500/20 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-cyan-400">
          <div className="p-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30">
            <UserCheck size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">AI Structured Resume Profile</h4>
            <p className="text-[10px] text-cyan-300/70">Extracted technical skills, career timeline & credentials</p>
          </div>
        </div>
        {needs_review && (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            <AlertTriangle size={12} className="text-amber-400" /> Needs Review
          </span>
        )}
      </div>

      {/* Review Reason Alert */}
      {needs_review && review_reason && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5 shadow-md">
          <AlertTriangle size={18} className="shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="font-bold text-white text-xs">Parsing Review Rationale</p>
            <p className="text-amber-200/80 text-[11px] leading-relaxed mt-0.5">{review_reason}</p>
          </div>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-white/80 flex items-center gap-1.5 tracking-wide">
            <Cpu size={14} className="text-cyan-400" /> Technical Skills & Tools
          </p>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill: string, idx: number) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-xl text-xs font-medium bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-300 border border-cyan-500/25 hover:border-cyan-400 hover:scale-[1.02] transition-all duration-200 cursor-default shadow-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Work History */}
      {work_history.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-bold text-white/80 flex items-center gap-1.5 tracking-wide">
            <Briefcase size={14} className="text-amber-400" /> Work Experience
          </p>
          <div className="space-y-2.5">
            {work_history.map((job: any, idx: number) => {
              const title = job.title || job.job_title || "Position";
              const company = job.company || job.company_name || "Company";
              const duration =
                job.duration ||
                (job.start_date || job.end_date
                  ? `${job.start_date || "Start"} – ${job.end_date || "Present"}`
                  : null);

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 border-l-2 border-l-amber-400 hover:border-white/20 transition-all duration-200 text-xs space-y-1.5 shadow-md"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-white text-xs leading-tight">{title}</span>
                    {duration && (
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/50 text-[10px] font-mono shrink-0 flex items-center gap-1">
                        <Calendar size={10} className="text-gray-400" /> {duration}
                      </span>
                    )}
                  </div>
                  <p className="text-amber-300/90 font-semibold text-[11px] flex items-center gap-1">
                    <Building2 size={12} className="text-amber-400/80 shrink-0" /> {company}
                  </p>
                  {job.key_responsibilities && job.key_responsibilities.length > 0 && (
                    <ul className="list-disc list-inside text-white/70 text-[11px] space-y-0.5 pt-1 border-t border-white/5 mt-1.5">
                      {job.key_responsibilities.map((resp: string, rIdx: number) => (
                        <li key={rIdx}>{resp}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Education & Certifications */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        {education.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-white/80 flex items-center gap-1.5 tracking-wide">
              <GraduationCap size={14} className="text-emerald-400" /> Education
            </p>
            <div className="space-y-2">
              {education.map((edu: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 border-l-2 border-l-emerald-400 hover:border-white/20 transition-all duration-200 text-xs space-y-1 shadow-md"
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-bold text-white text-xs leading-tight">{edu.degree || "Degree"}</p>
                    {edu.year && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-mono shrink-0">
                        {edu.year}
                      </span>
                    )}
                  </div>
                  <p className="text-emerald-300/80 font-medium text-[11px]">{edu.institution || "Institution"}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {certifications.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-white/80 flex items-center gap-1.5 tracking-wide">
              <Award size={14} className="text-purple-400" /> Professional Certifications
            </p>
            <div className="flex flex-wrap gap-1.5">
              {certifications.map((cert: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl text-xs font-medium bg-gradient-to-r from-purple-500/15 to-indigo-500/10 text-purple-300 border border-purple-500/25 hover:border-purple-400 hover:scale-[1.02] transition-all duration-200 cursor-default shadow-sm"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParsedProfileSection;
