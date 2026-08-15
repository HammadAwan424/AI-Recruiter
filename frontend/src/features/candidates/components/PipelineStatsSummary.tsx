import React from "react";
import {
  BrainCircuit,
  Gauge,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { STAGES } from "../hooks/useCandidatePipeline";
import { requiresScreening } from "../utils/evaluationStatus";

interface PipelineStatsSummaryProps {
  applications: any[];
}

type PulseTone = "neutral" | "green" | "amber" | "red" | "violet";

const pulseToneStyles: Record<PulseTone, { border: string; icon: string; value: string }> = {
  neutral: {
    border: "border-white/10",
    icon: "bg-white/7 text-white/60",
    value: "text-white",
  },
  green: {
    border: "border-[#05DC7F]/20",
    icon: "bg-[#05DC7F]/10 text-[#05DC7F]",
    value: "text-[#7af5b6]",
  },
  amber: {
    border: "border-amber-400/25",
    icon: "bg-amber-400/10 text-amber-300",
    value: "text-amber-200",
  },
  red: {
    border: "border-red-400/25",
    icon: "bg-red-400/10 text-red-300",
    value: "text-red-200",
  },
  violet: {
    border: "border-violet-400/20",
    icon: "bg-violet-400/10 text-violet-300",
    value: "text-violet-200",
  },
};

const PulseMetric: React.FC<{
  label: string;
  value: string | number;
  detail?: string;
  icon: React.ReactNode;
  tone: PulseTone;
}> = ({ label, value, detail, icon, tone }) => {
  const styles = pulseToneStyles[tone];

  return (
    <div
      className={`flex min-w-[118px] items-center gap-2 rounded-xl border bg-black/15 px-2.5 py-2 ${styles.border}`}
      title={detail || label}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-[0.11em] text-white/45">{label}</span>
        <span className={`block font-mono text-base font-extrabold leading-5 ${styles.value}`}>
          {value}
        </span>
      </span>
    </div>
  );
};

export const PipelineStatsSummary: React.FC<PipelineStatsSummaryProps> = ({ applications = [] }) => {
  if (applications.length === 0) return null;

  const countsByStage: Record<string, number> = {};
  STAGES.forEach((stage) => {
    countsByStage[stage.key] = 0;
  });

  let rejected = 0;
  let scored = 0;
  let scoreTotal = 0;

  applications.forEach((application: any) => {
    const isRejected = Boolean(
      application.disposition === "rejected"
    );

    if (isRejected) {
      rejected += 1;
    } else {
      const status = application.current_status;
      if (status && countsByStage[status] !== undefined) countsByStage[status] += 1;
    }

    const rawScore =
      application.final_score ??
      application.match_score ??
      application.screening?.match_score;
    const numericScore = rawScore == null ? null : Number(rawScore);
    if (numericScore != null && Number.isFinite(numericScore)) {
      scored += 1;
      scoreTotal += numericScore;
    }
  });

  const total = applications.length;
  const active = total - rejected;
  const pendingEvaluation = applications.filter((application) => requiresScreening(application)).length;
  const averageScore = scored > 0 ? scoreTotal / scored : 0;
  const rejectionRate = total > 0 ? ((rejected / total) * 100).toFixed(1) : "0.0";

  // A total count alone does not help much because the kanban columns already
  // show it. Keep the pulse only when it gives the recruiter a next action or
  // a meaningful performance signal.
  const hasMeaningfulInformation =
    rejected > 0 ||
    pendingEvaluation > 0 ||
    scored > 0 ||
    countsByStage.interview > 0 ||
    countsByStage.offer_approval > 0 ||
    countsByStage.offer_sent > 0 ||
    countsByStage.hired > 0;

  if (!hasMeaningfulInformation) return null;

  return (
    <section
      aria-label="Candidate pipeline pulse"
      className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-[#0e1517]/75 px-3.5 py-3 shadow-[0_0_18px_rgba(5,220,127,0.04)] sm:flex-row sm:items-center sm:justify-between sm:px-4"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#05DC7F] shadow-[0_0_8px_rgba(5,220,127,0.7)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7af5b6]">Pipeline pulse</span>
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold text-white/85">{total} candidate{total === 1 ? "" : "s"}</span>
          <span className="text-[11px] text-white/40">{active} active in the hiring flow</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <PulseMetric
          label="Total"
          value={total}
          detail={`${total} application${total === 1 ? "" : "s"} in this requisition`}
          icon={<Users size={14} />}
          tone="neutral"
        />

        {pendingEvaluation > 0 && (
          <PulseMetric
            label="Needs evaluation"
            value={pendingEvaluation}
            detail="Applications still waiting for AI parsing or screening"
            icon={<BrainCircuit size={14} />}
            tone="amber"
          />
        )}

        {scored > 0 && (
          <PulseMetric
            label="Average AI score"
            value={`${averageScore.toFixed(0)}%`}
            detail={`${scored} candidate${scored === 1 ? "" : "s"} have a screening score`}
            icon={<Gauge size={14} />}
            tone="violet"
          />
        )}

        {rejected > 0 && (
          <PulseMetric
            label="Rejected"
            value={rejected}
            detail={`${rejectionRate}% of applications rejected`}
            icon={<UserX size={14} />}
            tone="red"
          />
        )}

        {rejected > 0 && active > 0 && (
          <PulseMetric
            label="Active"
            value={active}
            detail="Candidates not currently rejected"
            icon={<UserCheck size={14} />}
            tone="green"
          />
        )}
      </div>
    </section>
  );
};

export default PipelineStatsSummary;
