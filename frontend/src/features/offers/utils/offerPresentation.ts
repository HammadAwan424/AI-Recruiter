/**
 * Centralized permissions and presentation resolver for the Offer Management feature.
 * Encapsulates all permission-dependent text, tooltips, and read-only states.
 */

export interface OfferAccessDescriptor {
  canGenerate: boolean;
  canApprove: boolean;

  // Offer Creation Tab
  creationNotice: string | null;
  creationButtonLabel: string;
  creationButtonTooltip: string;

  // Offer Approvals Tab
  approvalCardActionLabel: string;
  approvalCardActionVariant: "primary" | "readOnly";
  approvalDetailNotice: string | null;
  approvalDetailActionLabel: string | null;
}

export function getOfferAccessDescriptor(
  hasPermission: (permissionKey: string) => boolean
): OfferAccessDescriptor {
  const canGenerate = hasPermission("offer:generate");
  const canApprove = hasPermission("offer:approve");

  return {
    canGenerate,
    canApprove,
    creationNotice: canGenerate
      ? null
      : "You do not have permission to create or request approval for job offers (Requires 'offer:generate' permission).",
    creationButtonLabel: canGenerate ? "Request Approval" : "Offer Generation Restricted",
    creationButtonTooltip: canGenerate
      ? "Submit drafted offer package for executive review"
      : "You lack the 'offer:generate' permission required to create offer packages.",
    approvalCardActionLabel: canApprove ? "Inspect & Approve Offer" : "Inspect Offer (Read-Only)",
    approvalCardActionVariant: canApprove ? "primary" : "readOnly",
    approvalDetailNotice: canApprove
      ? null
      : "Read-Only View (Requires 'offer:approve' permission to approve & dispatch offers).",
    approvalDetailActionLabel: canApprove ? "Approve & Send Offer" : null,
  };
}
