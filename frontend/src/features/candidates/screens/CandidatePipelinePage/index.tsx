import React, { useState, useEffect } from "react";
import {
  Stack,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Trophy, Medal, Info, Calendar, Clock } from "lucide-react";
import { CandidateCardSurface } from "../../styles";
import { useCandidates } from "../../hooks/useCandidates";
import { useCandidateMutations } from "../../hooks/useCandidateMutations";
import { CandidateProfile } from "../../components/CandidateProfile";
import { CandidateApplication } from "../../../../shared/types/candidate.types";
import { useGetJobsQuery } from "../../../jobs/api";
import { usePermission } from "../../../../shared/hooks/usePermission";
import { CANDIDATE_PERMISSIONS } from "../../permissions";

export const CandidatePipelinePage: React.FC = () => {
  const { data: jobsData } = useGetJobsQuery();
  const jobs = jobsData?.jobs || [];

  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [filterDate, setFilterDate] = useState<string>("");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateApplication | null>(null);
  const [hiringAlertMsg, setHiringAlertMsg] = useState<string | null>(null);

  const { candidates, isLoading, isError } = useCandidates(selectedJobId);
  const { hireCandidate, rejectCandidate, isSubmitting } = useCandidateMutations();
  const { hasPermission } = usePermission();

  const canDisposition = hasPermission(CANDIDATE_PERMISSIONS.DISPOSITION_CANDIDATE);

  useEffect(() => {
    if (jobs.length > 0 && !selectedJobId) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  const handleHire = async (candidate: CandidateApplication) => {
    setHiringAlertMsg(null);
    try {
      const res = await hireCandidate(candidate.application_id);
      setHiringAlertMsg(`✅ Candidate ${candidate.full_name} hired successfully! ${res.email_sent ? "Offer letter sent!" : ""}`);
    } catch (err: any) {
      setHiringAlertMsg(`⚠️ Could not process hire action: ${err?.data?.detail || "Error"}`);
    }
  };

  const handleReject = async (candidate: CandidateApplication) => {
    if (!window.confirm(`Are you sure you want to reject ${candidate.full_name}?`)) return;
    setHiringAlertMsg(null);
    try {
      await rejectCandidate(candidate.application_id);
      setHiringAlertMsg(`Candidate ${candidate.full_name} has been rejected.`);
    } catch (err: any) {
      setHiringAlertMsg(`⚠️ Could not process reject action: ${err?.data?.detail || "Error"}`);
    }
  };

  const filteredCandidates = filterDate
    ? candidates.filter((c) => c.interview_date === filterDate)
    : candidates;

  const uniqueDates = Array.from(
    new Set(candidates.map((c) => c.interview_date).filter((d): d is string => Boolean(d) && d !== "—"))
  );

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={20} style={{ color: "#FACC15" }} />;
    if (rank === 2) return <Medal size={20} style={{ color: "#E2E8F0" }} />;
    if (rank === 3) return <Medal size={20} style={{ color: "#FB923C" }} />;
    return <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>#{rank}</Typography>;
  };

  return (
    <Stack spacing={3} sx={{ p: 3, maxWidth: 1200, margin: "0 auto", width: "100%" }}>
      {/* Header Section */}
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }} spacing={2}>
        <Typography variant="h4" color="text.primary" sx={{ fontWeight: 700 }}>
          Hiring — Ranked Candidate Pipeline
        </Typography>

        {jobs.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel id="job-select-label">Hiring For Requisition</InputLabel>
            <Select
              labelId="job-select-label"
              value={selectedJobId || ""}
              label="Hiring For Requisition"
              onChange={(e) => setSelectedJobId(Number(e.target.value))}
            >
              {jobs.map((j) => (
                <MenuItem key={j.id} value={j.id}>
                  {j.title} ({j.department})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>

      {/* Date Filter & Alert Bar */}
      {hiringAlertMsg && <Alert severity="info" onClose={() => setHiringAlertMsg(null)}>{hiringAlertMsg}</Alert>}

      {uniqueDates.length > 0 && (
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">Filter by Interview Date:</Typography>
          <Select
            size="small"
            value={filterDate}
            displayEmpty
            onChange={(e) => setFilterDate(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All Dates</MenuItem>
            {uniqueDates.map((d) => (
              <MenuItem key={d} value={d}>{d}</MenuItem>
            ))}
          </Select>
        </Stack>
      )}

      {/* Candidate Cards List */}
      {isLoading ? (
        <Stack sx={{ py: 8, alignItems: "center" }}>
          <CircularProgress />
        </Stack>
      ) : isError ? (
        <Alert severity="error">Could not load candidate pipeline. Ensure backend service is active.</Alert>
      ) : filteredCandidates.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 8 }}>
          No evaluated candidates found for this requisition. Complete interview feedback first!
        </Typography>
      ) : (
        <Stack spacing={2}>
          {filteredCandidates.map((candidate) => (
            <CandidateCardSurface key={candidate.candidate_id} istoprank={candidate.rank === 1}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                {/* Left Info */}
                <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      bgcolor: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {getRankIcon(candidate.rank)}
                  </Box>

                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {candidate.full_name}
                      </Typography>
                      {candidate.hired && <Chip label="✓ Hired" size="small" color="success" variant="outlined" />}
                      {candidate.rejected && <Chip label="✗ Rejected" size="small" color="error" variant="outlined" />}
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      {candidate.email}
                    </Typography>

                    {candidate.interview_date && (
                      <Stack direction="row" spacing={2} sx={{ pt: 0.5 }}>
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                          <Calendar size={12} style={{ color: "#05DC7F" }} />
                          <Typography variant="caption" color="text.secondary">{candidate.interview_date}</Typography>
                        </Stack>
                        {candidate.interview_time && (
                          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                            <Clock size={12} style={{ color: "#05DC7F" }} />
                            <Typography variant="caption" color="text.secondary">{candidate.interview_time}</Typography>
                          </Stack>
                        )}
                      </Stack>
                    )}
                  </Stack>
                </Stack>

                {/* Right Actions & Score */}
                <Stack spacing={1.5} sx={{ alignItems: { xs: "flex-start", sm: "flex-end" } }}>
                  <Stack spacing={0} sx={{ alignItems: { xs: "flex-start", sm: "flex-end" } }}>
                    <Typography variant="caption" color="text.secondary">Match Score</Typography>
                    <Typography variant="h5" color="primary.main" sx={{ fontWeight: 800 }}>
                      {candidate.final_score?.toFixed(1)}%
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      onClick={() => setSelectedCandidate(candidate)}
                      startIcon={<Info size={14} />}
                    >
                      Details
                    </Button>

                    {canDisposition && !candidate.hired && !candidate.rejected && (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleReject(candidate)}
                          disabled={isSubmitting}
                        >
                          Reject
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => handleHire(candidate)}
                          disabled={isSubmitting}
                        >
                          Approve & Hire
                        </Button>
                      </>
                    )}
                  </Stack>
                </Stack>
              </Stack>
            </CandidateCardSurface>
          ))}
        </Stack>
      )}

      {/* Unified Candidate Profile Modal */}
      <CandidateProfile
        open={Boolean(selectedCandidate)}
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onHire={handleHire}
        onReject={handleReject}
      />
    </Stack>
  );
};
