import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addJob, subscribeToJobs, subscribeToClients, updateJob } from "../lib/api";
import { Job, Client } from "../types";
import { 
  Briefcase, 
  Plus, 
  Search, 
  MapPin, 
  Clock, 
  Users, 
  Loader2, 
  CheckCircle,
  X,
  Edit,
  Building,
  Target,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

const jobSchema = z.object({
  title: z.string().min(2, "Job title is required"),
  clientId: z.string().min(1, "Client is required"),
  location: z.string().min(2, "Location is required"),
  jobType: z.enum(["Full-time", "Contract", "Freelance"]),
  description: z.string().min(10, "Description is required"),
  experienceRange: z.string().min(1, "Experience is required"),
  salaryRange: z.string().optional(),
  status: z.enum(["Open", "Closed", "On Hold"]),
  skills: z.array(z.string()).min(1, "Add at least one skill"),
  requirements: z.array(z.string()).optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

export function JobManagement() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    const unsubJobs = subscribeToJobs(setJobs);
    const unsubClients = subscribeToClients(setClients);
    return () => {
      unsubJobs();
      unsubClients();
    };
  }, []);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      status: "Open",
      skills: [],
    }
  });

  const selectedSkills = watch("skills") || [];

  const onSubmit = async (data: JobFormData) => {
    setLoading(true);
    try {
      const client = clients.find(c => c.id === data.clientId);
      const jobData = {
        ...data,
        clientName: client?.name || "Unknown Client"
      };

      if (editingJob) {
        await updateJob(editingJob.id, jobData);
      } else {
        await addJob(jobData as any);
      }
      reset();
      setShowForm(false);
      setEditingJob(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save job");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setValue("title", job.title);
    setValue("clientId", job.clientId);
    setValue("location", job.location);
    setValue("jobType", job.jobType);
    setValue("description", job.description);
    setValue("experienceRange", job.experienceRange);
    setValue("salaryRange", job.salaryRange || "");
    setValue("status", job.status);
    setValue("skills", job.skills);
    setShowForm(true);
  };

  const addSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!selectedSkills.includes(skillInput.trim())) {
        setValue("skills", [...selectedSkills, skillInput.trim()]);
      }
      setSkillInput("");
    }
  };

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job Pipeline</h1>
          <p className="text-slate-500">Manage active job openings and tracking</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingJob(null); reset(); }}
          className="bg-[#002B5B] hover:bg-blue-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Create Job
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search roles or companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredJobs.map(job => (
          <motion.div
            key={job.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all group relative"
          >
            <div className="absolute top-6 right-6 flex items-center gap-2">
              <span className={cn(
                "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest",
                job.status === "Open" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              )}>
                {job.status}
              </span>
              <button 
                onClick={() => handleEdit(job)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-slate-50 rounded-2xl text-slate-600">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {job.title}
                </h3>
                <p className="text-sm font-medium text-slate-500 flex items-center gap-1">
                  <Building className="w-3 h-3" /> {job.clientName}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="w-4 h-4" /> {job.location}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-4 h-4" /> {job.jobType}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Target className="w-4 h-4" /> Exp: {job.experienceRange}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Users className="w-4 h-4" /> Status: {job.status}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {job.skills.map(skill => (
                <span key={skill} className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg uppercase">
                  {skill}
                </span>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
              <span>Added: {new Date(job.createdAt?.seconds * 1000).toLocaleDateString()}</span>
              <button className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                View Candidates <Plus className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingJob ? "Update Pipeline Role" : "Add to Job Pipeline"}
                  </h2>
                  <p className="text-xs text-slate-500">Define requirements for candidate matching</p>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Basic Info</label>
                      <div className="space-y-4">
                        <input
                          {...register("title")}
                          placeholder="Job Title (e.g. Fullstack Developer)"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                          {...register("clientId")}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none bg-white"
                        >
                          <option value="">Select Client</option>
                          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            {...register("location")}
                            placeholder="Location"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                          />
                          <select
                            {...register("jobType")}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none bg-white"
                          >
                            <option value="Full-time">Full-time</option>
                            <option value="Contract">Contract</option>
                            <option value="Freelance">Freelance</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Qualifications</label>
                      <div className="space-y-4">
                        <input
                          {...register("experienceRange")}
                          placeholder="Experience (e.g. 5-8 Years)"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                        />
                        <input
                          {...register("salaryRange")}
                          placeholder="Salary Range (Optional)"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Required Skills</label>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={addSkill}
                            placeholder="Type skill & press Enter"
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 outline-none"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2 min-h-[44px] p-2 bg-slate-50 rounded-xl">
                          {selectedSkills.map(skill => (
                            <span key={skill} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 animate-in zoom-in-50">
                              {skill}
                              <button 
                                type="button" 
                                onClick={() => setValue("skills", selectedSkills.filter(s => s !== skill))}
                                className="hover:text-red-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Job Description</label>
                      <textarea
                        {...register("description")}
                        rows={10}
                        placeholder="Detailed role description, responsibilities, etc."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none resize-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-8 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-8 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-10 py-3 rounded-xl bg-[#002B5B] text-white font-bold hover:bg-blue-900 transition-all shadow-xl shadow-blue-100 flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                    {editingJob ? "Save Changes" : "Create Pipeline"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
