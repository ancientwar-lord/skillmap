'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Building,
  Briefcase,
  X,
  DollarSign,
  Calendar,
} from 'lucide-react';

type Job = {
  _id: string;
  title: string;
  type: string;
  locationAddress: string;
  createdAt: string;
  url: string;
  skills_suggest?: string[];
  department?: string;
  seniority?: string;
  descriptionBreakdown?: {
    oneSentenceJobSummary?: string;
    salaryRangeMinYearly?: number;
    salaryRangeMaxYearly?: number;
    employmentType?: string;
    workModel?: string;
  };
  owner?: {
    companyName: string;
    photo?: string;
  };
};

export default function JobBoard() {
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  // Start loading as false to match server, switch to true when fetching
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const fetchJobs = async (searchQuery = '') => {
    setLoading(true);
    setError('');

    try {
      const endpoint = searchQuery
        ? `/api/jobs?search=${encodeURIComponent(searchQuery)}`
        : `/api/jobs`;

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Failed to load jobs');

      const responseData = await res.json();
      setJobs(responseData.jobs || []);
    } catch (err) {
      setError('Failed to load jobs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle mounting and initial fetch safely
  useEffect(() => {
    setIsMounted(true);
    fetchJobs();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(searchTerm);
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null;
    const format = (num: number) => `$${(num / 1000).toFixed(0)}k`;
    if (min && max) return `${format(min)} - ${format(max)}`;
    return format(min || max || 0);
  };

  // 🚨 HYDRATION FIX: Return a simple skeleton/loading state for the server
  // and the very first client render before hydration completes.
  if (!isMounted) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="h-14 bg-slate-100 rounded-xl animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 relative">
      {/* Search UI */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={20} className="text-slate-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search roles or companies (e.g., Sales, Developer, SoFi...)"
            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm text-slate-700 bg-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap"
        >
          {loading ? 'Searching...' : 'Search Jobs'}
        </button>
      </form>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center font-medium">
          {error}
        </div>
      )}

      {/* Results List */}
      <div className="space-y-4">
        {!loading && jobs.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No jobs found. Try adjusting your search criteria.
          </div>
        )}

        {/* Loading State specifically for searches */}
        {loading && jobs.length === 0 && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse"
              ></div>
            ))}
          </div>
        )}

        {jobs.map((job) => (
          <div
            key={job._id}
            onClick={() => setSelectedJob(job)}
            className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                {job.owner?.photo && job.owner.photo !== '/avatar.jpg' ? (
                  <img
                    src={job.owner.photo}
                    alt={job.owner.companyName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building size={20} className="text-slate-400" />
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {job.title}
                </h3>
                <div className="flex flex-wrap gap-x-4 gap-y-2 items-center mt-1 text-sm text-slate-500">
                  <span className="font-medium text-slate-700">
                    {job.owner?.companyName || 'Unknown Company'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-slate-400" />
                    {job.locationAddress}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                    {job.type}
                  </span>
                </div>
              </div>
            </div>

            <button className="px-5 py-2 bg-slate-50 text-indigo-600 text-sm font-semibold rounded-xl group-hover:bg-indigo-50 border border-slate-200 group-hover:border-indigo-100 transition-colors w-full sm:w-auto shrink-0">
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* Job Details Modal Overlay */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedJob(null)}
          ></div>

          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="pr-8 flex gap-4">
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  {selectedJob.owner?.photo &&
                  selectedJob.owner.photo !== '/avatar.jpg' ? (
                    <img
                      src={selectedJob.owner.photo}
                      alt="Company"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building size={28} className="text-slate-300" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                    {selectedJob.title}
                  </h2>
                  <div className="flex flex-wrap gap-4 items-center mt-2 text-sm text-slate-600 font-medium">
                    <span className="text-indigo-600 font-bold">
                      {selectedJob.owner?.companyName}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={16} className="text-slate-400" />
                      {selectedJob.locationAddress}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors absolute top-6 right-6"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-8 bg-white">
              <div className="flex flex-wrap gap-3">
                {formatSalary(
                  selectedJob.descriptionBreakdown?.salaryRangeMinYearly,
                  selectedJob.descriptionBreakdown?.salaryRangeMaxYearly
                ) && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-semibold rounded-lg border border-green-100">
                    <DollarSign size={16} />
                    {formatSalary(
                      selectedJob.descriptionBreakdown?.salaryRangeMinYearly,
                      selectedJob.descriptionBreakdown?.salaryRangeMaxYearly
                    )}{' '}
                    / yr
                  </span>
                )}
                {selectedJob.type && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 text-sm font-semibold rounded-lg border border-purple-100">
                    <Briefcase size={16} />
                    {selectedJob.type}
                  </span>
                )}
                {selectedJob.department && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg border border-blue-100">
                    {selectedJob.department}
                  </span>
                )}
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg">
                  <Calendar size={16} />
                  Posted {new Date(selectedJob.createdAt).toLocaleDateString()}
                </span>
              </div>

              {selectedJob.descriptionBreakdown?.oneSentenceJobSummary && (
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">
                    Job Summary
                  </h3>
                  <div className="text-slate-600 leading-relaxed text-sm sm:text-base bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {selectedJob.descriptionBreakdown.oneSentenceJobSummary}
                  </div>
                </div>
              )}

              {selectedJob.skills_suggest &&
                selectedJob.skills_suggest.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-3">
                      Requirements & Skills
                    </h3>
                    <ul className="grid grid-cols-1 gap-2">
                      {selectedJob.skills_suggest.map((skill, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-slate-600"
                        >
                          <span className="text-indigo-500 mt-1">•</span>
                          <span>{skill}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-6 py-3 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <a
                href={selectedJob.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm inline-block text-center"
              >
                Apply on Rise
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
