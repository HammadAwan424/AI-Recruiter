import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileCheck2,
  Inbox,
  Info,
  MailCheck,
  RefreshCw,
  Route,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react";
import type { JobPost } from "../../../shared/types/job.types";
import type {
  FetchApplicationsResponse,
  JobApplicationSyncSummary,
} from "../../../shared/types/candidate.types";

export type PipelineSyncMode = "fetch" | "fetch_and_evaluate";
export type PipelineEvaluationStatus = "not_run" | "running" | "completed" | "failed";

interface PipelineSyncReportProps {
  report: FetchApplicationsResponse;
  jobs: JobPost[];
  mode: PipelineSyncMode;
  evaluationStatus: PipelineEvaluationStatus;
  onDismiss?: () => void;
}

type Tone = "cyan" | "green" | "violet" | "amber" | "red";

const toneStyles: Record<Tone, { border: string; icon: string; value: string }> = {
  cyan: {
    border: "border-cyan-400/20",
    icon: "text-cyan-300 bg-cyan-400/10",
    value: "text-cyan-200",
  },
  green: {
    border: "border-[#05DC7F]/25",
    icon: "text-[#05DC7F] bg-[#05DC7F]/10",
    value: "text-[#7af5b6]",
  },
  violet: {
    border: "border-violet-400/20",
    icon: "text-violet-300 bg-violet-400/10",
    value: "text-violet-200",
  },
  amber: {
    border: "border-amber-400/25",
    icon: "text-amber-300 bg-amber-400/10",
    value: "text-amber-200",
  },
  red: {
    border: "border-red-400/25",
    icon: "text-red-300 bg-red-400/10",
    value: "text-red-200",
  },
};

const formatCount = (value: number, singular: string, plural = `${singular}s`) =>
  `${value} ${value === 1 ? singular : plural}`;

const getJobName = (summary: JobApplicationSyncSummary, jobs: JobPost[]) => {
  const job = jobs.find((candidateJob) => candidateJob.id === summary.job_id);
  return job?.title || `Job #${summary.job_id}`;
};

const getJobContext = (summary: JobApplicationSyncSummary, jobs: JobPost[]) => {
  const job = jobs.find((candidateJob) => candidateJob.id === summary.job_id);
  return job?.department ? `${job.department} · Job #${summary.job_id}` : `Job #${summary.job_id}`;
};

const getMailboxSummary = (report: FetchApplicationsResponse) => {
  if (report.total_fetched === 0) return "No new emails were found since the last sync.";

  return `${formatCount(report.total_fetched, "email")} reviewed after duplicate message IDs were removed.`;
};

const getRoutingSummary = (report: FetchApplicationsResponse) => {
  if (report.total_fetched === 0) return "There was nothing new to match to an open job.";
  if (report.classified_count === 0) return "No email could be confidently matched to an open job.";

  const matched = `${formatCount(report.classified_count, "email")} matched to an open job`;
  return report.unmatched_count > 0
    ? `${matched}; ${formatCount(report.unmatched_count, "email")} need review.`
    : `${matched}.`;
};

const getApplicationSummary = (report: FetchApplicationsResponse) => {
  if (report.total_saved === 0) return "No candidate records were added or updated.";

  const changes: string[] = [];
  if (report.new_applications > 0) {
    changes.push(`${formatCount(report.new_applications, "new candidate")} added`);
  }
  if (report.renewed_applications > 0) {
    changes.push(`${formatCount(report.renewed_applications, "existing application")} refreshed`);
  }

  return changes.length > 0 ? `${changes.join(" and ")}.` : "Candidate applications were saved successfully.";
};

const getCompactSummary = (report: FetchApplicationsResponse) => {
  if (report.total_fetched === 0) return "No new emails found since the last sync.";

  const summary = `${formatCount(report.total_fetched, "email")} reviewed · ${formatCount(report.total_saved, "application")} updated (${report.new_applications} new, ${report.renewed_applications} existing refreshed)`;
  const reviewCount = report.unmatched_count + report.failed_upsert_count;
  return reviewCount > 0 ? `${summary} · ${reviewCount} need review` : summary;
};

const MetricCard: React.FC<{
  label: string;
  value: number;
  detail: string;
  icon: React.ReactNode;
  tone: Tone;
  helpText?: string;
}> = ({ label, value, detail, icon, tone, helpText }) => {
  const styles = toneStyles[tone];

  return (
    <div className={`rounded-2xl border ${styles.border} bg-black/20 p-3.5`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
          {label}
          {helpText && (
            <span title={helpText} aria-label={helpText} className="cursor-help text-white/35">
              <Info size={12} />
            </span>
          )}
        </span>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${styles.icon}`}>{icon}</span>
      </div>
      <div className={`mt-2 font-mono text-2xl font-extrabold ${styles.value}`}>{value}</div>
      <p className="mt-1 text-[11px] leading-4 text-white/45">{detail}</p>
    </div>
  );
};

export const PipelineSyncReport: React.FC<PipelineSyncReportProps> = ({
  report,
  jobs,
  mode,
  evaluationStatus,
  onDismiss,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const failedCount = report.failed_upsert_count;
  const hasIssues = report.unmatched_count > 0 || failedCount > 0 || evaluationStatus === "failed";
  const updatedJobCount = report.job_summaries.length;

  useEffect(() => {
    // Every new fetch starts as a quiet status update. The detailed report is
    // still one click away, but it should not push the board down by default.
    setIsExpanded(false);
  }, [report]);

  const statusLabel = evaluationStatus === "running"
    ? "AI evaluation running"
    : hasIssues
      ? "Completed with notes"
      : "Completed";

  const reportTitle = mode === "fetch_and_evaluate" && evaluationStatus === "completed"
    ? "Inbox synced and candidates evaluated"
    : "Inbox sync complete";

  return (
    <section
      aria-live="polite"
      aria-label="Gmail fetch results"
      className="overflow-hidden rounded-3xl border border-[#05DC7F]/20 bg-gradient-to-br from-[#101916] via-[#0d1110] to-[#0b0d10] shadow-[0_0_24px_rgba(5,220,127,0.08)]"
    >
      <div className="bg-gradient-to-r from-[#05DC7F]/8 via-transparent to-cyan-400/5 px-4 py-3.5 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#05DC7F]/30 bg-[#05DC7F]/10 text-[#05DC7F]">
              {hasIssues ? <TriangleAlert size={18} /> : <MailCheck size={18} />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7af5b6]">
                  Gmail sync
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    hasIssues
                      ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                      : "border-[#05DC7F]/25 bg-[#05DC7F]/10 text-[#7af5b6]"
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
              <h3 className="mt-0.5 truncate text-sm font-bold tracking-tight text-white sm:text-base">{reportTitle}</h3>
              <p className="mt-1 max-w-3xl text-[11px] leading-4 text-white/50">{getCompactSummary(report)}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setIsExpanded((expanded) => !expanded)}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-white/65 transition hover:border-[#05DC7F]/30 hover:bg-[#05DC7F]/10 hover:text-white"
              aria-expanded={isExpanded}
              aria-controls="gmail-sync-report-details"
            >
              {isExpanded ? "Hide details" : "View details"}
              <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            </button>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="rounded-lg px-2 py-1.5 text-[11px] text-white/40 transition hover:bg-white/8 hover:text-white/80"
                aria-label="Dismiss Gmail sync report"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
      <div id="gmail-sync-report-details" className="space-y-5 border-t border-white/8 p-5 sm:p-6">
        <p className="-mt-1 max-w-3xl text-xs leading-5 text-white/55">{getMailboxSummary(report)} {getApplicationSummary(report)}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <MetricCard
            label="Emails reviewed"
            value={report.total_fetched}
            detail={getMailboxSummary(report)}
            icon={<Inbox size={15} />}
            tone="cyan"
            helpText="Messages with IDs already seen by the system were skipped before their contents were processed."
          />
          <MetricCard
            label="Matched to jobs"
            value={report.classified_count}
            detail={getRoutingSummary(report)}
            icon={<Route size={15} />}
            tone="violet"
            helpText="The AI compares each email's subject and body with the company's open jobs."
          />
          <MetricCard
            label="Applications updated"
            value={report.total_saved}
            detail={getApplicationSummary(report)}
            icon={<Users size={15} />}
            tone="green"
            helpText="This includes both new applications and existing candidate applications refreshed with a newer email."
          />
          <MetricCard
            label="New applications"
            value={report.new_applications}
            detail={`${formatCount(report.new_applications, "candidate")} added to the hiring board`}
            icon={<Sparkles size={15} />}
            tone="green"
          />
          <MetricCard
            label="Existing refreshed"
            value={report.renewed_applications}
            detail={`${formatCount(report.renewed_applications, "application")} updated with a newer email`}
            icon={<RefreshCw size={15} />}
            tone="amber"
            helpText="A newer message from the same candidate for the same job updated the existing application instead of creating a duplicate."
          />
        </div>

        {updatedJobCount > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-white/65">Job routing breakdown</h4>
                <p className="mt-1 text-[11px] text-white/40">Only jobs that received a candidate update are listed</p>
              </div>
              <FileCheck2 size={16} className="text-[#05DC7F]/70" />
            </div>

            <div className="space-y-2">
              {report.job_summaries.map((summary) => (
                <div
                  key={summary.job_id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-black/15 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white/85">{getJobName(summary, jobs)}</div>
                    <div className="mt-0.5 text-[11px] text-white/40">{getJobContext(summary, jobs)}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold">
                    <span className="rounded-full bg-[#05DC7F]/10 px-2 py-1 text-[#7af5b6]">
                      {summary.total_saved} application{summary.total_saved === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-cyan-200">
                      {summary.new_applications} new
                    </span>
                    <span className="rounded-full bg-amber-400/10 px-2 py-1 text-amber-200">
                      {summary.renewed_applications} refreshed
                    </span>
                    {summary.failed_upserts > 0 && (
                      <span className="rounded-full bg-red-400/10 px-2 py-1 text-red-200">
                        {summary.failed_upserts} not saved
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {report.unmatched_count > 0 || failedCount > 0 || evaluationStatus === "failed" ? (
          <div className="flex items-start gap-2.5 rounded-2xl border border-amber-400/20 bg-amber-400/6 p-3 text-xs text-amber-100/80">
            <TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-300" />
            <div>
              <span className="font-semibold text-amber-200">Review notes: </span>
              {report.unmatched_count > 0 && (
                <span>{formatCount(report.unmatched_count, "email")} could not be confidently matched to an open job. </span>
              )}
              {failedCount > 0 && (
                <span>{formatCount(failedCount, "candidate application save", "candidate application saves")} failed; these can be retried on the next sync. </span>
              )}
              {evaluationStatus === "failed" && (
                <span>AI evaluation did not finish; use the evaluation action to retry parsing and screening.</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-2xl border border-[#05DC7F]/15 bg-[#05DC7F]/5 p-3 text-xs text-[#b8fbd4]">
            <CheckCircle2 size={16} className="shrink-0 text-[#05DC7F]" />
            {report.total_fetched === 0
              ? "No new emails were found. The candidate board is already up to date."
              : "All reviewed emails were matched to a job and candidate changes were saved successfully."}
          </div>
        )}

        {evaluationStatus === "running" && (
          <div className="flex items-center gap-2 text-[11px] text-cyan-200/80">
            <Clock3 size={14} />
            The report will update when AI parsing and screening finish.
          </div>
        )}
      </div>
      )}
    </section>
  );
};

export default PipelineSyncReport;
