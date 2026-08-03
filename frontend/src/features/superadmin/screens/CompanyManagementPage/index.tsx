import React, { useState } from "react";
import {
  useGetApprovedCeosQuery,
  useGetPendingCeosQuery,
  useGetInactiveCeosQuery,
  useApproveCeoMutation,
  useRejectCeoMutation,
  useDeactivateCeoMutation,
  useActivateCeoMutation,
  useDeleteCeoMutation,
} from "../../api";

export const CompanyManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"Active" | "Inactive" | "Requests">("Active");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { data: approved = [], isLoading: loadingApproved } = useGetApprovedCeosQuery();
  const { data: pending = [], isLoading: loadingPending } = useGetPendingCeosQuery();
  const { data: inactive = [], isLoading: loadingInactive } = useGetInactiveCeosQuery();

  const [approveCeo] = useApproveCeoMutation();
  const [rejectCeo] = useRejectCeoMutation();
  const [deactivateCeo] = useDeactivateCeoMutation();
  const [activateCeo] = useActivateCeoMutation();
  const [deleteCeo] = useDeleteCeoMutation();

  const companies = activeTab === "Active" ? approved : activeTab === "Inactive" ? inactive : pending;
  const isLoading = activeTab === "Active" ? loadingApproved : activeTab === "Inactive" ? loadingInactive : loadingPending;

  const totalPages = Math.ceil(companies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCompanies = companies.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure? This CEO will be permanently deleted!")) return;
    try {
      await deleteCeo(id).unwrap();
    } catch (err: any) {
      alert("Could not delete CEO");
    }
  };

  return (
    <div className="text-white/70 p-4 sm:p-6">
      <div className="flex gap-4 mb-6 border-b border-[#05DC7F]/25 pb-2">
        {(["Active", "Inactive", "Requests"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-t-lg transition flex items-center gap-2 ${
              activeTab === tab ? "bg-[#05DC7F] text-black font-semibold" : "hover:bg-[#05DC7F]/20 text-white/70"
            }`}
          >
            {tab}
            {tab === "Requests" && pending.length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center text-[#05DC7F] py-10">Loading companies...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#05DC7F]/25 backdrop-blur-sm">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-[#0A0F18]">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400 uppercase">CEO Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400 uppercase">Status</th>
                {activeTab === "Active" && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400 uppercase">Days Left</th>}
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {currentCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">No companies found.</td>
                </tr>
              ) : (
                currentCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-[#05DC7F]/10 transition">
                    <td className="px-6 py-4 font-semibold text-white">{company.company_name}</td>
                    <td className="px-6 py-4">{company.full_name}</td>
                    <td className="px-6 py-4 text-gray-400">{company.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        activeTab === "Active" ? "bg-[#05DC7F]/20 text-[#05DC7F]" : activeTab === "Inactive" ? "bg-gray-500/20 text-gray-400" : "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {activeTab}
                      </span>
                    </td>
                    {activeTab === "Active" && (
                      <td className="px-6 py-4 font-mono text-sm text-[#05DC7F]">
                        {company.days_left ?? "—"}
                      </td>
                    )}
                    <td className="px-6 py-4 text-right space-x-2">
                      {activeTab === "Active" && (
                        <>
                          <button onClick={() => deactivateCeo(company.id)} className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 text-xs">Set Inactive</button>
                          <button onClick={() => handleDelete(company.id)} className="px-3 py-1 rounded-lg bg-red-700/30 text-red-400 border border-red-700/40 text-xs">Delete</button>
                        </>
                      )}
                      {activeTab === "Inactive" && (
                        <>
                          <button onClick={() => activateCeo(company.id)} className="px-3 py-1 rounded-lg bg-[#05DC7F]/20 text-[#05DC7F] border border-[#05DC7F]/40 text-xs">Set Active</button>
                          <button onClick={() => handleDelete(company.id)} className="px-3 py-1 rounded-lg bg-red-700/30 text-red-400 border border-red-700/40 text-xs">Delete</button>
                        </>
                      )}
                      {activeTab === "Requests" && (
                        <>
                          <button onClick={() => approveCeo(company.id)} className="px-3 py-1 rounded-lg bg-[#05DC7F] text-black text-xs font-semibold">Approve</button>
                          <button onClick={() => rejectCeo(company.id)} className="px-3 py-1 rounded-lg bg-red-500 text-white text-xs font-semibold">Reject</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-end items-center gap-2 mt-4 text-gray-300 text-sm">
          <button onClick={() => setCurrentPage(1)} className="px-2 py-1 hover:bg-[#05DC7F]/20 rounded">«</button>
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="px-2 py-1 hover:bg-[#05DC7F]/20 rounded">‹</button>
          <span className="px-3">Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="px-2 py-1 hover:bg-[#05DC7F]/20 rounded">›</button>
          <button onClick={() => setCurrentPage(totalPages)} className="px-2 py-1 hover:bg-[#05DC7F]/20 rounded">»</button>
        </div>
      )}
    </div>
  );
};
