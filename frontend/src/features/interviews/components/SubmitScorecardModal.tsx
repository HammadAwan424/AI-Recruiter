import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Stack,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Slider,
  TextField,
  IconButton,
  Chip,
} from "@mui/material";
import {
  Star,
  MessageSquare,
  Sparkles,
  X,
  Award,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  User,
} from "lucide-react";
import { useSubmitInterviewFeedbackMutation } from "../api";
import { formatApiError } from "../../../shared/utils/errorUtils";

interface SubmitScorecardModalProps {
  open: boolean;
  onClose: () => void;
  interviewId: number;
  candidateName?: string;
  jobTitle?: string;
  roundLabel?: string;
  initialTechScore?: number;
  initialCommScore?: number;
  initialNotes?: string;
  onSuccess?: () => void;
}

export const SubmitScorecardModal: React.FC<SubmitScorecardModalProps> = ({
  open,
  onClose,
  interviewId,
  candidateName = "Candidate",
  jobTitle,
  roundLabel = "Interview Round",
  initialTechScore = 8.0,
  initialCommScore = 8.0,
  initialNotes = "",
  onSuccess,
}) => {
  const [techScore, setTechScore] = useState<number>(initialTechScore);
  const [commScore, setCommScore] = useState<number>(initialCommScore);
  const [notes, setNotes] = useState<string>(initialNotes);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [submitFeedback, { isLoading }] = useSubmitInterviewFeedbackMutation();

  useEffect(() => {
    if (open) {
      setTechScore(initialTechScore ?? 8.0);
      setCommScore(initialCommScore ?? 8.0);
      setNotes(initialNotes ?? "");
      setErrorMsg(null);
    }
  }, [open, initialTechScore, initialCommScore, initialNotes]);

  // Weighted round rating calculation: 60% Technical, 40% Communication
  const compositeScore = Number((techScore * 0.6 + commScore * 0.4).toFixed(1));

  const getScoreVerdict = (score: number) => {
    if (score >= 8.5) {
      return { label: "Strong Hire", color: "#05DC7F", bg: "rgba(5, 220, 127, 0.15)", border: "rgba(5, 220, 127, 0.3)" };
    }
    if (score >= 7.0) {
      return { label: "Qualified / Hire", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)", border: "rgba(56, 189, 248, 0.3)" };
    }
    if (score >= 5.0) {
      return { label: "Borderline / Hold", color: "#fbbf24", bg: "rgba(251, 191, 36, 0.15)", border: "rgba(251, 191, 36, 0.3)" };
    }
    return { label: "Does Not Meet Bar", color: "#f87171", bg: "rgba(248, 113, 113, 0.15)", border: "rgba(248, 113, 113, 0.3)" };
  };

  const verdict = getScoreVerdict(compositeScore);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!interviewId) {
      setErrorMsg("Invalid interview ID.");
      return;
    }

    try {
      await submitFeedback({
        interviewId,
        technical_score: Number(techScore),
        communication_score: Number(commScore),
        notes: notes.trim() || undefined,
      }).unwrap();

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(formatApiError(err, "Failed to submit interview scorecard."));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: "#0d1117",
            backgroundImage: "none",
            borderRadius: 3,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
            overflow: "hidden",
          },
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Box
          sx={{
            p: 3,
            pb: 2.5,
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            background: "linear-gradient(180deg, rgba(5, 220, 127, 0.08) 0%, transparent 100%)",
            position: "relative",
          }}
        >
          <IconButton
            onClick={onClose}
            disabled={isLoading}
            size="small"
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "rgba(255, 255, 255, 0.5)",
              "&:hover": { color: "#ffffff", bgcolor: "rgba(255, 255, 255, 0.1)" },
            }}
          >
            <X size={18} />
          </IconButton>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2.5,
                bgcolor: "rgba(5, 220, 127, 0.15)",
                border: "1px solid rgba(5, 220, 127, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#05DC7F",
              }}
            >
              <Award size={22} />
            </Box>
            <div>
              <Typography variant="h6" sx={{ color: "#ffffff", fontWeight: 700, fontSize: "1.1rem" }}>
                Interview Scorecard
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.5)" }}>
                Score candidate competencies and provide structured hiring feedback
              </Typography>
            </div>
          </Stack>

          {/* Candidate & Context Pills */}
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Chip
              icon={<User size={13} className="text-[#05DC7F]" />}
              label={candidateName}
              size="small"
              sx={{
                bgcolor: "rgba(5, 220, 127, 0.1)",
                color: "#ffffff",
                border: "1px solid rgba(5, 220, 127, 0.25)",
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            />
            {jobTitle && (
              <Chip
                icon={<Briefcase size={13} className="text-sky-400" />}
                label={jobTitle}
                size="small"
                sx={{
                  bgcolor: "rgba(56, 189, 248, 0.1)",
                  color: "#e0f2fe",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                  fontSize: "0.75rem",
                }}
              />
            )}
            <Chip
              label={roundLabel}
              size="small"
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.06)",
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: "0.75rem",
              }}
            />
          </Box>
        </Box>

        {/* Body Form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, pt: 2.5 }}>
          {errorMsg && (
            <Alert
              severity="error"
              sx={{
                mb: 2.5,
                bgcolor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#fca5a5",
                borderRadius: 2,
              }}
            >
              {errorMsg}
            </Alert>
          )}

          <Stack spacing={3}>
            {/* Technical Score */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Star size={16} className="text-[#05DC7F]" />
                  <Typography variant="body2" sx={{ color: "#ffffff", fontWeight: 600 }}>
                    Technical Competency
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.25,
                    borderRadius: 1.5,
                    bgcolor: "rgba(5, 220, 127, 0.15)",
                    border: "1px solid rgba(5, 220, 127, 0.3)",
                    color: "#05DC7F",
                    fontWeight: 700,
                    fontFamily: "monospace",
                    fontSize: "0.85rem",
                  }}
                >
                  {techScore.toFixed(1)} / 10
                </Box>
              </Stack>
              <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.4)", display: "block", mb: 1.5 }}>
                Evaluates system design, code execution, architecture, and role-specific depth.
              </Typography>
              <Slider
                value={techScore}
                min={1}
                max={10}
                step={0.5}
                onChange={(_, val) => setTechScore(val as number)}
                valueLabelDisplay="auto"
                sx={{
                  color: "#05DC7F",
                  "& .MuiSlider-thumb": {
                    boxShadow: "0 0 10px rgba(5, 220, 127, 0.5)",
                  },
                }}
              />
            </Box>

            {/* Communication Score */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <MessageSquare size={16} className="text-sky-400" />
                  <Typography variant="body2" sx={{ color: "#ffffff", fontWeight: 600 }}>
                    Communication & Team Fit
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.25,
                    borderRadius: 1.5,
                    bgcolor: "rgba(56, 189, 248, 0.15)",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                    color: "#38bdf8",
                    fontWeight: 700,
                    fontFamily: "monospace",
                    fontSize: "0.85rem",
                  }}
                >
                  {commScore.toFixed(1)} / 10
                </Box>
              </Stack>
              <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.4)", display: "block", mb: 1.5 }}>
                Evaluates clarity, collaboration, attitude, problem articulation, and culture fit.
              </Typography>
              <Slider
                value={commScore}
                min={1}
                max={10}
                step={0.5}
                onChange={(_, val) => setCommScore(val as number)}
                valueLabelDisplay="auto"
                sx={{
                  color: "#38bdf8",
                  "& .MuiSlider-thumb": {
                    boxShadow: "0 0 10px rgba(56, 189, 248, 0.5)",
                  },
                }}
              />
            </Box>

            {/* Calculated Composite Verdict Summary */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: verdict.bg,
                border: `1px solid ${verdict.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Sparkles size={18} style={{ color: verdict.color }} />
                <div>
                  <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Weighted Composite Score
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#ffffff", fontWeight: 700 }}>
                    {verdict.label}
                  </Typography>
                </div>
              </Stack>
              <Typography
                variant="h6"
                sx={{
                  color: verdict.color,
                  fontWeight: 800,
                  fontFamily: "monospace",
                }}
              >
                {compositeScore} / 10
              </Typography>
            </Box>

            {/* Detailed Evaluation Notes */}
            <div>
              <Typography variant="body2" sx={{ color: "#ffffff", fontWeight: 600, mb: 1 }}>
                Interview Evaluation Notes & Feedback
              </Typography>
              <TextField
                multiline
                rows={4}
                fullWidth
                placeholder="Detail key strengths, growth areas, coding observations, system design performance, and hiring recommendation rationale..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "rgba(255, 255, 255, 0.03)",
                    borderRadius: 2,
                    color: "#ffffff",
                    fontSize: "0.875rem",
                    "& fieldset": { borderColor: "rgba(255, 255, 255, 0.12)" },
                    "&:hover fieldset": { borderColor: "#05DC7F" },
                    "&.Mui-focused fieldset": { borderColor: "#05DC7F" },
                  },
                }}
              />
            </div>

            {/* Modal Actions */}
            <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
              <Button
                onClick={onClose}
                disabled={isLoading}
                variant="outlined"
                sx={{
                  color: "rgba(255, 255, 255, 0.7)",
                  borderColor: "rgba(255, 255, 255, 0.15)",
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { borderColor: "#ffffff", bgcolor: "rgba(255, 255, 255, 0.05)" },
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <CheckCircle2 size={16} />}
                sx={{
                  bgcolor: "#05DC7F",
                  color: "#000000",
                  fontWeight: 700,
                  borderRadius: 2,
                  textTransform: "none",
                  px: 3,
                  boxShadow: "0 0 20px rgba(5, 220, 127, 0.3)",
                  "&:hover": { bgcolor: "#04c26f", boxShadow: "0 0 25px rgba(5, 220, 127, 0.5)" },
                }}
              >
                {isLoading ? "Submitting Scorecard..." : "Submit Scorecard"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
