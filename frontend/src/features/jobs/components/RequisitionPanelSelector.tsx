import React from "react";
import { CompanyUser } from "../../../shared/types/user.types";
import { useGetCompanyUsersQuery } from "../../users/api";
import { UserCheck, Users, ShieldAlert, X } from "lucide-react";

interface RequisitionPanelSelectorProps {
  hiringManagerId: number | null;
  recruiterIds: number[];
  companyUsers?: CompanyUser[];
  onHiringManagerChange: (userId: number | null) => void;
  onRecruitersChange: (userIds: number[]) => void;
  disabled?: boolean;
}

export const RequisitionPanelSelector: React.FC<RequisitionPanelSelectorProps> = ({
  hiringManagerId,
  recruiterIds,
  companyUsers: propCompanyUsers,
  onHiringManagerChange,
  onRecruitersChange,
  disabled = false,
}) => {
  // Query backend role-filtered users
  const { data: hmRoleData } = useGetCompanyUsersQuery("hiring_manager");
  const { data: recruiterRoleData } = useGetCompanyUsersQuery("recruiter");
  const { data: allUsersData } = useGetCompanyUsersQuery();

  const allCompanyUsers = propCompanyUsers || allUsersData?.users || [];

  // Eligible Hiring Managers
  const eligibleManagers = (hmRoleData?.users && hmRoleData.users.length > 0)
    ? hmRoleData.users
    : allCompanyUsers.filter((u) => u.role === "hiring_manager" || u.role === "hr_manager");
  const managerList = eligibleManagers.length > 0 ? eligibleManagers : allCompanyUsers;
  const selectedManager = allCompanyUsers.find((u) => u.id === hiringManagerId);

  // Eligible Recruiters
  const eligibleRecruiters = (recruiterRoleData?.users && recruiterRoleData.users.length > 0)
    ? recruiterRoleData.users
    : allCompanyUsers.filter((u) => u.role === "recruiter");
  const recruiterList = eligibleRecruiters.length > 0 ? eligibleRecruiters : allCompanyUsers;
  const selectedRecruiters = allCompanyUsers.filter((u) => recruiterIds.includes(u.id));

  const handleToggleRecruiter = (userId: number) => {
    if (recruiterIds.includes(userId)) {
      onRecruitersChange(recruiterIds.filter((id) => id !== userId));
    } else {
      onRecruitersChange([...recruiterIds, userId]);
    }
  };

  const handleRemoveRecruiter = (userId: number) => {
    onRecruitersChange(recruiterIds.filter((id) => id !== userId));
  };

  return (
    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md flex flex-col gap-4">
      <TypographyHeader title="Assigned Requisition Panel" />

      {/* ── SECTION 1: HIRING MANAGER ASSIGNMENT ── */}
      <div className="flex flex-col gap-2.5">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <UserCheck size={16} className="text-[#05DC7F]" /> Hiring Manager (Max 1)
          </label>
          {!disabled && selectedManager && (
            <button
              type="button"
              onClick={() => onHiringManagerChange(null)}
              className="text-[11px] text-gray-400 hover:text-red-400 transition"
            >
              Clear Manager
            </button>
          )}
        </div>

        {selectedManager ? (
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-[#05DC7F]/40 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#05DC7F]/20 text-[#05DC7F] font-bold text-xs flex items-center justify-center border border-[#05DC7F]/40">
                {selectedManager.full_name?.charAt(0).toUpperCase() || "H"}
              </div>
              <div>
                <p className="text-white text-xs font-semibold">{selectedManager.full_name}</p>
                <p className="text-gray-400 text-[10px]">{selectedManager.email} • <span className="uppercase text-[#05DC7F] font-bold">{selectedManager.role}</span></p>
              </div>
            </div>

            {!disabled && (
              <button
                type="button"
                onClick={() => onHiringManagerChange(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <select
              value={hiringManagerId || ""}
              onChange={(e) => onHiringManagerChange(e.target.value ? Number(e.target.value) : null)}
              disabled={disabled}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/15 text-white text-xs backdrop-blur-md focus:outline-none focus:border-[#05DC7F] focus:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <option value="" className="bg-zinc-900 text-white">-- Select Hiring Manager --</option>
              {managerList.map((user) => (
                <option key={user.id} value={user.id} className="bg-zinc-900 text-white">
                  {user.full_name} ({user.email}) - {user.role.toUpperCase()}
                </option>
              ))}
            </select>
            <span className="text-gray-400 text-[10px] flex items-center gap-1 italic">
              <ShieldAlert size={11} className="text-amber-400" /> Only 1 Hiring Manager can be assigned per job.
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-white/5" />

      {/* ── SECTION 2: RECRUITERS PANEL ASSIGNMENT ── */}
      <div className="flex flex-col gap-2.5">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users size={16} className="text-[#05DC7F]" /> Recruiters Panel ({recruiterIds.length})
          </label>
          {!disabled && recruiterIds.length > 0 && (
            <button
              type="button"
              onClick={() => onRecruitersChange([])}
              className="text-[11px] text-gray-400 hover:text-red-400 transition"
            >
              Clear All Recruiters
            </button>
          )}
        </div>

        {selectedRecruiters.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
            {selectedRecruiters.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#05DC7F]/15 border border-[#05DC7F]/30 text-white text-xs font-medium"
              >
                <span>{user.full_name} ({user.role.toUpperCase()})</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRecruiter(user.id)}
                    className="text-gray-400 hover:text-white p-0.5 rounded-full hover:bg-gray-800 transition"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <select
          value=""
          onChange={(e) => {
            if (e.target.value) {
              handleToggleRecruiter(Number(e.target.value));
            }
          }}
          disabled={disabled}
          className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/15 text-white text-xs backdrop-blur-md focus:outline-none focus:border-[#05DC7F] focus:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <option value="" className="bg-zinc-900 text-white">+ Add Recruiter to Panel...</option>
          {recruiterList.map((user) => {
            const isSelected = recruiterIds.includes(user.id);
            return (
              <option key={user.id} value={user.id} disabled={isSelected} className="bg-zinc-900 text-white">
                {isSelected ? "✓ " : ""}{user.full_name} ({user.email}) - {user.role.toUpperCase()}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
};

const TypographyHeader = ({ title }: { title: string }) => (
  <div className="flex items-center justify-between border-b border-white/10 pb-2">
    <p className="text-xs font-bold text-[#05DC7F] uppercase tracking-wider">{title}</p>
    <p className="text-[11px] text-gray-400">Assigned Team Permissions</p>
  </div>
);

export default RequisitionPanelSelector;
