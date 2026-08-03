import React from "react";
import {
  Drawer,
  IconButton,
  CircularProgress,
  Alert,
  Box,
  Typography,
} from "@mui/material";
import { X } from "lucide-react";
import { useGetApplicationDetailQuery } from "../api";
import { CandidateProfileHeader } from "./profile/CandidateProfileHeader";
import { ScreeningEvaluationSection } from "./profile/ScreeningEvaluationSection";
import { InterviewRoundsSection } from "./profile/InterviewRoundsSection";
import { OfferLetterSection } from "./profile/OfferLetterSection";
import { ApplicationCommentsSection } from "./profile/ApplicationCommentsSection";
import { usePermission } from "../../../shared/hooks/usePermission";
import { CANDIDATE_PERMISSIONS } from "../permissions";

interface CandidateProfileProps {
  open: boolean;
  candidate: any | null;
  onClose: () => void;
  onHire?: (candidate: any) => void;
  onReject?: (candidate: any) => void;
}

export const CandidateProfile: React.FC<CandidateProfileProps> = ({
  open,
  candidate,
  onClose,
  onHire,
  onReject,
}) => {
  const jobId = candidate?.job_id;
  const applicationId = candidate?.id || candidate?.application_id;

  const { data: detail, isLoading, isError } = useGetApplicationDetailQuery(
    { jobId: Number(jobId), applicationId: Number(applicationId) },
    { skip: !open || !jobId || !applicationId }
  );

  const { hasPermission } = usePermission();
  const canDisposition = hasPermission(CANDIDATE_PERMISSIONS.DISPOSITION);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", sm: 540, md: 680 },
            bgcolor: "#0d0d0d",
            color: "text.primary",
            borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
            p: 0,
          },
        },
      }}
    >
      {/* Top Bar with Close Icon */}
      <Box className="flex justify-between items-center px-6 py-4 border-b border-gray-800 bg-black/60 sticky top-0 z-10 backdrop-blur-md">
        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>
          Candidate Profile & Requisition Detail
        </Typography>
        <IconButton onClick={onClose} size="small" className="text-gray-400 hover:text-white">
          <X size={20} />
        </IconButton>
      </Box>

      {/* Main Content Body */}
      <Box className="p-6 overflow-y-auto flex-1">
        {isLoading ? (
          <Box className="flex flex-col items-center justify-center py-20">
            <CircularProgress color="primary" />
            <Typography variant="caption" color="text.secondary" className="mt-3">
              Loading Application Detail...
            </Typography>
          </Box>
        ) : isError || !detail ? (
          <Alert severity="error">
            Could not fetch detailed application data for Requisition #{jobId} / Application #{applicationId}.
          </Alert>
        ) : (
          <>
            {/* Header with Hire / Reject Actions */}
            <CandidateProfileHeader
              detail={detail}
              canDisposition={canDisposition}
              onHire={onHire}
              onReject={onReject}
            />

            {/* AI Screening & Evaluation Section (rendered only if present) */}
            <ScreeningEvaluationSection screening={detail.screening} />

            {/* Interview Rounds & Embedded Scheduling Section */}
            <InterviewRoundsSection
              applicationId={detail.id}
              jobId={detail.job_id}
              currentStatus={detail.current_status}
              interviews={detail.interviews}
            />

            {/* Offer Letter & Compensation Section (rendered only if present) */}
            <OfferLetterSection offer={detail.offer} />

            {/* Team Comments Section (rendered only if present & non-empty) */}
            <ApplicationCommentsSection comments={detail.comments} />
          </>
        )}
      </Box>
    </Drawer>
  );
};
