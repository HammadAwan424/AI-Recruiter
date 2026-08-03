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
} from "@mui/material";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { JobPost, JobDetail } from "../../../../shared/types/job.types";
import { useLazyGetJobDetailQuery } from "../../api";
import { JobFormModal } from "../JobFormModal";
import { usePermission } from "../../../../shared/hooks/usePermission";
import { JOB_PERMISSIONS } from "../../permissions";

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
  const canDeleteJob = hasPermission(JOB_PERMISSIONS.CREATE);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleEditClick = async (jobId: number) => {
    try {
      const detail = await triggerGetJobDetail(jobId).unwrap();
      // Ensure assigned_users defaults to empty array if missing
      setEditingJobDetail({
        ...detail,
        assigned_users: detail.assigned_users || [],
      });
      setShowEditModal(true);
    } catch (err) {
      alert("Failed to load detailed requisition permissions.");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure? This job requisition will be permanently deleted.")) {
      await onDeleteJob(id);
    }
  };

  if (isLoading) {
    return (
      <Stack sx={{ py: 8, alignItems: "center" }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Active Job Requisitions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total Requisitions: {jobs.length}
        </Typography>
      </Stack>

      <TableContainer>
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell width={60}>#</TableCell>
              <TableCell>Job Title</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Employment Type</TableCell>
              <TableCell>Posted Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary" variant="body2">
                    No active job requisitions found. Create one using the 'Create Job' tab above!
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job, idx) => (
                <TableRow key={job.id} hover>
                  <TableCell sx={{ color: "text.secondary" }}>{idx + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{job.title}</TableCell>
                  <TableCell>{job.department}</TableCell>
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

      {/* ===== LEGENDARY JOB DETAIL MODAL ===== */}
      {selectedJob && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-2 sm:px-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setSelectedJob(null)}
          />

          <div className="relative bg-[#0b0b0b] w-full max-w-md sm:max-w-2xl rounded-2xl border border-[#05DC7F]/30 shadow-[0_0_25px_rgba(5,220,127,0.25)] flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-700">
              <div>
                <h4 className="text-white text-base sm:text-lg font-bold">
                  {selectedJob.title}
                </h4>
                <p className="text-gray-400 text-xs mt-0.5">
                  {selectedJob.department} | {selectedJob.employment_type}
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-gray-400 hover:text-white text-lg sm:text-xl"
              >
                ✕
              </button>
            </div>

            <div className="px-4 sm:px-6 py-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-[#05DC7F] scrollbar-track-gray-800">
              <pre className="text-gray-300 leading-relaxed whitespace-pre-line break-words text-sm sm:text-base font-sans">
                {selectedJob.full_description ||
                  selectedJob.description ||
                  "No full description available."}
              </pre>
            </div>

            <div className="flex justify-end px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-700">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-[#05DC7F] hover:bg-[#04c56f] text-black font-semibold transition text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
