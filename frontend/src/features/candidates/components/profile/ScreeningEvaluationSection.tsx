import React from "react";
import { Box, Typography, Stack, Button } from "@mui/material";
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
    <Box className="p-5 rounded-2xl bg-black/40 border border-gray-800/80 shadow-lg mb-6">
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3 }}>
        <Sparkles size={20} className="text-[#05DC7F]" />
        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>
          AI Screening & Evaluation
        </Typography>
      </Stack>

      <Stack spacing={3}>
        {/* Match Score */}
        {match_score !== undefined && (
          <div className="flex justify-between items-center p-3.5 rounded-xl bg-gray-900/60 border border-gray-800">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-[#05DC7F]" />
              <span className="text-gray-300 text-xs font-semibold">Resume Match Score</span>
            </div>
            <span className="text-[#05DC7F] font-extrabold text-lg">{match_score.toFixed(1)}%</span>
          </div>
        )}

        {/* Executive Summary */}
        {summary && (
          <div>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 1 }}>
              Executive Summary
            </Typography>
            <p className="text-gray-300 text-xs leading-relaxed bg-gray-900/40 p-3.5 rounded-xl border border-gray-800/60">
              {summary}
            </p>
          </div>
        )}

        {/* Skill Gap Analysis */}
        {skill_gap && (
          <div>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
              <AlertTriangle size={15} className="text-amber-400" />
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
                Skill Gap & Qualifications Check
              </Typography>
            </Stack>
            <p className="text-amber-300/90 text-xs leading-relaxed bg-amber-950/20 p-3.5 rounded-xl border border-amber-900/40">
              {skill_gap}
            </p>
          </div>
        )}

        {/* CV Attachment */}
        {cv_pdf_path && (
          <div className="pt-2 border-t border-gray-800/60">
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<FileText size={15} />}
              component="a"
              href={cv_pdf_path}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              View Candidate CV Document
            </Button>
          </div>
        )}
      </Stack>
    </Box>
  );
};
