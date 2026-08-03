import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { X, Briefcase, Plus, Save } from "lucide-react";
import { JobDetail } from "../../../shared/types/job.types";
import { useCreateJobMutation, useUpdateJobMutation } from "../api";
import { useGetCompanyUsersQuery } from "../../users/api";
import { HiringManagerSelector } from "./HiringManagerSelector";
import { RecruiterSelector } from "./RecruiterSelector";
import { usePermission } from "../../../shared/hooks/usePermission";
import { JOB_PERMISSIONS } from "../permissions";

interface JobFormModalProps {
  open: boolean;
  initialJob?: JobDetail | null;
  onClose: () => void;
  onSaved: () => void;
}

export const JobFormModal: React.FC<JobFormModalProps> = ({
  open,
  initialJob,
  onClose,
  onSaved,
}) => {
  const isEditing = Boolean(initialJob);

  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [employmentType, setEmploymentType] = useState("full_time");
  const [experience, setExperience] = useState("3-5 years");
  const [skills, setSkills] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [status, setStatus] = useState("published");

  const [hiringManagerId, setHiringManagerId] = useState<number | null>(null);
  const [recruiterIds, setRecruiterIds] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: usersData } = useGetCompanyUsersQuery();
  const companyUsers = usersData?.users || [];

  const [createJob, { isLoading: isCreating }] = useCreateJobMutation();
  const [updateJob, { isLoading: isUpdating }] = useUpdateJobMutation();
  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    if (initialJob) {
      setTitle(initialJob.title || "");
      setDepartment(initialJob.department || "Engineering");
      setEmploymentType(initialJob.employment_type || "full_time");
      setExperience(initialJob.experience || "3-5 years");
      setSkills(initialJob.skills || "");
      setSalaryRange(initialJob.salary_range || "");
      setFullDescription(initialJob.full_description || "");
      setKeywords(initialJob.keywords || "");
      setStatus(initialJob.status || "published");

      // Extract Hiring Manager and Recruiters from assigned_users
      const assignedUsers = initialJob.assigned_users || [];
      const hm = assignedUsers.find((u) => u.role === "hiring_manager" || u.role === "hr_manager");
      const recruiters = assignedUsers.filter((u) => u.role === "recruiter" || u.role === "employee");

      setHiringManagerId(hm ? hm.id : null);
      setRecruiterIds(recruiters.map((u) => u.id));
    } else {
      setTitle("");
      setDepartment("Engineering");
      setEmploymentType("full_time");
      setExperience("3-5 years");
      setSkills("");
      setSalaryRange("");
      setFullDescription("");
      setKeywords("");
      setStatus("published");
      setHiringManagerId(null);
      setRecruiterIds([]);
    }
    setErrorMsg(null);
  }, [initialJob, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("Job title is required.");
      return;
    }

    const payload = {
      title,
      department,
      employment_type: employmentType,
      experience,
      skills,
      salary_range: salaryRange,
      full_description: fullDescription,
      keywords,
      status,
      hiring_manager_id: hiringManagerId,
      recruiter_ids: recruiterIds,
    };

    try {
      if (isEditing && initialJob) {
        await updateJob({ id: initialJob.id, payload }).unwrap();
      } else {
        await createJob(payload).unwrap();
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.data?.detail || "Failed to save job requisition.");
    }
  };

  const { hasPermission } = usePermission();
  const canAssignRecruiter = hasPermission(JOB_PERMISSIONS.ASSIGN_RECRUITER);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: "#0d0d0d",
            color: "text.primary",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 3,
          },
        },
      }}
    >
      <DialogTitle className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
          <Briefcase size={20} className="text-[#05DC7F]" />
          {isEditing ? `Edit Requisition #${initialJob?.id}` : "Create New Requisition"}
        </Typography>
        <IconButton onClick={onClose} size="small" className="text-gray-400 hover:text-white">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent className="p-6 overflow-y-auto max-h-[75vh]">
          <Stack spacing={3}>
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

            {/* Basic Job Details */}
            <TextField
              label="Job Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              size="small"
              placeholder="e.g. Senior Full Stack Engineer"
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                label="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                fullWidth
                size="small"
              >
                <MenuItem value="Engineering">Engineering</MenuItem>
                <MenuItem value="Product">Product</MenuItem>
                <MenuItem value="Design">Design</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
                <MenuItem value="Sales">Sales</MenuItem>
                <MenuItem value="Human Resources">Human Resources</MenuItem>
              </TextField>

              <TextField
                select
                label="Employment Type"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                fullWidth
                size="small"
              >
                <MenuItem value="full_time">Full-Time</MenuItem>
                <MenuItem value="part_time">Part-Time</MenuItem>
                <MenuItem value="contract">Contract</MenuItem>
                <MenuItem value="remote">Remote</MenuItem>
              </TextField>

              <TextField
                label="Experience Required"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                fullWidth
                size="small"
                placeholder="e.g. 3-5 years"
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Required Skills (Comma separated)"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                fullWidth
                size="small"
                placeholder="React, TypeScript, Python, FastAPI"
              />

              <TextField
                label="Salary Range"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                fullWidth
                size="small"
                placeholder="e.g. $120,000 - $150,000"
              />
            </Stack>

            {/* Role-Filtered Component 1: Hiring Manager Assignment (Max 1) */}
            <HiringManagerSelector
              selectedId={hiringManagerId}
              companyUsers={companyUsers}
              onChange={setHiringManagerId}
              disabled={!canAssignRecruiter}
            />

            {/* Role-Filtered Component 2: Recruiters Assignment */}
            <RecruiterSelector
              selectedIds={recruiterIds}
              companyUsers={companyUsers}
              onChange={setRecruiterIds}
              disabled={!canAssignRecruiter}
            />

            {/* Full Job Description & Keywords */}
            <TextField
              label="Full Job Description"
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              multiline
              rows={4}
              fullWidth
              size="small"
              placeholder="Detail responsibilities, requirements, and benefits..."
            />

            <TextField
              label="Search Keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              fullWidth
              size="small"
              placeholder="e.g. fullstack, python, react, remote"
            />
          </Stack>
        </DialogContent>

        <DialogActions className="px-6 py-4 border-t border-gray-800 flex justify-end gap-2">
          <Button onClick={onClose} variant="outlined" color="inherit" size="small">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="small"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={14} color="inherit" /> : isEditing ? <Save size={16} /> : <Plus size={16} />}
            sx={{ fontWeight: 700 }}
          >
            {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Requisition"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
