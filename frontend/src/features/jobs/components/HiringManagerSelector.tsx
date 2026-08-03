import React from "react";
import { CompanyUser } from "../../../shared/types/user.types";
import { useGetCompanyUsersQuery } from "../../users/api";
import { UserCheck, ShieldAlert, X } from "lucide-react";

interface HiringManagerSelectorProps {
  selectedId: number | null;
  companyUsers?: CompanyUser[];
  onChange: (userId: number | null) => void;
  disabled?: boolean;
}

export const HiringManagerSelector: React.FC<HiringManagerSelectorProps> = ({
  selectedId,
  companyUsers: propCompanyUsers,
  onChange,
  disabled = false,
}) => {
  // Query backend role-filtered hiring managers (/users?role=hiring_manager)
  const { data: roleFilteredData } = useGetCompanyUsersQuery("hiring_manager");
  const { data: allUsersData } = useGetCompanyUsersQuery();

  const fetchedRoleUsers = roleFilteredData?.users || [];
  const allCompanyUsers = propCompanyUsers || allUsersData?.users || [];

  // Candidate pool prioritizing role="hiring_manager" or "hr_manager"
  const eligibleManagers = fetchedRoleUsers.length > 0
    ? fetchedRoleUsers
    : allCompanyUsers.filter((u) => u.role === "hiring_manager" || u.role === "hr_manager");

  const managerList = eligibleManagers.length > 0 ? eligibleManagers : allCompanyUsers;
  const selectedManager = allCompanyUsers.find((u) => u.id === selectedId);

  return (
    <div className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <UserCheck size={16} className="text-[#05DC7F]" /> Assigned Hiring Manager (Max 1)
        </label>
        {!disabled && selectedManager && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1 transition"
          >
            <X size={13} /> Clear Assignment
          </button>
        )}
      </div>

      {selectedManager ? (
        <div className="p-3 rounded-lg bg-black/60 border border-[#05DC7F]/40 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#05DC7F]/20 text-[#05DC7F] font-bold text-xs flex items-center justify-center border border-[#05DC7F]/40">
              {selectedManager.full_name?.charAt(0).toUpperCase() || "H"}
            </div>
            <div>
              <p className="text-white text-xs font-semibold">{selectedManager.full_name}</p>
              <p className="text-gray-400 text-[11px]">{selectedManager.email} • <span className="uppercase text-[#05DC7F] font-bold">{selectedManager.role}</span></p>
            </div>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <select
            value={selectedId || ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            disabled={disabled}
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/80 border border-gray-700 text-white text-xs focus:outline-none focus:border-[#05DC7F] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">-- Assign a Hiring Manager --</option>
            {managerList.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name} ({user.email}) - {user.role.toUpperCase()}
              </option>
            ))}
          </select>
          <span className="text-gray-400 text-[11px] flex items-center gap-1 italic">
            <ShieldAlert size={12} className="text-amber-400" /> Only 1 Hiring Manager can be assigned per requisition.
          </span>
        </div>
      )}
    </div>
  );
};
