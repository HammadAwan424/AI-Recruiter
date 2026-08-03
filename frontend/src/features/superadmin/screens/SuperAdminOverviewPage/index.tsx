import React from "react";
import { FaBriefcase, FaCheck, FaTimes } from "react-icons/fa";
import {
  useGetApprovedCeosQuery,
  useGetPendingCeosQuery,
  useGetInactiveCeosQuery,
  useGetRejectedCeosQuery,
} from "../../api";

export const SuperAdminOverviewPage: React.FC = () => {
  const { data: approved = [] } = useGetApprovedCeosQuery();
  const { data: pending = [] } = useGetPendingCeosQuery();
  const { data: inactive = [] } = useGetInactiveCeosQuery();
  const { data: rejected = [] } = useGetRejectedCeosQuery();

  const totalCompanies = approved.length + inactive.length + rejected.length;
  const activeCompanies = approved.length;
  const pendingRequests = pending.length;

  return (
    <div className="text-white/70 p-4 sm:p-6">
      <h2 className="text-2xl font-semibold mb-6 text-white">System Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="flex justify-between items-center p-5 rounded-2xl backdrop-blur-sm border border-[#05DC7F]/25 shadow-[0_0_10px_rgba(5,220,127,0.25)] hover:border-[#05DC7F]/45 transition-all">
          <div>
            <p className="text-gray-400 text-sm">Total Companies</p>
            <h3 className="text-3xl font-bold text-white mt-2">{totalCompanies}</h3>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#05DC7F]/15 border border-[#05DC7F]/40 text-[#05DC7F] text-xl">
            <FaBriefcase />
          </div>
        </div>

        <div className="flex justify-between items-center p-5 rounded-2xl backdrop-blur-sm border border-[#05DC7F]/25 shadow-[0_0_10px_rgba(5,220,127,0.25)] hover:border-[#05DC7F]/45 transition-all">
          <div>
            <p className="text-gray-400 text-sm">Active Companies</p>
            <h3 className="text-3xl font-bold text-[#05DC7F] mt-2">{activeCompanies}</h3>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#05DC7F]/15 border border-[#05DC7F]/40 text-[#05DC7F] text-xl">
            <FaCheck />
          </div>
        </div>

        <div className="flex justify-between items-center p-5 rounded-2xl backdrop-blur-sm border border-[#05DC7F]/25 shadow-[0_0_10px_rgba(5,220,127,0.25)] hover:border-[#05DC7F]/45 transition-all">
          <div>
            <p className="text-gray-400 text-sm">Pending Requests</p>
            <h3 className="text-3xl font-bold text-yellow-400 mt-2">{pendingRequests}</h3>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#05DC7F]/15 border border-[#05DC7F]/40 text-[#05DC7F] text-xl">
            <FaTimes />
          </div>
        </div>
      </div>
    </div>
  );
};
