import React, { useState } from "react";
import {
  Stack,
  Typography,
  TextField,
  MenuItem,
  Button,
  Alert,
  Box,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Chip,
} from "@mui/material";
import { Sparkles, ArrowLeft, CheckCircle2, ShieldCheck, Lock, Save } from "lucide-react";
import { JobCreatePayload, JobPost } from "../../../shared/types/job.types";
import { useGetCompanyUsersQuery } from "../../users/api";
import { useGenerateJobDescriptionMutation } from "../api";
import { RequisitionPanelSelector } from "./RequisitionPanelSelector";
import { usePermission } from "../../../shared/hooks/usePermission";
import { JOB_PERMISSIONS } from "../permissions";

interface CreateJobFormProps {
  onSubmit: (payload: JobCreatePayload) => Promise<JobPost>;
}

const DEPARTMENTS = ["Engineering", "Design", "Marketing", "Finance", "Human Resources", "Sales"];
const EMPLOYMENT_TYPES = ["Full Time", "Part Time", "Contract", "Internship", "Remote"];

export const CreateJobForm: React.FC<CreateJobFormProps> = ({ onSubmit }) => {
  // Wizard Step: 0 = Parameters, 1 = AI Review Mode
  const [activeStep, setActiveStep] = useState<number>(0);

  const [formData, setFormData] = useState<JobCreatePayload>({
    title: "",
    department: "Engineering",
    experience: "3-5 years",
    employment_type: "Full Time",
    salary_range: "",
    skills: "",
    additional_info: "",
    full_description: "",
    keywords: "",
  });

  const [hiringManagerId, setHiringManagerId] = useState<number | null>(null);
  const [recruiterIds, setRecruiterIds] = useState<number[]>([]);

  const { data: usersData } = useGetCompanyUsersQuery();
  const companyUsers = usersData?.users || [];

  const [generateJD, { isLoading: isGenerating }] = useGenerateJobDescriptionMutation();
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedJob, setGeneratedJob] = useState<JobPost | null>(null);

  const { hasPermission } = usePermission();
  const canApproveJob = hasPermission(JOB_PERMISSIONS.APPROVE);
  const canAssignRecruiter = hasPermission(JOB_PERMISSIONS.ASSIGN_RECRUITER);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateAndReview = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.title.trim()) {
      setErrorMsg("Job title is required to generate AI description.");
      return;
    }

    try {
      const res = await generateJD({
        title: formData.title,
        department: formData.department || "Engineering",
        employment_type: formData.employment_type || "Full Time",
        experience: formData.experience || "3-5 years",
        skills: formData.skills,
        salary_range: formData.salary_range,
        additional_info: formData.additional_info,
      }).unwrap();

      setFormData((prev) => ({
        ...prev,
        full_description: res.full_description,
        keywords: res.keywords,
      }));

      setActiveStep(1); // Proceed to AI Review Mode
    } catch (err: any) {
      setErrorMsg(err?.data?.detail || "Failed to generate AI job description.");
    }
  };

  const handleSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setGeneratedJob(null);
    setSubmitting(true);

    try {
      const payload: JobCreatePayload = {
        ...formData,
        status: canApproveJob ? "published" : "pending_approval",
        hiring_manager_id: hiringManagerId,
        recruiter_ids: recruiterIds,
      };

      const created = await onSubmit(payload);
      setSuccessMsg(
        canApproveJob
          ? "Job requisition published successfully!"
          : "Job requisition submitted for Executive Approval!"
      );
      setGeneratedJob(created);

      // Reset Form State
      setFormData({
        title: "",
        department: "Engineering",
        experience: "3-5 years",
        employment_type: "Full Time",
        salary_range: "",
        skills: "",
        additional_info: "",
        full_description: "",
        keywords: "",
      });
      setHiringManagerId(null);
      setRecruiterIds([]);
      setActiveStep(0);
    } catch (err: any) {
      setErrorMsg(err?.data?.detail || "Failed to submit job requisition.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={3}>
      <div className="border-b border-gray-800 pb-3">
        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>
          Create Job Requisition Wizard
        </Typography>
      </div>

      {/* Stepper Header */}
      <Box className="bg-black/30 p-4 rounded-xl border border-gray-800">
        <Stepper activeStep={activeStep} alternativeLabel>
          <Step key="params">
            <StepLabel sx={{ "& .MuiStepLabel-label": { color: "gray", fontSize: "0.75rem", fontWeight: 600 } }}>
              Job Parameters
            </StepLabel>
          </Step>
          <Step key="review">
            <StepLabel sx={{ "& .MuiStepLabel-label": { color: "gray", fontSize: "0.75rem", fontWeight: 600 } }}>
              AI Review Mode
            </StepLabel>
          </Step>
        </Stepper>
      </Box>

      {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
      {successMsg && <Alert severity="success">{successMsg}</Alert>}

      <form onSubmit={handleSubmitFinal}>
        {/* STEP 0: PARAMETERS FORM */}
        {activeStep === 0 && (
          <Stack spacing={2.5}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Job Title *"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Senior Full Stack Engineer"
                required
                fullWidth
              />
              <TextField
                select
                label="Department *"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                fullWidth
              >
                {DEPARTMENTS.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Experience Required *"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                placeholder="e.g., 3-5 years"
                required
                fullWidth
              />
              <TextField
                select
                label="Employment Type *"
                name="employment_type"
                value={formData.employment_type}
                onChange={handleChange}
                required
                fullWidth
              >
                {EMPLOYMENT_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Salary Range *"
                name="salary_range"
                value={formData.salary_range}
                onChange={handleChange}
                placeholder="e.g., $120,000 - $150,000"
                required
                fullWidth
              />
              <TextField
                label="Key Skills *"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="e.g., React, TypeScript, Python, FastAPI"
                required
                fullWidth
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
              name="additional_info"
              value={formData.additional_info}
              onChange={handleChange}
              placeholder="e.g., Candidate will lead frontend engineering, remote flexibility..."
              multiline
              rows={2}
              fullWidth
            />

            <Button
              type="button"
              onClick={handleGenerateAndReview}
              variant="contained"
              disabled={isGenerating}
              startIcon={isGenerating ? <CircularProgress size={18} color="inherit" /> : <Sparkles size={18} />}
              sx={{
                alignSelf: "flex-start",
                px: 4,
                py: 1.5,
                fontWeight: 700,
                bgcolor: "#05DC7F",
                color: "#000",
                "&:hover": { bgcolor: "#04c56f" },
              }}
            >
              {isGenerating ? "Analyzing & Generating..." : "Generate AI Description"}
            </Button>
          </Stack>
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
                      ? "You hold job:approve permission. Submitting will publish this job immediately."
                      : "Submitting will route this requisition for Executive Approval before publishing."}
                  </Typography>
                </div>
              </div>
            </Box>

            <TextField
              label="Full Job Description (Editable)"
              name="full_description"
              value={formData.full_description || ""}
              onChange={handleChange}
              multiline
              rows={8}
              fullWidth
              sx={{
                "& .MuiInputBase-root": {
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                },
              }}
            />

            <TextField
              label="Search & Match Keywords (Editable)"
              name="keywords"
              value={formData.keywords || ""}
              onChange={handleChange}
              fullWidth
              placeholder="e.g. fullstack, python, react, remote"
            />

            <div className="flex flex-wrap justify-between items-center gap-3 pt-2 border-t border-gray-800">
              <Button
                type="button"
                onClick={() => setActiveStep(0)}
                variant="outlined"
                color="inherit"
                startIcon={<ArrowLeft size={16} />}
              >
                Edit Parameters
              </Button>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={handleGenerateAndReview}
                  variant="outlined"
                  color="primary"
                  disabled={isGenerating}
                  startIcon={isGenerating ? <CircularProgress size={14} color="inherit" /> : <Sparkles size={16} />}
                >
                  Regenerate
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  startIcon={
                    submitting ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <CheckCircle2 size={18} />
                    )
                  }
                  sx={{
                    px: 4,
                    py: 1.2,
                    fontWeight: 700,
                    bgcolor: "#05DC7F",
                    color: "#000",
                    "&:hover": { bgcolor: "#04c56f" },
                  }}
                >
                  {submitting
                    ? "Submitting..."
                    : canApproveJob
                    ? "Submit & Publish Requisition"
                    : "Submit for Executive Approval"}
                </Button>
              </div>
            </div>
          </Stack>
        )}
      </form>

      {generatedJob && (
        <Box
          sx={{
            mt: 2,
            p: 3,
            borderRadius: 2,
            border: "1px solid rgba(5, 220, 127, 0.3)",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
          }}
        >
          <Typography variant="h6" color="primary.main" gutterBottom sx={{ fontWeight: 700 }}>
            ✅ {generatedJob.title} — Requisition Submitted
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line", mb: 2 }}>
            {generatedJob.full_description}
          </Typography>
          {generatedJob.keywords && (
            <Typography variant="caption" color="primary.main">
              Keywords: {generatedJob.keywords}
            </Typography>
          )}
        </Box>
      )}
    </Stack>
  );
};

export default CreateJobForm;
