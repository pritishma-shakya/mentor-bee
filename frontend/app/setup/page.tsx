"use client";

import { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { User, Edit, X, Phone, FileText, Award, CheckCircle } from "lucide-react";

interface Expertise {
  id: string;
  name: string;
}

export default function MentorSetupPage() {
  const [bio, setBio] = useState("");
  const [expertiseList, setExpertiseList] = useState<Expertise[]>([]);
  const [allExpertise, setAllExpertise] = useState<Expertise[]>([]);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [hourlyRate, setHourlyRate] = useState("");
  const [experience, setExperience] = useState("");
  const [location, setLocation] = useState("");
  const [responseTime, setResponseTime] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [citizenshipId, setCitizenshipId] = useState<File | null>(null);
  const [bachelorsDegree, setBachelorsDegree] = useState<File | null>(null);
  const [mastersDegree, setMastersDegree] = useState<File | null>(null);
  const [experienceCertificate, setExperienceCertificate] = useState<File | null>(null);
  const [plusTwoTranscript, setPlusTwoTranscript] = useState<File | null>(null);
  const [phdDegree, setPhdDegree] = useState<File | null>(null);
  const [highestDegree, setHighestDegree] = useState("+2"); // Default
  const [customExpertiseInput, setCustomExpertiseInput] = useState("");
  const [customExpertiseList, setCustomExpertiseList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all available expertise options
  useEffect(() => {
    fetch("http://localhost:5000/api/mentors/expertise", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAllExpertise(data.data || []);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setProfilePicture(e.target.files[0]);
  };

  const handleAddExpertise = (skill: Expertise) => {
    if (!expertiseList.find((e) => e.id === skill.id)) {
      setExpertiseList([...expertiseList, skill]);
    }
  };

  const handleRemoveExpertise = (id: string) => {
    setExpertiseList(expertiseList.filter((e) => e.id !== id));
  };

  const handleSubmit = async () => {
    if (!bio || expertiseList.length === 0 || !phoneNumber) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!citizenshipId || !bachelorsDegree || !experienceCertificate) {
      toast.error("Please upload all required documents (ID, Bachelors, Experience)");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("bio", bio);
      formData.append("experience", experience);
      formData.append("location", location);
      formData.append("responseTime", responseTime);
      formData.append("hourlyRate", hourlyRate ? hourlyRate : "");
      formData.append("expertiselist", JSON.stringify(expertiseList));
      formData.append("phone_number", phoneNumber);
      formData.append("highest_degree", highestDegree);
      expertiseList.forEach((e) => formData.append("expertiseIds[]", e.id));
      customExpertiseList.forEach((name) => formData.append("customExpertise[]", name));

      if (profilePicture) formData.append("profilePicture", profilePicture);
      if (citizenshipId) formData.append("citizenshipId", citizenshipId);
      if (bachelorsDegree) formData.append("bachelorsDegree", bachelorsDegree);
      if (mastersDegree) formData.append("mastersDegree", mastersDegree);
      if (experienceCertificate) formData.append("experienceCertificate", experienceCertificate);
      if (plusTwoTranscript) formData.append("plusTwoTranscript", plusTwoTranscript);
      if (phdDegree) formData.append("phdDegree", phdDegree);

      const res = await fetch("http://localhost:5000/api/mentors/setup", {
        method: "POST",
        credentials: "include",
        body: formData, // FormData ensures file upload works
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Profile setup complete!");
        window.location.href = "/mentor/dashboard";
      } else {
        toast.error(data.message || "Failed to setup profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      <main className="w-full max-w-2xl bg-white rounded-2xl p-10 shadow-sm border border-gray-100 space-y-8">
        <header className="space-y-2 border-b pb-6">
          <h1 className="text-3xl font-black text-gray-950">Mentor Profile Setup</h1>
          <p className="text-gray-600 font-medium">Provide your details to join our community of expert mentors.</p>
        </header>

        <div className="space-y-8">
          {/* Profile Picture */}
          <div className="flex flex-col items-center gap-4 py-6 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <div className="w-24 h-24 rounded-full bg-white ring-4 ring-orange-100 flex items-center justify-center overflow-hidden relative shadow-md group">
              {profilePicture ? (
                <img
                  src={URL.createObjectURL(profilePicture)}
                  alt="Profile"
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
                />
              ) : (
                <User className="w-12 h-12 text-gray-300" />
              )}
              <label className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Edit className="text-white w-6 h-6" />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>
            <span className="text-sm font-bold text-gray-900 uppercase tracking-widest">Profile Photo</span>
          </div>

          {/* Basic Info */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-950 mb-1.5 uppercase tracking-wide">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell students about your expertise and experience..."
                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none min-h-[120px] resize-none text-gray-950 placeholder:text-gray-500 font-medium transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-950 mb-1.5 uppercase tracking-wide">Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+977 98XXXXXXXX"
                  className="w-full border-2 border-gray-200 rounded-xl p-3.5 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none text-gray-950 placeholder:text-gray-500 font-bold transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-950 mb-1.5 uppercase tracking-wide">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                  className="w-full border-2 border-gray-200 rounded-xl p-3.5 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none text-gray-950 placeholder:text-gray-500 font-bold transition-all"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Professional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-950 mb-1.5 uppercase tracking-wide">Hourly Rate (Rs.)</label>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="1500"
                className="w-full border-2 border-gray-200 rounded-xl p-3.5 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none text-gray-950 placeholder:text-gray-500 font-bold transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-950 mb-1.5 uppercase tracking-wide">Experience</label>
              <input
                type="text"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. 5 Years"
                className="w-full border-2 border-gray-200 rounded-xl p-3.5 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none text-gray-950 placeholder:text-gray-500 font-bold transition-all"
              />
            </div>
          </div>

          {/* Expertise */}
          <div className="space-y-4">
            <label className="block text-sm font-bold text-gray-950 uppercase tracking-wide">Areas of Expertise</label>
            <div className="flex flex-col gap-3">
              <select
                onChange={(e) => {
                  const skill = allExpertise.find((s) => s.id === e.target.value);
                  if (skill) handleAddExpertise(skill);
                  e.target.value = "";
                }}
                className="w-full border-2 border-gray-200 rounded-xl p-3.5 outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500 text-gray-950 font-bold bg-gray-50/50"
                defaultValue=""
              >
                <option value="" disabled>Select from suggestions...</option>
                {allExpertise
                  .filter((s) => !expertiseList.find((e) => e.id === s.id))
                  .map((skill) => (
                    <option key={skill.id} value={skill.id}>{skill.name}</option>
                  ))}
              </select>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={customExpertiseInput}
                  onChange={(e) => setCustomExpertiseInput(e.target.value)}
                  placeholder="Or add a new custom expertise..."
                  className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none text-gray-950 placeholder:text-gray-500 font-bold transition-all shadow-sm"
                />
                <button 
                  type="button"
                  onClick={() => {
                    if (customExpertiseInput.trim()) {
                      setCustomExpertiseList([...customExpertiseList, customExpertiseInput.trim()]);
                      setCustomExpertiseInput("");
                    }
                  }}
                  className="px-6 bg-gray-900 text-white rounded-xl font-black hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200"
                >
                  ADD
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1">
              {expertiseList.map((skill) => (
                <span key={skill.id} className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 shadow-sm">
                  {skill.name}
                  <X size={16} className="cursor-pointer hover:scale-125 transition-transform" onClick={() => handleRemoveExpertise(skill.id)} />
                </span>
              ))}
              {customExpertiseList.map((name, i) => (
                <span key={i} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 shadow-sm">
                  {name}
                  <X size={16} className="cursor-pointer hover:scale-125 transition-transform" onClick={() => setCustomExpertiseList(customExpertiseList.filter((_, idx) => idx !== i))} />
                </span>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Education Verification */}
          <div className="space-y-6 bg-gray-50/50 p-8 rounded-3xl border-2 border-gray-100 shadow-inner">
            <header className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4 mb-2">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-orange-600" />
                <h3 className="font-black text-gray-950 text-lg uppercase">Academic Verification</h3>
              </div>
            </header>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-widest">Highest Academic Degree</label>
                <select
                  value={highestDegree}
                  onChange={(e) => setHighestDegree(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl p-3.5 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none text-gray-950 font-black bg-white"
                >
                  <option value="+2">+2 (High School)</option>
                  <option value="Bachelors">Bachelors Degree</option>
                  <option value="Masters">Masters Degree</option>
                  <option value="PhD">PhD / Doctorate</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-6 pt-2">
                <FileUploadField label="National ID / Citizenship" onChange={setCitizenshipId} file={citizenshipId} required />
                
                {highestDegree === "+2" && (
                    <FileUploadField label="+2 Transcript" onChange={setPlusTwoTranscript} file={plusTwoTranscript} required />
                )}
                
                {(highestDegree === "Bachelors" || highestDegree === "Masters" || highestDegree === "PhD") && (
                    <FileUploadField label="Bachelors Degree" onChange={setBachelorsDegree} file={bachelorsDegree} required />
                )}
                
                {(highestDegree === "Masters" || highestDegree === "PhD") && (
                    <FileUploadField label="Masters Degree" onChange={setMastersDegree} file={mastersDegree} required />
                )}
                
                {highestDegree === "PhD" && (
                    <FileUploadField label="PhD Certificate" onChange={setPhdDegree} file={phdDegree} required />
                )}
                
                <FileUploadField label="Experience Certificate" onChange={setExperienceCertificate} file={experienceCertificate} required />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-5 bg-orange-600 text-white font-black text-xl rounded-2xl hover:bg-orange-700 transition-all hover:scale-[1.02] active:scale-100 disabled:opacity-50 shadow-2xl shadow-orange-100 flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              Completing Profile...
            </>
          ) : "COMPLETE SETUP"}
        </button>
      </main>
    </div>
  );
}

function FileUploadField({ 
  label, 
  onChange, 
  file, 
  required = false 
}: { 
  label: string; 
  onChange: (f: File | null) => void; 
  file: File | null;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center justify-between">
        {label}
        {required && <span className="text-orange-600 font-bold normal-case tracking-normal">Mandatory</span>}
      </label>
      <div className={`relative group transition-all`}>
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          accept=".pdf,image/*"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
        <div className={`
          flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed transition-all
          ${file 
            ? 'border-orange-500 bg-orange-50/30' 
            : 'border-gray-200 bg-white group-hover:border-orange-400 group-hover:bg-orange-50/10'
          }
        `}>
          <div className={`
            w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden
            ${file ? 'bg-orange-100' : 'bg-gray-100'}
          `}>
             {file && file.type.startsWith('image/') ? (
               <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
             ) : (
               file ? <Award className="w-6 h-6 text-orange-600" /> : <Edit className="w-6 h-6 text-gray-400" />
             )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-sm font-black text-gray-950 truncate">
              {file ? file.name : "Click to upload document"}
            </span>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {file ? (file.size / (1024 * 1024)).toFixed(2) + " MB" : "Images or PDF only"}
            </span>
          </div>
          {file && (
            <button 
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="p-2 hover:bg-orange-200 rounded-xl transition-colors z-20 text-orange-700"
            >
              <X size={18} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
