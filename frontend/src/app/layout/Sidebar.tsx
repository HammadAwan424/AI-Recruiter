import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBriefcase,
  FaCalendarCheck,
  FaFileContract,
  FaUserShield,
} from "react-icons/fa";
import { LuSettings2 as LuSettingsIcon } from "react-icons/lu";
import { MdOutlineTouchApp as MdTouchIcon } from "react-icons/md";
import { usePermission } from "../../shared/hooks/usePermission";
import { PermissionKey } from "../../shared/types/role.types";

export interface NavItemConfig {
  name: string;
  path: string;
  icon: React.ReactNode;
  permission?: PermissionKey;
}

interface SidebarProps {
  onNavClick?: () => void;
}

export const NAV_ITEMS: NavItemConfig[] = [
  { name: "Dashboard", path: "/ceo/dashboard", icon: <FaTachometerAlt size={20} /> },
  { name: "Team & Permissions", path: "/ceo/users", icon: <FaUserShield size={20} />, permission: "change_permissions" },
  { name: "Job Requisitions", path: "/jobs", icon: <FaBriefcase size={20} />, permission: "create_requisition" },
  { name: "Candidate Pipeline", path: "/candidates", icon: <MdTouchIcon size={20} />, permission: "disposition_candidate" },
  { name: "Interviews", path: "/interviews", icon: <FaCalendarCheck size={20} />, permission: "create_interview" },
  { name: "Offer Letters", path: "/offers", icon: <FaFileContract size={20} />, permission: "create_offer" },
  { name: "Settings", path: "/settings", icon: <LuSettingsIcon size={20} /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ onNavClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  const handleSelect = (path: string) => {
    navigate(path);
    if (onNavClick) onNavClick();
  };

  return (
    <>
      {filteredNavItems.map((item) => {
        const isActive = location.pathname === item.path;

        return (
          <button
            key={item.path}
            onClick={() => handleSelect(item.path)}
            className={`flex items-center w-full gap-3 p-3 mb-2 rounded-xl transition-all duration-300 ${
              isActive
                ? "text-[#05DC7F] border border-[#05DC7F]/45 shadow-[0_0_10px_rgba(5,220,127,0.4)]"
                : "text-white/65 hover:text-[#05DC7F] hover:shadow-[0_0_8px_rgba(5,220,127,0.35)]"
            }`}
          >
            {item.icon}
            <span className="tracking-wide whitespace-nowrap text-sm">
              {item.name}
            </span>
          </button>
        );
      })}
    </>
  );
};
