import React, { useState, useEffect } from "react";
import { FaUser, FaEnvelope, FaBuilding, FaLock, FaSave } from "react-icons/fa";
import { useGetUserProfileQuery, useUpdateUserProfileMutation } from "../../api";

export const SettingsPage: React.FC = () => {
  const { data: profile, isLoading } = useGetUserProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateUserProfileMutation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    companyName: "",
    password: "",
  });

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.full_name || "",
        email: profile.email || "",
        companyName: profile.company_name || "",
        password: "",
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const updated = await updateProfile({
        full_name: formData.name,
        company_name: formData.companyName,
        password: formData.password || null,
      }).unwrap();

      localStorage.setItem("full_name", updated.full_name);
      setSuccessMsg("Account settings saved successfully!");
      setFormData((prev) => ({ ...prev, password: "" }));
    } catch (err: any) {
      setErrorMsg(err?.data?.detail || "Could not save settings");
    }
  };

  if (isLoading) {
    return <div className="text-center text-[#05DC7F] py-10">Loading profile settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-6 p-6 bg-black/50 backdrop-blur-md border border-[#05DC7F]/30 rounded-2xl shadow-[0_0_20px_rgba(5,220,127,0.25)]">
      <h2 className="text-white text-2xl font-bold text-center mb-2">Account Settings</h2>
      <p className="text-gray-400 text-sm text-center mb-6">Manage your account profile and credentials</p>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500 text-red-400 text-sm text-center">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 rounded-lg bg-[#05DC7F]/20 border border-[#05DC7F] text-[#05DC7F] text-sm text-center">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-2 border-b border-[#05DC7F]/20 pb-2">
          <FaUser className="text-[#05DC7F] w-5 h-5" />
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full Name"
            className="w-full bg-transparent text-white placeholder-gray-400 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 border-b border-[#05DC7F]/20 pb-2">
          <FaEnvelope className="text-[#05DC7F] w-5 h-5" />
          <input
            type="email"
            name="email"
            value={formData.email}
            readOnly
            placeholder="Email"
            className="w-full bg-transparent text-gray-400 placeholder-gray-400 outline-none cursor-not-allowed"
          />
        </div>

        <div className="flex items-center gap-2 border-b border-[#05DC7F]/20 pb-2">
          <FaBuilding className="text-[#05DC7F] w-5 h-5" />
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            placeholder="Company Name"
            className="w-full bg-transparent text-white placeholder-gray-400 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 border-b border-[#05DC7F]/20 pb-2">
          <FaLock className="text-[#05DC7F] w-5 h-5" />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="New Password (leave empty to keep current)"
            className="w-full bg-transparent text-white placeholder-gray-400 outline-none"
          />
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#05DC7F] text-black font-semibold rounded-xl hover:bg-[#04c56f] transition disabled:opacity-50"
        >
          <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          <FaSave className="text-black" />
        </button>
      </div>
    </div>
  );
};
