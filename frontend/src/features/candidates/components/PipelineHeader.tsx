import React, { useState } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Menu,
  Popover,
  Checkbox,
  ListItemText,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  DownloadCloud,
  RefreshCw,
  Columns,
  Users,
  UserCheck,
  Sparkles,
  ChevronDown,
  HelpCircle,
  Cpu,
  FileCheck2,
  SlidersHorizontal,
  ArrowRight,
} from "lucide-react";
import { JobPost } from "../../../shared/types/job.types";
import { useGetJobDetailQuery } from "../../jobs/api";

interface PipelineHeaderProps {
  jobs: JobPost[];
  selectedJobId: number | null;
  onSelectJob: (id: number) => void;
  onFetchAndEvaluate: () => void;
  onEvaluateCandidates?: () => void;
  pendingEvaluationCount?: number;
  pipelineStep?: "idle" | "fetching" | "parsing" | "screening" | string;
  isFetchingNew?: boolean;
  isParsingActive?: boolean;
  isScreeningActive?: boolean;
  visibleStageKeys: string[];
  onToggleStageVisibility: (key: string) => void;
  allStages: { key: string; label: string; color: string }[];
}

export const PipelineHeader: React.FC<PipelineHeaderProps> = ({
  jobs,
  selectedJobId,
  onSelectJob,
  onFetchAndEvaluate,
  onEvaluateCandidates,
  pendingEvaluationCount = 0,
  pipelineStep = "idle",
  isFetchingNew,
  isParsingActive,
  isScreeningActive,
  visibleStageKeys,
  onToggleStageVisibility,
  allStages,
}) => {
  const [columnsMenuAnchor, setColumnsMenuAnchor] = useState<null | HTMLElement>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<null | HTMLElement>(null);

  const { data: jobDetail } = useGetJobDetailQuery(selectedJobId || 0, {
    skip: !selectedJobId,
  });

  const handleOpenColumnsMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    setColumnsMenuAnchor(e.currentTarget);
  };

  const handleCloseColumnsMenu = () => {
    setColumnsMenuAnchor(null);
  };

  const handleOpenPopover = (e: React.MouseEvent<HTMLButtonElement>) => {
    setPopoverAnchor(e.currentTarget);
  };

  const handleClosePopover = () => {
    setPopoverAnchor(null);
  };

  const handleRunEvaluation = () => {
    handleClosePopover();
    if (onEvaluateCandidates) {
      onEvaluateCandidates();
    }
  };

  const isPipelineActive =
    (pipelineStep && pipelineStep !== "idle") ||
    Boolean(isFetchingNew) ||
    Boolean(isParsingActive) ||
    Boolean(isScreeningActive);

  const getActiveButtonLabel = () => {
    if (pipelineStep === "fetching" || isFetchingNew) return "Fetching...";
    if (pipelineStep === "parsing" || isParsingActive) return "Parsing...";
    if (pipelineStep === "screening" || isScreeningActive) return "Screening...";
    return "Fetch & Evaluate";
  };

  const hasPendingCards = pendingEvaluationCount > 0;
  const isPopoverOpen = Boolean(popoverAnchor);

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
          onClick={handleOpenColumnsMenu}
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
          anchorEl={columnsMenuAnchor}
          open={Boolean(columnsMenuAnchor)}
          onClose={handleCloseColumnsMenu}
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

        {/* Pipeline Action Area */}
        <div className="flex flex-col items-end">
          {hasPendingCards ? (
            /* Split / Combo Button when pending candidate cards exist */
            <div className="inline-flex items-center rounded-xl bg-zinc-900 border border-zinc-700/80 shadow-md h-10 overflow-hidden transition-all duration-200 hover:border-zinc-600">
              {/* Left Section: Disabled 'Fetch & Evaluate' with Question Mark Tooltip */}
              <div className="flex items-center gap-1.5 px-3 py-2 text-zinc-400 font-semibold text-xs select-none cursor-not-allowed bg-zinc-900/90">
                <DownloadCloud size={15} className="text-zinc-500" />
                <span>Fetch & Evaluate</span>
                <Tooltip
                  title={`There are ${pendingEvaluationCount} pending application(s) for this job. Evaluate pending candidates first before fetching new applications.`}
                  arrow
                  placement="top"
                >
                  <span className="inline-flex items-center text-amber-400 hover:text-amber-300 ml-0.5 cursor-help">
                    <HelpCircle size={14} />
                  </span>
                </Tooltip>
              </div>

              {/* Clear Vertical Separator */}
              <div className="w-[1px] h-6 bg-zinc-700 self-center" />

              {/* Right Section: Interactive Chevron Dropdown Trigger */}
              <button
                type="button"
                onClick={handleOpenPopover}
                disabled={isPipelineActive || !selectedJobId}
                className={`flex items-center justify-center px-2.5 h-full transition-colors ${
                  isPopoverOpen
                    ? "bg-[#05DC7F]/20 text-[#05DC7F]"
                    : "bg-zinc-800/80 hover:bg-[#05DC7F]/15 text-zinc-300 hover:text-[#05DC7F]"
                } ${isPipelineActive ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                title="Expand AI evaluation dialogue"
              >
                {isPipelineActive ? (
                  <RefreshCw className="animate-spin text-zinc-400" size={15} />
                ) : (
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      isPopoverOpen ? "rotate-180 text-[#05DC7F]" : ""
                    }`}
                  />
                )}
              </button>

              {/* Enhanced Expanded Evaluation Dialogue Popover */}
              <Popover
                open={isPopoverOpen}
                anchorEl={popoverAnchor}
                onClose={handleClosePopover}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                slotProps={{
                  paper: {
                    sx: {
                      backgroundColor: "transparent",
                      boxShadow: "none",
                      overflow: "visible",
                      mt: 1.2,
                    },
                  },
                }}
              >
                <div className="w-[360px] bg-[#111113] border border-emerald-500/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_25px_rgba(5,220,127,0.15)] overflow-hidden text-white">
                  {/* Top Gradient Banner & Header */}
                  <div className="p-4 border-b border-zinc-800/80 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#05DC7F]/10 border border-[#05DC7F]/30 flex items-center justify-center text-[#05DC7F]">
                          <Cpu size={16} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white tracking-tight leading-none">
                            AI Batch Evaluation
                          </h4>
                          <span className="text-[11px] text-gray-400 mt-1 block">
                            Requisition #{selectedJobId}
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-950/70 text-amber-400 border border-amber-800/60">
                        {pendingEvaluationCount} Pending
                      </span>
                    </div>
                  </div>

                  {/* Evaluation Steps Preview */}
                  <div className="p-4 space-y-3 bg-[#0d0d0f]">
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Evaluation Pipeline
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-900/70 border border-zinc-800/60">
                        <FileCheck2 size={15} className="text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-gray-200">1. Structured CV Parsing</span>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Extract skills, work chronology & education profiles
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-900/70 border border-zinc-800/60">
                        <SlidersHorizontal size={15} className="text-[#05DC7F] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-gray-200">2. Multi-Dimension Scoring</span>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Score skills, experience & keywords against requisition
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Prominent CTA Button */}
                    <div className="pt-2">
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={handleRunEvaluation}
                        startIcon={<Sparkles size={15} />}
                        endIcon={<ArrowRight size={14} />}
                        sx={{
                          height: 42,
                          fontWeight: 700,
                          fontSize: 13,
                          textTransform: "none",
                          borderRadius: 2,
                          backgroundColor: "#05DC7F",
                          color: "#000000",
                          boxShadow: "0 0 20px rgba(5, 220, 127, 0.35)",
                          "&:hover": {
                            backgroundColor: "#04c26f",
                            boxShadow: "0 0 25px rgba(5, 220, 127, 0.5)",
                          },
                        }}
                      >
                        Evaluate {pendingEvaluationCount} Candidate{pendingEvaluationCount > 1 ? "s" : ""}
                      </Button>
                    </div>

                    <p className="text-[10px] text-gray-500 text-center pt-1">
                      Scores and fit flags update across the board automatically
                    </p>
                  </div>
                </div>
              </Popover>
            </div>
          ) : !selectedJobId ? (
            /* Disabled Primary Button when no job is selected / exists */
            <div className="inline-flex items-center rounded-xl bg-zinc-900 border border-zinc-700/80 shadow-md h-10 px-3 py-2 text-zinc-400 font-semibold text-xs select-none cursor-not-allowed">
              <DownloadCloud size={15} className="text-zinc-500 mr-1.5" />
              <span>Fetch & Evaluate</span>
              <Tooltip
                title={
                  jobs.length === 0
                    ? "There are no jobs created yet. You have to first create a hiring requisition."
                    : "No job is currently selected. Select a job requisition first."
                }
                arrow
                placement="top"
              >
                <span className="inline-flex items-center text-amber-400 hover:text-amber-300 ml-1.5 cursor-help">
                  <HelpCircle size={14} />
                </span>
              </Tooltip>
            </div>
          ) : (
            /* Standard Enabled Primary Button when no pending cards exist */
            <Button
              variant="contained"
              color="primary"
              disabled={isPipelineActive || !selectedJobId}
              onClick={onFetchAndEvaluate}
              startIcon={
                isPipelineActive ? (
                  <RefreshCw className="animate-spin" size={16} />
                ) : (
                  <DownloadCloud size={16} />
                )
              }
              sx={{ height: 40, fontWeight: 700, px: 2.5, whitespace: "nowrap" }}
            >
              {getActiveButtonLabel()}
            </Button>
          )}

          {jobDetail?.last_read && (
            <span className="text-[10px] text-gray-400 mt-1 font-mono tracking-tight">
              Last read: {(() => {
                const raw = jobDetail.last_read;
                const utcStr = raw.endsWith("Z") || raw.includes("+") ? raw : `${raw}Z`;
                return new Date(utcStr).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
              })()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
