import React, { useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import { Sidebar, NAV_ITEMS } from "./Sidebar";
import { HRChatbot } from "../../shared/components/HRChatbot";
import logo from "../../images/logo.png";

interface AppLayoutProps {
  children?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Real user name & role from localStorage
  const fullName = localStorage.getItem("full_name") || "User";
  const userRole = localStorage.getItem("role") || "ceo";
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const currentNavItem = NAV_ITEMS.find((item) => item.path === location.pathname);
  const activeTitle = currentNavItem ? currentNavItem.name : "Job Requisitions";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("company_id");
    localStorage.removeItem("user_id");
    localStorage.removeItem("full_name");
    navigate("/");
  };

  return (
    <div className="relative w-full h-screen flex overflow-hidden bg-transparent">
      {/* BASE BACKGROUND COLOR */}
      <div className="absolute inset-0 -z-20 bg-[#1F1F1F]" />

      {/* NEON GLOW GRADIENT */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(5,220,127,0.05) 0%, transparent 70%),
            radial-gradient(circle at 70% 20%, rgba(5,220,127,0.04) 0%, transparent 70%),
            radial-gradient(circle at 50% 50%, rgba(5,220,127,0.03) 0%, transparent 80%)
          `,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          filter: "blur(100px)",
        }}
      />

      {/* DESKTOP SIDEBAR */}
      <aside
        className="
          hidden md:flex
          fixed left-0 top-0 h-full w-64
          backdrop-blur-sm
          border-r border-[#05DC7F]/30
          flex flex-col
        "
      >
        {/* BRAND LOGO */}
        <div className="h-32 flex items-center justify-center border-b border-[#05DC7F]/25">
          <div className="w-28 h-28 rounded-full flex items-center justify-center shadow-[0_0_18px_rgba(5,220,127,0.35)] hover:scale-105 transition-transform duration-300">
            <img
              src={logo}
              alt="AGENTRA Logo"
              className="w-24 h-24 object-contain"
            />
          </div>
        </div>

        {/* SIDEBAR NAVIGATION ITEMS */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <Sidebar />
        </div>

        {/* FOOTER */}
        <div className="h-12 flex items-center justify-center border-t border-[#05DC7F]/25 text-[#05DC7F]/45 text-xs font-semibold tracking-wider">
          © 2026 AGENTRA AI
        </div>
      </aside>

      {/* MOBILE SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1F1F1F] backdrop-blur-sm border-r border-[#05DC7F]/30 transform transition-transform duration-300 md:hidden ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-32 flex items-center justify-center border-b border-[#05DC7F]/25">
          <div className="w-28 h-28 rounded-full flex items-center justify-center shadow-[0_0_18px_rgba(5,220,127,0.35)] hover:scale-105 transition-transform duration-300">
            <img
              src={logo}
              alt="AGENTRA Logo"
              className="w-28 h-28 object-contain"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <Sidebar onNavClick={() => setMobileSidebarOpen(false)} />
        </div>

        <div className="h-12 flex items-center justify-center border-t border-[#05DC7F]/25 text-[#05DC7F]/45 text-xs font-semibold">
          © 2026 AGENTRA AI
        </div>
      </aside>

      {/* Mobile Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto p-6 md:ml-64">
        {/* Mobile Hamburger */}
        <div className="md:hidden mb-2">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="text-white text-2xl"
          >
            ☰
          </button>
        </div>

        {/* TOP NAVBAR HEADER */}
        <div className="flex justify-between items-center mb-6 p-4 rounded-xl border border-[#05DC7F]/35 shadow-[0_0_10px_rgba(5,220,127,0.35)] backdrop-blur-sm flex-wrap md:flex-nowrap">
          <h2 className="text-[#05DC7F] text-xl font-semibold tracking-wider whitespace-nowrap">
            {activeTitle}
          </h2>

          <div className="flex items-center gap-4 mt-2 md:mt-0">
            <div className="text-right">
              <p className="text-[#05DC7F] font-medium">{fullName}</p>
              <p className="text-white/55 text-xs uppercase">{userRole} / Administrator</p>
            </div>

            <div className="w-10 h-10 rounded-full bg-[#05DC7F] text-black font-bold flex items-center justify-center shadow-[0_0_10px_rgba(5,220,127,0.4)]">
              {initials}
            </div>

            <button
              onClick={handleLogout}
              className="text-[#05DC7F]/65 hover:text-white transition"
              title="Logout"
            >
              <FaSignOutAlt size={22} />
            </button>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="flex-1 mt-2">{children || <Outlet />}</div>
      </main>

      {/* GLOBAL HR CHATBOT */}
      <HRChatbot />
    </div>
  );
};
