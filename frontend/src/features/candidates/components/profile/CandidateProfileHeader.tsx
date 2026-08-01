import React from "react";
import { Stack, Typography, Chip, Button, Box } from "@mui/material";
import { Trophy, CheckCircle, XCircle } from "lucide-react";
import { ApplicationDetail } from "../../../../shared/types/candidate.types";

interface CandidateProfileHeaderProps {
  detail: ApplicationDetail;
  canDisposition: boolean;
  onHire?: (detail: ApplicationDetail) => void;
  onReject?: (detail: ApplicationDetail) => void;
}

export const CandidateProfileHeader: React.FC<CandidateProfileHeaderProps> = ({
  detail,
  canDisposition,
  onHire,
  onReject,
}) => {
  const isHired = detail.current_status === "hired";
  const isRejected = detail.disposition === "rejected";

  return (
    <Box className="p-5 rounded-2xl bg-black/40 border border-gray-800/80 shadow-lg mb-6">
      <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        {/* Left: Info & Badges */}
        <Stack spacing={1.5} sx={{ flex: 1 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Box className="w-10 h-10 rounded-full bg-black/60 border border-gray-700/80 flex items-center justify-center">
              <Trophy size={20} className="text-yellow-400" />
            </Box>
            <div>
              <Typography variant="h5" color="text.primary" sx={{ fontWeight: 800 }}>
                Application #{detail.id}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Candidate ID: {detail.candidate_id} | Requisition ID: {detail.job_id}
              </Typography>
            </div>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ pt: 0.5, flexWrap: "wrap", gap: 1 }}>
            <Chip
              label={`Status: ${detail.current_status.toUpperCase()}`}
              size="small"
              className="bg-[#05DC7F]/15 border border-[#05DC7F]/40 text-[#05DC7F] font-bold uppercase text-[10px]"
            />
            {isHired && (
              <Chip
                icon={<CheckCircle size={12} className="text-emerald-400" />}
                label="Hired"
                size="small"
                color="success"
                variant="outlined"
              />
            )}
            {isRejected && (
              <Chip
                icon={<XCircle size={12} className="text-red-400" />}
                label="Rejected"
                size="small"
                color="error"
                variant="outlined"
              />
            )}
          </Stack>
        </Stack>

        {/* Right: Score & Disposition Actions */}
        <Stack spacing={2} sx={{ alignItems: { xs: "flex-start", sm: "flex-end" } }}>
          {detail.final_score !== undefined && (
            <Stack spacing={0} sx={{ alignItems: { xs: "flex-start", sm: "flex-end" } }}>
              <Typography variant="caption" color="text.secondary">
                Overall Final Score
              </Typography>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 800 }}>
                {detail.final_score.toFixed(1)}%
              </Typography>
            </Stack>
          )}

          {canDisposition && !isHired && !isRejected && (
            <Stack direction="row" spacing={1.5}>
              {onReject && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => onReject(detail)}
                  sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                  Reject Candidate
                </Button>
              )}
              {onHire && (
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={() => onHire(detail)}
                  sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                  Approve & Hire
                </Button>
              )}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};
