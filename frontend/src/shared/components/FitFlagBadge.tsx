import React from "react";
import { Tooltip } from "@mui/material";
import { FitFlag, FitFlagCategory } from "../types/candidate.types";
import {
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaHistory,
  FaExchangeAlt,
  FaDollarSign,
} from "react-icons/fa";

interface FitFlagBadgeProps {
  fitFlags?: FitFlag[] | string;
  size?: "sm" | "md";
}

const FLAG_CONFIG: Record<
  FitFlagCategory,
  { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  overqualified: {
    label: "Overqualified",
    bg: "bg-purple-500/15",
    text: "text-purple-400",
    border: "border-purple-500/30",
    icon: <FaArrowUp className="text-[10px]" />,
  },
  underqualified: {
    label: "Underqualified",
    bg: "bg-red-500/15",
    text: "text-red-400",
    border: "border-red-500/30",
    icon: <FaArrowDown className="text-[10px]" />,
  },
  employment_gap: {
    label: "Employment Gap",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/30",
    icon: <FaHistory className="text-[10px]" />,
  },
  frequent_job_changes: {
    label: "Frequent Job Changes",
    bg: "bg-orange-500/15",
    text: "text-orange-400",
    border: "border-orange-500/30",
    icon: <FaExclamationTriangle className="text-[10px]" />,
  },
  career_pivot: {
    label: "Career Pivot",
    bg: "bg-cyan-500/15",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
    icon: <FaExchangeAlt className="text-[10px]" />,
  },
  salary_expectation_risk: {
    label: "Salary Risk",
    bg: "bg-rose-500/15",
    text: "text-rose-400",
    border: "border-rose-500/30",
    icon: <FaDollarSign className="text-[10px]" />,
  },
};

export const FitFlagBadgeList: React.FC<FitFlagBadgeProps> = ({ fitFlags, size = "md" }) => {
  let parsedFlags: FitFlag[] = [];

  if (Array.isArray(fitFlags)) {
    parsedFlags = fitFlags;
  } else if (typeof fitFlags === "string" && fitFlags.trim()) {
    try {
      parsedFlags = JSON.parse(fitFlags);
    } catch (e) {
      parsedFlags = [];
    }
  }

  if (!parsedFlags || parsedFlags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {parsedFlags.map((item, idx) => {
        const config = FLAG_CONFIG[item.flag] || {
          label: item.flag,
          bg: "bg-gray-500/15",
          text: "text-gray-300",
          border: "border-gray-500/30",
          icon: <FaExclamationTriangle className="text-[10px]" />,
        };

        const isSmall = size === "sm";

        return (
          <Tooltip
            key={idx}
            title={
              item.rationale ? (
                <div className="p-1">
                  <div className="font-semibold text-white/90 mb-1 flex items-center gap-1">
                    {config.icon} {config.label} Rationale
                  </div>
                  <p className="text-white/80 text-[11px] leading-relaxed">{item.rationale}</p>
                </div>
              ) : ""
            }
            arrow
            placement="top"
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: "#1F2937",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
                  maxWidth: 280,
                },
              },
              arrow: {
                sx: {
                  color: "#1F2937",
                },
              },
            }}
          >
            <div
              className={`inline-flex items-center gap-1 rounded-lg border font-medium ${config.bg} ${config.text} ${config.border} ${
                isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
              } transition-all duration-200 hover:scale-105 cursor-help shadow-sm`}
            >
              {config.icon}
              <span>{config.label}</span>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
};
