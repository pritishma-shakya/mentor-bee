"use client";

import { useState } from "react";
import { Camera, User, Mail, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface AccountSettingsProps {
  user: any;
  onUpdate: (user: any) => void;
}

export default function AccountSettings({ user, onUpdate }: AccountSettingsProps) {
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(user?.profile_picture || "");
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("phone_number", phone);
    formData.append("bio", bio);
    if (file) {
      formData.append("profilePicture", file);
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/update-account", {
        method: "PUT",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Account updated successfully!");
        onUpdate(data.user);
      } else {
        toast.error(data.message || "Failed to update account");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Account Information</h3>
        <p className="text-sm text-gray-500">Update your basic account details and profile picture.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Profile Picture */}
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm ring-1 ring-gray-200">
              {previewUrl ? (
                <img
                  src={previewUrl.startsWith('http') || previewUrl.startsWith('/') ? (previewUrl.startsWith('http') ? previewUrl : `http://localhost:5000${previewUrl}`) : previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <User className="w-10 h-10" />
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-1.5 bg-orange-500 rounded-full text-white cursor-pointer shadow-lg hover:bg-orange-600 transition-colors">
              <Camera className="w-4 h-4" />
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Profile Picture</p>
            <p className="text-xs text-gray-500 mt-0.5">JPG, GIF or PNG. Max size of 2MB.</p>
          </div>
        </div>

        {/* Name, Phone, Bio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4"> {/* Changed to space-y-4 for consistent spacing between new fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-gray-900"
                placeholder="Your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-gray-900"
                placeholder="+977 98XXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio / Short Description</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-gray-900"
                placeholder="Tell us a little about yourself..."
              />
            </div>
          </div>

          {/* Email (Disabled) */}
          <div className="space-y-1 opacity-60">
            <label className="text-xs font-medium text-gray-700 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm cursor-not-allowed text-gray-600"
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
