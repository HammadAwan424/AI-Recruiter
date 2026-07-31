import React from "react";
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Chip,
  IconButton,
  Divider,
  LinearProgress,
  Box,
} from "@mui/material";
import { X, Calendar, Clock, Users } from "lucide-react";
import { ProfileModalSurface } from "../../styles";
import { CandidateApplication } from "../../../../shared/types/candidate.types";
import { usePermission } from "../../../../shared/hooks/usePermission";
import { CANDIDATE_PERMISSIONS } from "../../permissions";

interface CandidateProfileProps {
  open: boolean;
  candidate: CandidateApplication | null;
  onClose: () => void;
  onHire?: (candidate: CandidateApplication) => void;
  onReject?: (candidate: CandidateApplication) => void;
}

export const CandidateProfile: React.FC<CandidateProfileProps> = ({
  open,
  candidate,
  onClose,
  onHire,
  onReject,
}) => {
  const { hasPermission } = usePermission();
  const canViewCompensation = hasPermission(CANDIDATE_PERMISSIONS.VIEW_COMPENSATION);
  const canDisposition = hasPermission(CANDIDATE_PERMISSIONS.DISPOSITION_CANDIDATE);

  if (!candidate) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr || dateStr === "—") return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getCategoryColor = (category: string): "success" | "info" | "warning" | "error" | "default" => {
    switch (category) {
      case "Strong Hire":
        return "success";
      case "Hire":
        return "info";
      case "Consider":
        return "warning";
      case "Reject":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <ProfileModalSurface open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 700 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Stack spacing={0.5}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {candidate.full_name}
              </Typography>
              <Chip
                label={candidate.ranking_category}
                size="small"
                color={getCategoryColor(candidate.ranking_category)}
                sx={{ fontWeight: 700 }}
              />
              {candidate.hired && <Chip label="✓ Hired" size="small" color="success" variant="outlined" />}
              {candidate.rejected && <Chip label="✗ Rejected" size="small" color="error" variant="outlined" />}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {candidate.email} {candidate.phone ? `| ${candidate.phone}` : ""}
            </Typography>
          </Stack>
          <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
            <X size={20} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3} sx={{ py: 1 }}>
          <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: "rgba(0, 0, 0, 0.3)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 700, textTransform: "uppercase" }}>
              AI Evaluation & Overall Match Score
            </Typography>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {[
                { label: "Resume Match Score", value: candidate.resume_score || 0 },
                { label: "Technical Competency", value: candidate.technical_score || 0 },
                { label: "Communication & Soft Skills", value: candidate.communication_score || 0 },
              ].map((item) => (
                <Stack key={item.label} spacing={0.5}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.value.toFixed(1)}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={item.value}
                    color="primary"
                    sx={{ height: 6, borderRadius: 3, bgcolor: "rgba(255,255,255,0.1)" }}
                  />
                </Stack>
              ))}

              <Divider sx={{ my: 1 }} />

              <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Weighted Final Score
                </Typography>
                <Typography variant="h5" color="primary.main" sx={{ fontWeight: 800 }}>
                  {candidate.final_score?.toFixed(1)}%
                </Typography>
              </Stack>
            </Stack>
          </Box>

          {candidate.interview_date && (
            <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: "rgba(0, 0, 0, 0.3)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                Interview Feedback & Scorecard
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Calendar size={16} style={{ color: "#05DC7F" }} />
                  <Typography variant="body2" color="text.secondary">Date:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(candidate.interview_date)}</Typography>
                </Stack>
                {candidate.interview_time && (
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Clock size={16} style={{ color: "#05DC7F" }} />
                    <Typography variant="body2" color="text.secondary">Time:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{candidate.interview_time}</Typography>
                  </Stack>
                )}
                {candidate.interviewer_1 && (
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Users size={16} style={{ color: "#05DC7F" }} />
                    <Typography variant="body2" color="text.secondary">Interviewers:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {candidate.interviewer_1} {candidate.interviewer_2 ? `, ${candidate.interviewer_2}` : ""}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Box>
          )}

          {canViewCompensation && candidate.hired && (
            <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: "rgba(5, 220, 127, 0.08)", border: "1px solid rgba(5, 220, 127, 0.3)" }}>
              <Typography variant="subtitle2" color="primary.main" gutterBottom sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                Offer Details (Gated Access)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Candidate has been approved for hire. Offer letter generated and dispatched to {candidate.email}.
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Close
        </Button>
        {canDisposition && !candidate.hired && !candidate.rejected && (
          <>
            {onReject && (
              <Button variant="outlined" color="error" onClick={() => onReject(candidate)}>
                Reject Candidate
              </Button>
            )}
            {onHire && (
              <Button variant="contained" color="primary" onClick={() => onHire(candidate)}>
                Approve & Hire
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </ProfileModalSurface>
  );
};
