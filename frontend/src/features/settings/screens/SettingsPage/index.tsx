import React, { useState, useEffect } from "react";
import { FaUser, FaEnvelope, FaBuilding, FaLock, FaSave, FaShieldAlt, FaKey, FaTimes, FaCheckCircle, FaGoogle, FaUnlink, FaSyncAlt } from "react-icons/fa";
import { useGetMyProfileQuery, useUpdateMyProfileMutation } from "../../api";
import { useGetMailboxStatusQuery, useDisconnectMailboxMutation } from "../../../auth/api";
import { MailboxOnboardingModal } from "../../../auth/components/MailboxOnboardingModal";
import { PasswordInput } from "../../../../shared/components/PasswordInput";
import { useAuth } from "../../../../shared/context/AuthContext";
import { formatApiError } from "../../../../shared/utils/errorUtils";

export const SettingsPage: React.FC = () => {
  const auth = useAuth();
  const { data: profile, isLoading } = useGetMyProfileQuery();
  const [updateMyProfile, { isLoading: isSaving }] = useUpdateMyProfileMutation();
  const { data: mailboxStatus, isLoading: isMailboxLoading } = useGetMailboxStatusQuery();
  const [disconnectMailbox, { isLoading: isDisconnecting }] = useDisconnectMailboxMutation();

  const isCEO = Boolean(auth?.role === "ceo" || profile?.role === "ceo");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    companyName: "",
  });

  // Mailbox Modal State
  const [showMailboxModal, setShowMailboxModal] = useState(false);

  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordModalError, setPasswordModalError] = useState("");

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const compName =
      profile?.company?.name ||
      profile?.company_name ||
      "";

    setFormData({
      name: profile?.full_name || "",
      email: profile?.email || "",
      companyName: compName,
    });
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const updated = await updateMyProfile({
        full_name: formData.name,
        company_name: formData.companyName,
      }).unwrap();

      localStorage.setItem("full_name", updated.full_name);
      setSuccessMsg("Profile information updated successfully!");
    } catch (err: any) {
      setErrorMsg(formatApiError(err, "Could not save profile settings."));
    }
  };

  const handleOpenPasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordModalError("");
    setShowPasswordModal(true);
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordModalError("");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordModalError("");

    if (!currentPassword) {
      setPasswordModalError("Please enter your current password.");
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setPasswordModalError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordModalError("New passwords do not match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await updateMyProfile({
        old_password: currentPassword,
        password: newPassword,
      }).unwrap();

      setSuccessMsg("Password changed successfully!");
      handleClosePasswordModal();
    } catch (err: any) {
      setPasswordModalError(formatApiError(err, "Failed to update password. Verify your current password."));
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return <div className="text-center text-[#05DC7F] py-12 text-sm font-semibold">Loading account settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 animate-fadeIn">
      {/* ──── HERO PROFILE CARD ──── */}
      <div className="bg-[#111827]/90 border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#05DC7F]/30 to-[#05DC7F]/5 border border-[#05DC7F]/40 flex items-center justify-center text-[#05DC7F] text-2xl font-bold shadow-[0_0_20px_rgba(5,220,127,0.2)]">
            {(formData.name || profile?.full_name || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {formData.name || "User Profile"}
            </h2>
            <p className="text-xs text-white/50 flex items-center gap-1.5 mt-0.5">
              <FaEnvelope className="text-[#05DC7F]/70" /> {formData.email || profile?.email}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#05DC7F]/15 text-[#05DC7F] border border-[#05DC7F]/30">
                {auth?.role || profile?.role || "Member"}
              </span>
              <span className="text-xs text-white/40">• {formData.companyName || "AI Recruiter"}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="w-full md:w-auto px-6 py-3 bg-[#05DC7F] text-black font-bold rounded-xl hover:bg-[#04c56f] transition shadow-[0_0_20px_rgba(5,220,127,0.3)] flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          <FaSave /> {isSaving ? "Saving..." : "Save Profile"}
        </button>
      </div>

      {/* FEEDBACK ALERTS */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-[#05DC7F]/10 border border-[#05DC7F]/30 text-[#05DC7F] text-xs text-center font-medium flex items-center justify-center gap-2">
          <FaCheckCircle /> {successMsg}
        </div>
      )}

      {/* ──── TWO COLUMN LAYOUT: PROFILE & SECURITY ──── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* COLUMN 1: PERSONAL INFORMATION */}
        <div className="bg-[#111827]/90 border border-white/10 rounded-2xl p-6 space-y-5 shadow-lg">
          <div className="border-b border-white/10 pb-3 flex items-center gap-2">
            <FaUser className="text-[#05DC7F]" />
            <h3 className="text-base font-bold text-white">Personal Information</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">Full Name</label>
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5">
                <FaUser className="text-white/40 text-sm shrink-0" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className="w-full bg-transparent text-white text-sm outline-none placeholder-white/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">Work Email (Locked)</label>
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 opacity-60 cursor-not-allowed">
                <FaEnvelope className="text-white/40 text-sm shrink-0" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  className="w-full bg-transparent text-white/60 text-sm outline-none cursor-not-allowed"
                />
                <FaLock className="text-amber-400 text-xs shrink-0" title="Primary identity email cannot be modified" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">
                {isCEO ? "Company Name" : "Company Name (Managed by CEO)"}
              </label>
              <div className={`flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 ${!isCEO ? "opacity-60 cursor-not-allowed" : ""}`}>
                <FaBuilding className="text-white/40 text-sm shrink-0" />
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  readOnly={!isCEO}
                  placeholder="Company name"
                  className={`w-full bg-transparent text-sm outline-none ${!isCEO ? "text-white/60 cursor-not-allowed" : "text-white placeholder-white/30"}`}
                />
                {!isCEO && (
                  <FaLock className="text-amber-400 text-xs shrink-0" title="Company name can only be modified by the CEO" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: SECURITY & PASSWORD ACTION */}
        <div className="bg-[#111827]/90 border border-white/10 rounded-2xl p-6 space-y-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-white/10 pb-3 flex items-center gap-2">
              <FaShieldAlt className="text-[#05DC7F]" />
              <h3 className="text-base font-bold text-white">Security & Access</h3>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              Maintain workspace security by keeping your password updated. Password fields are protected and hidden from view by default.
            </p>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <FaKey /> Account Security Notice
              </p>
              <p className="text-[11px] text-amber-200/70">
                To update your credentials, you will be prompted to verify your current password first.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={handleOpenPasswordModal}
              className="w-full py-3 bg-white/5 border border-[#05DC7F]/40 hover:border-[#05DC7F] text-[#05DC7F] font-bold rounded-xl transition hover:bg-[#05DC7F]/10 flex items-center justify-center gap-2 text-sm shadow-md"
            >
              <FaKey /> Select Change Password
            </button>
          </div>
        </div>
      </div>

      {/* ──── COMPANY MAILBOX INTEGRATION SECTION ──── */}
      {isCEO && (
        <div className="bg-[#111827]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EA4335]/20 to-[#EA4335]/5 border border-[#EA4335]/30 flex items-center justify-center text-[#EA4335]">
                <FaGoogle size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Company Gmail Mailbox
                  {mailboxStatus?.is_connected ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#05DC7F]/15 text-[#05DC7F] border border-[#05DC7F]/30 flex items-center gap-1">
                      <FaCheckCircle size={10} /> Active & Connected
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Not Connected
                    </span>
                  )}
                </h3>
                <p className="text-xs text-white/50">
                  Connect your recruitment email address so candidate resumes automatically ingest into job pipelines.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {mailboxStatus?.is_connected ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowMailboxModal(true)}
                    className="px-4 py-2 bg-white/5 border border-white/10 hover:border-white/30 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <FaSyncAlt className="text-xs" /> Reconnect Mailbox
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm("Are you sure you want to disconnect this mailbox? Incoming applications will no longer be fetched.")) return;
                      try {
                        await disconnectMailbox().unwrap();
                        setSuccessMsg("Company mailbox disconnected.");
                      } catch (err: any) {
                        setErrorMsg(formatApiError(err, "Failed to disconnect mailbox."));
                      }
                    }}
                    disabled={isDisconnecting}
                    className="px-4 py-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <FaUnlink className="text-xs" /> Disconnect
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowMailboxModal(true)}
                  className="px-5 py-2.5 bg-[#05DC7F] hover:bg-[#04B367] text-black font-bold rounded-xl text-xs transition shadow-[0_0_15px_rgba(5,220,127,0.3)] flex items-center gap-2"
                >
                  <FaGoogle /> Connect with Google
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-black/30 border border-white/5 rounded-xl p-3.5 space-y-1">
              <span className="text-white/40 block font-medium">Connected Mailbox Email</span>
              <span className="text-white font-mono font-semibold text-sm">
                {mailboxStatus?.mailbox_email || "No mailbox linked yet"}
              </span>
            </div>

            <div className="bg-black/30 border border-white/5 rounded-xl p-3.5 space-y-1">
              <span className="text-white/40 block font-medium">Provider & Auth Type</span>
              <span className="text-white font-medium">
                Google Workspace / Gmail OAuth 2.0
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ──── REUSABLE DEDICATED MAILBOX ONBOARDING MODAL ──── */}
      <MailboxOnboardingModal
        open={showMailboxModal}
        onClose={() => setShowMailboxModal(false)}
        allowDismiss={true}
      />

      {/* ──── REUSABLE DEDICATED CHANGE PASSWORD MODAL ──── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111827] border border-white/15 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scaleUp">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#05DC7F]/15 text-[#05DC7F] border border-[#05DC7F]/30">
                  <FaKey size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Change Account Password</h3>
                  <p className="text-[11px] text-white/50">Enter your current & new password credentials.</p>
                </div>
              </div>
              <button
                onClick={handleClosePasswordModal}
                className="text-white/40 hover:text-white transition p-1"
                aria-label="Close modal"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Modal Error Alert */}
            {passwordModalError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium">
                {passwordModalError}
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70">Current Password</label>
                <PasswordInput
                  variantType="tailwind"
                  name="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70">New Password</label>
                <PasswordInput
                  variantType="tailwind"
                  name="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70">Confirm New Password</label>
                <PasswordInput
                  variantType="tailwind"
                  name="confirmNewPassword"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClosePasswordModal}
                  disabled={isChangingPassword}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 font-semibold rounded-xl text-xs transition border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 py-2.5 bg-[#05DC7F] text-black font-bold rounded-xl text-xs hover:bg-[#04c56f] transition shadow-[0_0_15px_rgba(5,220,127,0.3)] flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
