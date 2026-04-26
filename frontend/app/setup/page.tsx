"use client";

import { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { User, Edit, X, Phone, FileText, Award, CheckCircle } from "lucide-react";
import "./setup.css";

interface Expertise {
  id: string;
  name: string;
}

const RequiredStar = () => (
  <span className="text-red-500 ml-1">*</span>
);

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
    <div className="min-h-screen bg-gray-50 flex justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-right" />
      <main className="w-full max-w-4xl bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-8">
        <header className="border-b border-gray-200 pb-5">
          <h1 className="text-2xl font-bold text-gray-900">Mentor Profile Setup</h1>
          <p className="text-sm text-gray-600 font-medium mt-1">Provide your details to join our community of expert mentors.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-bold text-gray-950">Profile Photo<RequiredStar /></label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 relative group">
                  {profilePicture ? (
                    <img src={URL.createObjectURL(profilePicture)} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Edit className="text-white w-5 h-5" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-950 mb-1">Bio<RequiredStar /></label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell students about your expertise..."
                className="w-full border border-gray-300 rounded-lg bg-gray-50 p-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none min-h-[100px] resize-none text-sm text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-950 mb-1">Phone<RequiredStar /></label>
                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+977 98..." className="w-full border border-gray-300 rounded-lg bg-gray-50 p-2.5 outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900 placeholder:text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-950 mb-1">Location<RequiredStar /></label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" className="w-full border border-gray-300 rounded-lg bg-gray-50 p-2.5 outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900 placeholder:text-gray-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-950 mb-1">Rate (Rs.)<RequiredStar /></label>
                <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="1500" className="w-full border border-gray-300 rounded-lg bg-gray-50 p-2.5 outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900 placeholder:text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-950 mb-1">Experience<RequiredStar /></label>
                <input type="text" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="5 Years" className="w-full border border-gray-300 rounded-lg bg-gray-50 p-2.5 outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900 placeholder:text-gray-500" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-950">Areas of Expertise<RequiredStar /></label>
              <div className="flex flex-col gap-2">
                <select onChange={(e) => {
                  const skill = allExpertise.find((s) => s.id === e.target.value);
                  if (skill) handleAddExpertise(skill);
                  e.target.value = "";
                }} className="w-full border border-gray-300 rounded-lg bg-gray-50 p-2.5 outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900 placeholder:text-gray-500" defaultValue="">
                  <option value="" disabled>Select from suggestions...</option>
                  {allExpertise.filter((s) => !expertiseList.find((e) => e.id === s.id)).map((skill) => (
                    <option key={skill.id} value={skill.id}>{skill.name}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input type="text" value={customExpertiseInput} onChange={(e) => setCustomExpertiseInput(e.target.value)} placeholder="Or add custom..." className="flex-1 border border-gray-300 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-orange-500" />
                  <button type="button" onClick={() => {
                    if (customExpertiseInput.trim()) {
                      setCustomExpertiseList([...customExpertiseList, customExpertiseInput.trim()]);
                      setCustomExpertiseInput("");
                    }
                  }} className="px-4 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-colors">ADD</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {expertiseList.map((skill) => (
                  <span key={skill.id} className="bg-orange-100 text-orange-800 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 border border-orange-200">
                    {skill.name}
                    <X size={14} className="cursor-pointer hover:text-red-500" onClick={() => handleRemoveExpertise(skill.id)} />
                  </span>
                ))}
                {customExpertiseList.map((name, i) => (
                  <span key={i} className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 border border-gray-200">
                    {name}
                    <X size={14} className="cursor-pointer hover:text-red-500" onClick={() => setCustomExpertiseList(customExpertiseList.filter((_, idx) => idx !== i))} />
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Verification */}
          <div className="space-y-5 bg-gray-50 p-6 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
              <Award className="w-5 h-5 text-orange-600" />
              <h3 className="text-base font-bold text-gray-950">Academic Verification</h3>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-950 mb-1">Highest Degree<RequiredStar /></label>
              <select value={highestDegree} onChange={(e) => setHighestDegree(e.target.value)} className="w-full border border-gray-300 rounded-lg bg-gray-50 p-2.5 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                <option value="+2">+2 (High School)</option>
                <option value="Bachelors">Bachelors Degree</option>
                <option value="Masters">Masters Degree</option>
                <option value="PhD">PhD / Doctorate</option>
              </select>
            </div>

            <div className="space-y-4 pt-2">
              <FileUploadField label="Citizenship / ID" onChange={setCitizenshipId} file={citizenshipId} required />
              {highestDegree === "+2" && <FileUploadField label="+2 Transcript" onChange={setPlusTwoTranscript} file={plusTwoTranscript} required />}
              {["Bachelors", "Masters", "PhD"].includes(highestDegree) && <FileUploadField label="Bachelors Degree" onChange={setBachelorsDegree} file={bachelorsDegree} required />}
              {["Masters", "PhD"].includes(highestDegree) && <FileUploadField label="Masters Degree" onChange={setMastersDegree} file={mastersDegree} required />}
              {highestDegree === "PhD" && <FileUploadField label="PhD Certificate" onChange={setPhdDegree} file={phdDegree} required />}
              <FileUploadField label="Experience Certificate" onChange={setExperienceCertificate} file={experienceCertificate} required />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 mt-8">
          <button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-orange-600 text-white font-semibold text-base rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {loading ? "Completing Profile..." : "COMPLETE SETUP"}
          </button>
        </div>
      </main>
    </div>
  );
}

function FileUploadField({ label, onChange, file, required = false }: { label: string; onChange: (f: File | null) => void; file: File | null; required?: boolean; }) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-900 flex justify-between mb-1.5">
        <span>{label} {required && <RequiredStar />}</span>
        {file && <span className="text-orange-600 text-[10px] font-bold">UPLOADED</span>}
      </label>
      <div className={`relative flex items-center gap-3 p-3 rounded-xl border border-dashed transition-colors ${file ? 'border-orange-400 bg-orange-50/50' : 'border-gray-300 bg-white hover:border-orange-300'}`}>
        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept="image/*" onChange={(e) => onChange(e.target.files?.[0] || null)} />
        <div className={`w-8 h-8 rounded-lg flex shrink-0 items-center justify-center overflow-hidden ${file ? 'bg-orange-100' : 'bg-gray-100'}`}>
          {file && file.type.startsWith('image/') ? <img src={URL.createObjectURL(file)} alt="Prev" className="w-full h-full object-cover" /> : <FileText className={`w-4 h-4 ${file ? 'text-orange-600' : 'text-gray-400'}`} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-950 truncate">{file ? file.name : "Click to upload document"}</p>
        </div>
        {file && (
          <button onClick={(e) => { e.stopPropagation(); onChange(null); }} className="p-1.5 text-orange-600 hover:bg-orange-200 rounded-lg z-20"><X size={16} /></button>
        )}
      </div>
    </div>
  );
}
