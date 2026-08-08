import React from "react";
import {
  Drawer,
  IconButton,
  CircularProgress,
  Alert,
  Box,
  Typography,
} from "@mui/material";
import { X, ArrowLeft } from "lucide-react";
import { useGetApplicationDetailQuery } from "../../features/candidates/api";
import { CandidateProfileHeader } from "../../features/candidates/components/profile/CandidateProfileHeader";
import { ScreeningEvaluationSection } from "../../features/candidates/components/profile/ScreeningEvaluationSection";
import { InterviewRoundsSection } from "../../features/candidates/components/profile/InterviewRoundsSection";
import { OfferLetterSection } from "../../features/candidates/components/profile/OfferLetterSection";
import { ApplicationCommentsSection } from "../../features/candidates/components/profile/ApplicationCommentsSection";
import { usePermission } from "../hooks/usePermission";
import { CANDIDATE_PERMISSIONS } from "../../features/candidates/permissions";

export interface CandidateProfileProps {
  open?: boolean;
  candidate: any | null;
  displayMode?: "drawer" | "fullPage";
  onClose: () => void;
  onHire?: (candidate: any) => void;
  onReject?: (candidate: any) => void;
  actionButton?: React.ReactNode;
}

export const CandidateProfile: React.FC<CandidateProfileProps> = ({
  open = true,
  candidate,
  displayMode = "drawer",
  onClose,
  onHire,
  onReject,
  actionButton,
}) => {
  const jobId = candidate?.job_id;
  const applicationId = candidate?.id || candidate?.application_id;

  const { data: detail, isLoading, isError } = useGetApplicationDetailQuery(
    { jobId: Number(jobId), applicationId: Number(applicationId) },
    { skip: (!open && displayMode === "drawer") || !jobId || !applicationId }
  );

  const { hasPermission } = usePermission();
  const canDisposition = hasPermission(CANDIDATE_PERMISSIONS.DISPOSITION);

  if (!candidate) return null;

  const profileContent = (
    <Box className="space-y-6">
      {isLoading ? (
        <Box className="flex flex-col items-center justify-center py-20 bg-[#111827]/80 rounded-2xl border border-white/10">
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
        <div className="bg-[#111827]/90 rounded-2xl p-6 border border-white/10 space-y-6 shadow-xl">
          {/* Top Integrated Header Bar for Full Page Mode with Standardized Back Button */}
          {displayMode === "fullPage" && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/10 text-[#05DC7F] hover:bg-white/20 transition flex items-center justify-center shrink-0"
                  title="Back to Candidates List"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                    Candidate Application Profile
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">Detailed evaluation scorecard and interview history</p>
                </div>
              </div>

              {actionButton && <div>{actionButton}</div>}
            </div>
          )}

          {/* Header with Hire / Reject Actions */}
          <CandidateProfileHeader
            detail={detail}
            canDisposition={canDisposition}
            onHire={onHire}
            onReject={onReject}
          />

          {/* AI Screening & Evaluation Section */}
          <ScreeningEvaluationSection screening={detail.screening} />

          {/* Interview Rounds & Embedded Scheduling Section */}
          <InterviewRoundsSection
            applicationId={detail.id}
            jobId={detail.job_id}
            currentStatus={detail.current_status}
            interviews={detail.interviews}
          />

          {/* Offer Letter & Compensation Section */}
          <OfferLetterSection offer={detail.offer} />

          {/* Team Comments Section */}
          <ApplicationCommentsSection comments={detail.comments} />
        </div>
      )}
    </Box>
  );

  // Mode A: Drawer / Slide-over
  if (displayMode === "drawer") {
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
        <Box className="flex justify-between items-center px-6 py-4 border-b border-gray-800 bg-black/60 sticky top-0 z-10 backdrop-blur-md">
          <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>
            Candidate Profile & Requisition Detail
          </Typography>
          <IconButton onClick={onClose} size="small" className="text-gray-400 hover:text-white">
            <X size={20} />
          </IconButton>
        </Box>

        <Box className="p-6 overflow-y-auto flex-1">
          {profileContent}
        </Box>
      </Drawer>
    );
  }

  // Mode B: Full Page on Active Screen
  return profileContent;
};

export default CandidateProfile;
