import React from "react";
import { CompanyUser } from "../../../shared/types/user.types";
import { useGetCompanyUsersQuery } from "../../users/api";
import { Users, X } from "lucide-react";

interface RecruiterSelectorProps {
  selectedIds: number[];
  companyUsers?: CompanyUser[];
  onChange: (userIds: number[]) => void;
  disabled?: boolean;
}

export const RecruiterSelector: React.FC<RecruiterSelectorProps> = ({
  selectedIds,
  companyUsers: propCompanyUsers,
  onChange,
  disabled = false,
}) => {
  // Query backend role-filtered recruiters (/users?role=recruiter)
  const { data: roleFilteredData } = useGetCompanyUsersQuery("recruiter");
  const { data: allUsersData } = useGetCompanyUsersQuery();

  const fetchedRoleUsers = roleFilteredData?.users || [];
  const allCompanyUsers = propCompanyUsers || allUsersData?.users || [];

  const eligibleRecruiters = fetchedRoleUsers.length > 0
    ? fetchedRoleUsers
    : allCompanyUsers.filter((u) => u.role === "recruiter");

  const recruiterList = eligibleRecruiters.length > 0 ? eligibleRecruiters : allCompanyUsers;
  const selectedUsers = allCompanyUsers.filter((u) => selectedIds.includes(u.id));

  const handleToggleUser = (userId: number) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  const handleRemoveUser = (userId: number) => {
    onChange(selectedIds.filter((id) => id !== userId));
  };

  return (
    <div className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Users size={16} className="text-[#05DC7F]" /> Assigned Recruiters ({selectedIds.length})
        </label>
        {!disabled && selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-gray-400 hover:text-red-400 transition"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Selected Recruiter Chips */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2.5 rounded-lg bg-black/60 border border-gray-800">
          {selectedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#05DC7F]/15 border border-[#05DC7F]/30 text-white text-xs font-medium"
            >
              <span>{user.full_name} ({user.role.toUpperCase()})</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveUser(user.id)}
                  className="text-gray-400 hover:text-white p-0.5 rounded-full hover:bg-gray-800 transition"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Multi-Select Dropdown Selector Filtered for Recruiters */}
      <select
        value=""
        onChange={(e) => {
          if (e.target.value) {
            handleToggleUser(Number(e.target.value));
          }
        }}
        disabled={disabled}
        className="w-full px-3.5 py-2.5 rounded-xl bg-black/80 border border-gray-700 text-white text-xs focus:outline-none focus:border-[#05DC7F] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">+ Assign Recruiter...</option>
        {recruiterList.map((user) => {
          const isSelected = selectedIds.includes(user.id);
          return (
            <option key={user.id} value={user.id} disabled={isSelected}>
              {isSelected ? "✓ " : ""}{user.full_name} ({user.email}) - {user.role.toUpperCase()}
            </option>
          );
        })}
      </select>
    </div>
  );
};
