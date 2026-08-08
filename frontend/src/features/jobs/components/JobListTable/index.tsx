import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Typography,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { Eye, Pencil, Trash2, X } from "lucide-react";
import { JobPost, JobDetail } from "../../../../shared/types/job.types";
import { useLazyGetJobDetailQuery } from "../../api";
import { JobFormModal } from "../JobFormModal";
import { usePermission } from "../../../../shared/hooks/usePermission";

interface JobListTableProps {
  jobs: JobPost[];
  isLoading: boolean;
  onDeleteJob: (id: number) => Promise<any> | any;
  onRefresh?: () => void;
}

export const JobListTable: React.FC<JobListTableProps> = ({
  jobs,
  isLoading,
  onDeleteJob,
  onRefresh,
}) => {
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [editingJobDetail, setEditingJobDetail] = useState<JobDetail | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [triggerGetJobDetail, { isLoading: isFetchingDetail }] = useLazyGetJobDetailQuery();

  const { hasPermission } = usePermission();
  const canDeleteJob = true;

  const handleEditClick = async (jobId: number) => {
    try {
      const detail = await triggerGetJobDetail(jobId).unwrap();
      setEditingJobDetail(detail);
      setShowEditModal(true);
    } catch (err) {
      console.error("Failed to fetch job detail for editing:", err);
    }
  };

  const handleDelete = async (jobId: number) => {
    if (window.confirm("Are you sure you want to delete this job requisition?")) {
      await onDeleteJob(jobId);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Stack spacing={2} className="w-full">
      <TableContainer
        className="!bg-[#09090b]/80 !border !border-gray-800/80 !rounded-2xl !overflow-hidden backdrop-blur-md"
      >
        <Table sx={{ minWidth: 650 }} aria-label="job listings table">
          <TableHead>
            <TableRow className="!bg-black/40">
              <TableCell className="!text-gray-400 !font-semibold !text-xs !uppercase !tracking-wider">
                Title & Department
              </TableCell>
              <TableCell className="!text-gray-400 !font-semibold !text-xs !uppercase !tracking-wider">
                Employment Type
              </TableCell>
              <TableCell className="!text-gray-400 !font-semibold !text-xs !uppercase !tracking-wider">
                Created Date
              </TableCell>
              <TableCell
                align="right"
                className="!text-gray-400 !font-semibold !text-xs !uppercase !tracking-wider"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                    Loading job requisitions...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    No job requisitions found. Create one to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow
                  key={job.id}
                  hover
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "white" }}>
                        {job.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {job.department || "General"}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={job.employment_type}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{formatDate(job.created_at)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setSelectedJob(job)}
                        title="View Job Details"
                      >
                        <Eye size={18} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => handleEditClick(job.id)}
                        disabled={isFetchingDetail}
                        title="Edit Requisition & Assigned Panel"
                      >
                        <Pencil size={18} />
                      </IconButton>
                      {canDeleteJob && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(job.id)}
                          title="Delete Requisition"
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ===== UNIFIED MATERIAL UI DIALOG FOR EYE ICON JOB VIEW ===== */}
      <Dialog
        open={Boolean(selectedJob)}
        onClose={() => setSelectedJob(null)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "#0b0b0b",
              color: "#ffffff",
              borderRadius: "16px",
              border: "1px solid rgba(5, 220, 127, 0.3)",
              boxShadow: "0 0 30px rgba(5, 220, 127, 0.25)",
              maxHeight: "85vh",
            },
          },
        }}
      >
        {selectedJob && (
          <>
            <DialogTitle sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)", pb: 2, pt: 2.5, px: 3 }}>
              <div className="flex justify-between items-center">
                <div>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "white" }}>
                    {selectedJob.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "gray" }}>
                    {selectedJob.department || "Engineering"} • {selectedJob.employment_type || "Full-Time"}
                  </Typography>
                </div>
                <IconButton onClick={() => setSelectedJob(null)} sx={{ color: "gray", "&:hover": { color: "white" } }}>
                  <X size={20} />
                </IconButton>
              </div>
            </DialogTitle>

            <DialogContent dividers sx={{ borderColor: "rgba(255,255,255,0.1)", py: 3, px: 3 }}>
              <Typography
                variant="body2"
                component="div"
                sx={{
                  color: "#d1d5db",
                  lineHeight: 1.7,
                  whiteSpace: "pre-line",
                  wordBreak: "break-word",
                  fontFamily: "inherit",
                }}
              >
                {selectedJob.full_description || selectedJob.description || "No description available."}
              </Typography>
            </DialogContent>

            <DialogActions sx={{ borderTop: "1px solid rgba(255,255,255,0.1)", px: 3, py: 2 }}>
              <Button
                onClick={() => setSelectedJob(null)}
                variant="contained"
                sx={{
                  backgroundColor: "#05DC7F",
                  color: "#000000",
                  fontWeight: 700,
                  "&:hover": { backgroundColor: "#04c56f" },
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ===== EDIT JOB REQUISITION MODAL DIALOGUE ===== */}
      {showEditModal && editingJobDetail && (
        <JobFormModal
          open={showEditModal}
          initialJob={editingJobDetail}
          onClose={() => {
            setShowEditModal(false);
            setEditingJobDetail(null);
          }}
          onSaved={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </Stack>
  );
};
