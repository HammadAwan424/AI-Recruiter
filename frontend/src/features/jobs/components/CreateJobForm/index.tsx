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
} from "@mui/material";
import { JobCreatePayload, JobPost } from "../../../../shared/types/job.types";

interface CreateJobFormProps {
  onSubmit: (payload: JobCreatePayload) => Promise<JobPost>;
}

const DEPARTMENTS = ["Engineering", "Design", "Marketing", "Finance", "Human Resources", "Sales"];
const EMPLOYMENT_TYPES = ["Full Time", "Part Time", "Contract", "Internship", "Remote"];

export const CreateJobForm: React.FC<CreateJobFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<JobCreatePayload>({
    title: "",
    department: "",
    experience: "",
    employment_type: "",
    salary_range: "",
    skills: "",
    additional_info: "",
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedJob, setGeneratedJob] = useState<JobPost | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setGeneratedJob(null);
    setLoading(true);

    try {
      const created = await onSubmit(formData);
      setSuccessMsg("The job requisition has been created successfully!");
      setGeneratedJob(created);

      setFormData({
        title: "",
        department: "",
        experience: "",
        employment_type: "",
        salary_range: "",
        skills: "",
        additional_info: "",
      });
    } catch (err: any) {
      setErrorMsg(err?.data?.detail || "The job requisition could not be created.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5" color="text.primary" sx={{ fontWeight: 700 }}>
        Create a New Job Requisition
      </Typography>

      {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
      {successMsg && <Alert severity="success">{successMsg}</Alert>}

      <form onSubmit={handleSubmit}>
        <Stack spacing={2.5}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Job Title *"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Frontend Developer"
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
              placeholder="e.g., 2-3 years"
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
              placeholder="e.g., $80,000 - $110,000"
              required
              fullWidth
            />
            <TextField
              label="Key Skills *"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="e.g., React, TypeScript, GraphQL"
              required
              fullWidth
            />
          </Stack>

          <TextField
            label="Additional Benefits & Requirements (Optional)"
            name="additional_info"
            value={formData.additional_info}
            onChange={handleChange}
            placeholder="e.g., Health insurance, Remote work flexibility, Annual bonus..."
            multiline
            rows={3}
            fullWidth
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              alignSelf: "flex-start",
              px: 4,
              py: 1.5,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={18} color="inherit" />
                <span>AI GENERATING...</span>
              </>
            ) : (
              "Generate Job Post"
            )}
          </Button>
        </Stack>
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
            ✅ {generatedJob.title} — AI Generated Requisition
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line", mb: 2 }}>
            {generatedJob.full_description || generatedJob.description}
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
