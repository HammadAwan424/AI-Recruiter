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
  Box,
  Stepper,
  Step,
  StepLabel,
  Chip,
} from "@mui/material";
import { X, Briefcase, Plus, Save, Sparkles, ArrowLeft, ArrowRight, CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { JobDetail } from "../../../shared/types/job.types";
import { useCreateJobMutation, useUpdateJobMutation, useGenerateJobDescriptionMutation } from "../api";
import { useGetCompanyUsersQuery } from "../../users/api";
import { RequisitionPanelSelector } from "./RequisitionPanelSelector";
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

  // Active Wizard Step: 0 = Parameters, 1 = AI Review Mode
  const [activeStep, setActiveStep] = useState<number>(0);

  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [employmentType, setEmploymentType] = useState("full_time");
  const [experience, setExperience] = useState("3-5 years");
  const [skills, setSkills] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  const [hiringManagerId, setHiringManagerId] = useState<number | null>(null);
  const [recruiterIds, setRecruiterIds] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: usersData } = useGetCompanyUsersQuery();
  const companyUsers = usersData?.users || [];

  const [generateJD, { isLoading: isGenerating }] = useGenerateJobDescriptionMutation();
  const [createJob, { isLoading: isCreating }] = useCreateJobMutation();
  const [updateJob, { isLoading: isUpdating }] = useUpdateJobMutation();
  const isSubmitting = isCreating || isUpdating;

  const { hasPermission } = usePermission();
  const canAssignRecruiter = hasPermission(JOB_PERMISSIONS.ASSIGN_RECRUITER);
  const canApproveJob = hasPermission(JOB_PERMISSIONS.APPROVE);

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

      const assignedUsers = initialJob.assigned_users || [];
      const hm = assignedUsers.find((u) => u.role === "hiring_manager" || u.role === "hr_manager");
      const recruiters = assignedUsers.filter((u) => u.role === "recruiter" || u.role === "employee");

      setHiringManagerId(hm ? hm.id : null);
      setRecruiterIds(recruiters.map((u) => u.id));
      setActiveStep(1); // Jump directly to Review Mode when editing existing job
    } else {
      setTitle("");
      setDepartment("Engineering");
      setEmploymentType("full_time");
      setExperience("3-5 years");
      setSkills("");
      setSalaryRange("");
      setFullDescription("");
      setKeywords("");
      setAdditionalInfo("");
      setHiringManagerId(null);
      setRecruiterIds([]);
      setActiveStep(0);
    }
    setErrorMsg(null);
  }, [initialJob, open]);

  const handleGenerateAndReview = async () => {
    setErrorMsg(null);
    if (!title.trim()) {
      setErrorMsg("Job title is required to generate AI description.");
      return;
    }

    try {
      const res = await generateJD({
        title,
        department,
        employment_type: employmentType,
        experience,
        skills,
        salary_range: salaryRange,
        additional_info: additionalInfo,
      }).unwrap();

      setFullDescription(res.full_description);
      setKeywords(res.keywords);
      setActiveStep(1); // Proceed to AI Review Mode
    } catch (err: any) {
      setErrorMsg(err?.data?.detail || "Failed to generate AI job description.");
    }
  };

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
      status: canApproveJob ? "published" : "pending_approval",
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
            border: "1px solid rgba(5, 220, 127, 0.3)",
            borderRadius: 3,
            boxShadow: "0 0 35px rgba(5, 220, 127, 0.2)",
          },
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
          <Briefcase size={20} className="text-[#05DC7F]" />
          {isEditing ? `Edit Requisition #${initialJob?.id}` : "Create Requisition Wizard"}
        </Typography>
        <IconButton onClick={onClose} size="small" className="text-gray-400 hover:text-white">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      {/* Wizard Progress Stepper */}
      {!isEditing && (
        <Box className="px-8 pt-4 pb-2 bg-black/40 border-b border-gray-800/80">
          <Stepper activeStep={activeStep} alternativeLabel>
            <Step key="params">
              <StepLabel sx={{ "& .MuiStepLabel-label": { color: "gray", fontSize: "0.75rem", fontWeight: 600 } }}>
                Requisition Parameters
              </StepLabel>
            </Step>
            <Step key="review">
              <StepLabel sx={{ "& .MuiStepLabel-label": { color: "gray", fontSize: "0.75rem", fontWeight: 600 } }}>
                AI Review Mode
              </StepLabel>
            </Step>
          </Stepper>
        </Box>
      )}

      <form onSubmit={handleSubmit}>
        <DialogContent className="p-6 overflow-y-auto max-h-[70vh]">
          <Stack spacing={3}>
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

            {/* STEP 0: PARAMETERS FORM */}
            {activeStep === 0 && (
              <>
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

                <RequisitionPanelSelector
                  hiringManagerId={hiringManagerId}
                  recruiterIds={recruiterIds}
                  companyUsers={companyUsers}
                  onHiringManagerChange={setHiringManagerId}
                  onRecruitersChange={setRecruiterIds}
                  disabled={!canAssignRecruiter}
                />

                <TextField
                  label="Additional Prompt Context (Optional)"
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  multiline
                  rows={2}
                  fullWidth
                  size="small"
                  placeholder="e.g. Focus on high performance distributed systems, candidate will lead frontend tech stack..."
                />
              </>
            )}

            {/* STEP 1: AI REVIEW MODE */}
            {activeStep === 1 && (
              <Stack spacing={3}>
                {/* Status Notice Banner */}
                <Box
                  className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                    canApproveJob
                      ? "bg-[#05DC7F]/10 border-[#05DC7F]/30 text-[#05DC7F]"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {canApproveJob ? <ShieldCheck size={22} /> : <Lock size={22} />}
                    <div>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {canApproveJob
                          ? "Approval Authority Active — Direct Publishing"
                          : "Executive Review Required — Pending Approval"}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {canApproveJob
                          ? "You hold job:approve permission. Submitting will immediately publish this job."
                          : "Submitting will route this requisition for Executive Approval before publishing."}
                      </Typography>
                    </div>
                  </div>

                  <Chip
                    label={canApproveJob ? "Will Publish" : "Pending Approval"}
                    size="small"
                    color={canApproveJob ? "success" : "warning"}
                    sx={{ fontWeight: 700 }}
                  />
                </Box>

                {/* AI Review Header */}
                <Box className="flex items-center justify-between bg-black/50 p-3.5 rounded-xl border border-gray-800">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-[#05DC7F]" />
                    <Typography variant="body2" sx={{ color: "white", fontWeight: 700 }}>
                      AI-Generated Description (Editable Preview Mode)
                    </Typography>
                  </div>
                  <Typography variant="caption" sx={{ color: "gray" }}>
                    Review & edit content before final submission
                  </Typography>
                </Box>

                <TextField
                  label="Full Job Description (Editable)"
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  multiline
                  rows={8}
                  fullWidth
                  size="small"
                  placeholder="AI generated job description..."
                  sx={{
                    "& .MuiInputBase-root": {
                      fontSize: "0.875rem",
                      lineHeight: 1.6,
                    },
                  }}
                />

                <TextField
                  label="Search & Match Keywords (Editable)"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="e.g. fullstack, python, react, remote"
                />
              </Stack>
            )}
          </Stack>
        </DialogContent>

        {/* Modal Footer Actions */}
        <DialogActions className="px-6 py-4 border-t border-gray-800 flex justify-between gap-2">
          {activeStep === 0 ? (
            <>
              <Button onClick={onClose} variant="outlined" color="inherit" size="small">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleGenerateAndReview}
                variant="contained"
                size="small"
                disabled={isGenerating}
                startIcon={isGenerating ? <CircularProgress size={14} color="inherit" /> : <Sparkles size={16} />}
                sx={{
                  bgcolor: "#05DC7F",
                  color: "#000",
                  fontWeight: 700,
                  "&:hover": { bgcolor: "#04c56f" },
                }}
              >
                {isGenerating ? "Analyzing & Generating..." : "Generate AI Description"}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                onClick={() => setActiveStep(0)}
                variant="outlined"
                color="inherit"
                size="small"
                startIcon={<ArrowLeft size={16} />}
              >
                Edit Parameters
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleGenerateAndReview}
                  variant="outlined"
                  color="primary"
                  size="small"
                  disabled={isGenerating}
                  startIcon={isGenerating ? <CircularProgress size={14} color="inherit" /> : <Sparkles size={16} />}
                >
                  Regenerate
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="small"
                  disabled={isSubmitting}
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : isEditing ? (
                      <Save size={16} />
                    ) : (
                      <CheckCircle2 size={16} />
                    )
                  }
                  sx={{
                    bgcolor: "#05DC7F",
                    color: "#000",
                    fontWeight: 700,
                    "&:hover": { bgcolor: "#04c56f" },
                  }}
                >
                  {isSubmitting
                    ? "Submitting..."
                    : isEditing
                    ? "Save Changes"
                    : canApproveJob
                    ? "Submit & Publish Requisition"
                    : "Submit for Executive Approval"}
                </Button>
              </div>
            </>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default JobFormModal;
