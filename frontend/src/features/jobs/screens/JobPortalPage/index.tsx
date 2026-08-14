import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../../../images/logo.png";
import bgGlow from "../../../../images/bg.png";
import { getApiBaseUrl } from "../../../../shared/utils/config";

export const JobPortalPage: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/jobs/public/all`);
        const data = await response.json();
        setJobs(data.jobs || []);
      } catch (err) {
        console.error("Jobs fetch error:", err);
      }
      setLoading(false);
    };
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(
    (job) =>
      job.title?.toLowerCase().includes(search.toLowerCase()) ||
      job.department?.toLowerCase().includes(search.toLowerCase()) ||
      job.skills?.toLowerCase().includes(search.toLowerCase())
  );

  const handleApplyNow = (job: any) => {
    const subject = encodeURIComponent(`Application for ${job.title} — ${job.company_name}`);
    const body = encodeURIComponent(
      `Dear Hiring Manager,\n\nI am writing to express my interest in the ${job.title} position at ${job.company_name}.`
    );
    const toEmail = job.ceo_email || "";
    window.open(
      `https://mail.google.com/mail/?view=cm&to=${toEmail}&su=${subject}&body=${body}`,
      "_blank"
    );
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0d0d0d] overflow-x-hidden">
      {/* Background Glow */}
      <div
        className="fixed pointer-events-none left-0 bottom-0 w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] opacity-60"
        style={{
          backgroundImage: `url(${bgGlow})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          transform: "translate(-30%, 40%) rotate(80deg)",
        }}
      />
      <div
        className="fixed pointer-events-none right-0 top-0 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] opacity-30"
        style={{
          backgroundImage: `url(${bgGlow})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          transform: "translate(30%, -40%) rotate(260deg)",
        }}
      />

      {/* Navbar */}
      <nav className="relative z-20 flex justify-between items-center px-4 sm:px-8 py-4 border-b border-white/10 backdrop-blur-sm bg-black/20">
        <img src={logo} alt="AI Recruiter" className="w-24 sm:w-32" />
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-gray-400 text-sm">
            {jobs.length} open positions
          </span>
          <button
            onClick={() => navigate("/")}
            className="text-[#05DC7F] border border-[#05DC7F]/40 px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl text-sm font-medium hover:bg-[#05DC7F] hover:text-black transition"
          >
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 pt-10 sm:pt-16 pb-6 sm:pb-10">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-white text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
            Find Your Next <span className="text-[#05DC7F]">Opportunity</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
            Browse open positions and join innovative teams
          </p>

          <div className="mt-6 max-w-xl mx-auto">
            <div className="flex items-center bg-black/40 border border-[#05DC7F]/20 rounded-2xl px-4 py-3 focus-within:border-[#05DC7F]/60 transition backdrop-blur-sm">
              <svg className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by title, department, or skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-gray-400 text-sm">Loading positions...</p>
          </div>
        )}

        {!loading && filteredJobs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No positions found.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="group p-5 sm:p-6 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm hover:border-[#05DC7F]/40 hover:bg-black/50 transition-all duration-300"
            >
              <div className="flex justify-between items-start gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-base sm:text-lg truncate">{job.title}</h3>
                  <p className="text-gray-400 text-sm mt-0.5">{job.company_name} • {job.department}</p>
                </div>
                <span className="flex-shrink-0 px-2 py-1 rounded-lg bg-[#05DC7F]/10 border border-[#05DC7F]/30 text-[#05DC7F] text-xs font-medium">
                  {job.employment_type}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs">
                  📅 {job.experience} exp
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs">
                  💰 {job.salary_range}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {job.skills?.split(",").slice(0, 4).map((skill: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs">
                    {skill.trim()}
                  </span>
                ))}
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/5">
                <button
                  onClick={() => { setSelectedJob(job); setShowApplyForm(false); }}
                  className="flex-1 py-2 rounded-xl border border-gray-600 text-gray-300 text-sm hover:border-[#05DC7F]/50 hover:text-[#05DC7F] transition"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleApplyNow(job)}
                  className="flex-1 py-2 rounded-xl bg-[#05DC7F] text-black text-sm font-semibold hover:bg-[#04c56f] transition"
                >
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedJob && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedJob(null)} />
          <div className="relative bg-[#0d0d0d] w-full sm:max-w-2xl rounded-2xl border border-[#05DC7F]/20 p-6 flex flex-col max-h-[85vh] min-h-0 text-white my-auto">
            <div className="shrink-0 flex justify-between items-start border-b border-white/10 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-lg">{selectedJob.title}</h3>
                <p className="text-xs text-gray-400">{selectedJob.company_name} • {selectedJob.department}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-gray-400 hover:text-white p-1">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 text-sm text-gray-300 whitespace-pre-line font-sans leading-relaxed">
              {selectedJob.full_description}
            </div>
            <div className="shrink-0 mt-4 pt-3 border-t border-white/10">
              <button
                onClick={() => handleApplyNow(selectedJob)}
                className="w-full py-3 rounded-xl bg-[#05DC7F] text-black font-semibold hover:bg-[#04c56f] transition"
              >
                Apply via Gmail →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
