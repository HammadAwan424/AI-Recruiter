import React, { useState } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Menu,
  Checkbox,
  ListItemText,
  Chip,
  Tooltip,
} from "@mui/material";
import { DownloadCloud, RefreshCw, Columns, Users, UserCheck } from "lucide-react";
import { JobPost } from "../../../shared/types/job.types";
import { useGetJobDetailQuery } from "../../jobs/api";

interface PipelineHeaderProps {
  jobs: JobPost[];
  selectedJobId: number | null;
  onSelectJob: (id: number) => void;
  onFetchNewCVs: () => void;
  isFetchingNew: boolean;
  isScreeningActive: boolean;
  visibleStageKeys: string[];
  onToggleStageVisibility: (key: string) => void;
  allStages: { key: string; label: string; color: string }[];
}

export const PipelineHeader: React.FC<PipelineHeaderProps> = ({
  jobs,
  selectedJobId,
  onSelectJob,
  onFetchNewCVs,
  isFetchingNew,
  isScreeningActive,
  visibleStageKeys,
  onToggleStageVisibility,
  allStages,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { data: jobDetail } = useGetJobDetailQuery(selectedJobId || 0, {
    skip: !selectedJobId,
  });

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-black/40 p-4 sm:p-5 rounded-2xl border border-[#05DC7F]/20 shadow-[0_0_15px_rgba(5,220,127,0.15)] w-full">
      <div className="space-y-1">
        <h2 className="text-white text-xl sm:text-2xl font-bold tracking-tight">
          Collaborative Candidate Pipeline
        </h2>
        <p className="text-gray-400 text-xs sm:text-sm">
          Real-time hiring stage movement, interview scorecards & team feedback
        </p>

        {/* Job Creator & Assigned Users Badges */}
        {jobDetail && (
          <div className="flex flex-wrap items-center gap-2 pt-1.5 text-xs text-gray-300">
            {jobDetail.creator && (
              <Tooltip title={`Job Creator: ${jobDetail.creator.full_name}`}>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-medium">
                  <UserCheck size={13} className="text-emerald-400" />
                  <span>Created by: {jobDetail.creator.full_name}</span>
                </div>
              </Tooltip>
            )}

            {jobDetail.assigned_users && jobDetail.assigned_users.length > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-gray-300">
                <Users size={13} className="text-gray-400" />
                <span className="font-semibold text-gray-200">Team:</span>
                <div className="flex items-center gap-1">
                  {jobDetail.assigned_users.map((member) => (
                    <Chip
                      key={member.id}
                      label={`${member.full_name} (${member.role.replace("_", " ")})`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: 10,
                        bgcolor: "rgba(255, 255, 255, 0.07)",
                        color: "gray.300",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
        {/* Column Visibility Selector Button */}
        <Button
          variant="outlined"
          onClick={handleOpenMenu}
          startIcon={<Columns size={16} />}
          sx={{
            height: 40,
            color: "gray.300",
            borderColor: "rgba(255, 255, 255, 0.15)",
            fontWeight: 600,
            px: 2,
            "&:hover": { borderColor: "#05DC7F", color: "white" },
          }}
        >
          Columns ({visibleStageKeys.length}/{allStages.length})
        </Button>

        {/* Column Visibility Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          slotProps={{
            paper: {
              sx: {
                backgroundColor: "#0b0b0b",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 2,
                minWidth: 200,
              },
            },
          }}
        >
          {allStages.map((stage) => {
            const isChecked = visibleStageKeys.includes(stage.key);
            return (
              <MenuItem
                key={stage.key}
                onClick={() => onToggleStageVisibility(stage.key)}
                sx={{ py: 0.5 }}
              >
                <Checkbox
                  checked={isChecked}
                  size="small"
                  sx={{
                    color: "gray",
                    "&.Mui-checked": { color: "#05DC7F" },
                  }}
                />
                <ListItemText
                  primary={stage.label}
                  slotProps={{ primary: { sx: { fontSize: 13, fontWeight: isChecked ? 600 : 400 } } }}
                />
              </MenuItem>
            );
          })}
        </Menu>

        {jobs.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 220, flex: 1 }}>
            <InputLabel id="job-select-label" sx={{ color: "gray" }}>
              Hiring Requisition
            </InputLabel>
            <Select
              labelId="job-select-label"
              value={selectedJobId || ""}
              label="Hiring Requisition"
              onChange={(e) => onSelectJob(Number(e.target.value))}
              sx={{ color: "white" }}
            >
              {jobs.map((j) => (
                <MenuItem key={j.id} value={j.id}>
                  {j.title} ({j.department})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <Button
          variant="contained"
          color="primary"
          disabled={isFetchingNew || isScreeningActive || !selectedJobId}
          onClick={onFetchNewCVs}
          startIcon={
            isFetchingNew || isScreeningActive ? (
              <RefreshCw className="animate-spin" size={16} />
            ) : (
              <DownloadCloud size={16} />
            )
          }
          sx={{ height: 40, fontWeight: 700, px: 2.5, whitespace: "nowrap" }}
        >
          {isFetchingNew || isScreeningActive ? "Fetching & Screening..." : "Fetch New CVs"}
        </Button>
      </div>
    </div>
  );
};
