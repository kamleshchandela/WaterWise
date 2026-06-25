import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const DISTRICTS = {
  "Gujarat": ["Ahmedabad", "Anand", "Banaskantha", "Bharuch", "Bhavnagar", "Dahod", "Gandhinagar", "Jamnagar", "Junagadh", "Kutch", "Kheda", "Mahesana", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Satara", "Sangli", "Jalgaon", "Amravati", "Nanded", "Ratnagiri", "Sindhudurg"],
  "default": ["Delhi", "Mumbai", "Kolkata", "Chennai", "Bangalore", "Hyderabad", "Jaipur", "Lucknow", "Chandigarh", "Bhopal"]
};

const dietaryOptions = [
  { value: "vegetarian", label: "🌿 Veg", desc: "Pure Veg" },
  { value: "jain", label: "🟤 Jain", desc: "No onion/garlic/root" },
  { value: "eggetarian", label: "🥚 Eggetarian", desc: "Veg + Eggs" },
  { value: "nonvegetarian", label: "🍗 Non-Veg", desc: "All foods" }
];

const Signup = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", state: "", district: "", dietaryCategory: "" });
  const [profileImage, setProfileImage] = useState(null);     // File object
  const [profilePreview, setProfilePreview] = useState("");   // base64 preview
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const getDistricts = () => DISTRICTS[form.state] || DISTRICTS["default"];

  const handleImageSelect = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    setProfileImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setProfilePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSignup = async () => {
    if (!profileImage) { toast.error("Profile photo is required!"); return; }
    setLoading(true);
    setServerError("");
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("phone", form.phone);
      formData.append("state", form.state);
      formData.append("district", form.district);
      formData.append("dietaryCategory", form.dietaryCategory);
      formData.append("profileImage", profileImage);

      const res = await api.post("/auth/signup", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Account created! Welcome to Watergram.");
      login(res.data.token, res.data.user);
    } catch (err) {
      const msg = err.response?.data?.message || "Signup failed";
      setServerError(msg);
      if (msg === "Email already registered") {
        toast((t) => (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-gray-800">Email already registered</span>
            <button onClick={() => { toast.dismiss(t.id); navigate("/login"); }} className="bg-primary text-white px-3 py-1.5 rounded text-xs font-bold">
              Login instead
            </button>
          </div>
        ), { duration: 5000 });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-black flex flex-col items-center justify-center p-4 text-black dark:text-white transition-colors duration-200">
      <div className="w-full max-w-[360px] space-y-3">

        {/* Signup Card */}
        <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-zinc-800 rounded-lg p-6 flex flex-col items-center shadow-sm">
          <h1 className="instagram-logo-text text-4xl font-semibold tracking-wide bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-1 select-none">
            Watergram
          </h1>
          <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-wider mb-6">
            Track your meal water footprint
          </p>

          {/* Stepper Dots Indicator — 4 steps now */}
          <div className="flex justify-center gap-3 mb-6">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s
                    ? "bg-primary text-white scale-105"
                    : step > s
                    ? "bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-zinc-600"
                }`}
              >
                {step > s ? "✓" : s}
              </div>
            ))}
          </div>

          {/* ── Step 1: Profile Photo ── */}
          {step === 1 && (
            <div className="w-full flex flex-col items-center space-y-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider self-start">Profile Photo</h2>
              <p className="text-[11px] text-gray-400 self-start -mt-2">Choose a photo that represents you 📸</p>

              {/* Avatar Preview */}
              <div
                className="relative w-28 h-28 rounded-full cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[3px]">
                  <div className="w-full h-full rounded-full bg-white dark:bg-black p-[2px]">
                    {profilePreview ? (
                      <img src={profilePreview} alt="preview" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gray-100 dark:bg-zinc-800 flex flex-col items-center justify-center gap-1">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        <span className="text-[9px] text-gray-400 font-bold">TAP TO ADD</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Edit overlay */}
                <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                </div>
              </div>

              {/* Hidden file inputs */}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageSelect(e.target.files[0])} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={e => handleImageSelect(e.target.files[0])} />

              {/* Buttons */}
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 h-9 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-lg active-scale flex items-center justify-center gap-1.5"
                >
                  📁 Gallery
                </button>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 h-9 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-lg active-scale flex items-center justify-center gap-1.5"
                >
                  📷 Camera
                </button>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!profileImage}
                className="w-full h-9 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-xs rounded active:scale-98 transition-transform mt-1"
              >
                {profileImage ? "Next →" : "Add Photo to Continue"}
              </button>
            </div>
          )}

          {/* ── Step 2: Basic Info ── */}
          {step === 2 && (
            <div className="w-full space-y-3.5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Basic Info</h2>
              <input
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={e => update("name", e.target.value)}
                className="w-full h-10 px-3 bg-[#fafafa] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs rounded focus:outline-none focus:border-gray-400 dark:focus:border-zinc-600 text-black dark:text-white placeholder-gray-400"
              />
              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={e => update("email", e.target.value)}
                className="w-full h-10 px-3 bg-[#fafafa] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs rounded focus:outline-none focus:border-gray-400 dark:focus:border-zinc-600 text-black dark:text-white placeholder-gray-400"
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={form.phone}
                onChange={e => update("phone", e.target.value)}
                className="w-full h-10 px-3 bg-[#fafafa] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs rounded focus:outline-none focus:border-gray-400 dark:focus:border-zinc-600 text-black dark:text-white placeholder-gray-400"
              />
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={e => update("password", e.target.value)}
                className="w-full h-10 px-3 bg-[#fafafa] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs rounded focus:outline-none focus:border-gray-400 dark:focus:border-zinc-600 text-black dark:text-white placeholder-gray-400"
              />
              <div className="flex gap-2 pt-1">
                <button onClick={() => setStep(1)} className="flex-1 h-9 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 font-bold rounded text-xs active-scale">Back</button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!form.name || !form.email || !form.password}
                  className="flex-1 h-9 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded text-xs active-scale"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Location ── */}
          {step === 3 && (
            <div className="w-full space-y-3.5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Location</h2>
              <div className="relative">
                <select
                  value={form.state}
                  onChange={e => { update("state", e.target.value); update("district", ""); }}
                  className="w-full h-10 px-3 bg-[#fafafa] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs rounded focus:outline-none focus:border-gray-400 dark:focus:border-zinc-600 text-black dark:text-white appearance-none"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="relative">
                <select
                  value={form.district}
                  onChange={e => update("district", e.target.value)}
                  className="w-full h-10 px-3 bg-[#fafafa] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs rounded focus:outline-none focus:border-gray-400 dark:focus:border-zinc-600 text-black dark:text-white appearance-none"
                  disabled={!form.state}
                >
                  <option value="">Select District</option>
                  {getDistricts().map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setStep(2)} className="flex-1 h-9 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 font-bold rounded text-xs active-scale">Back</button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!form.state || !form.district}
                  className="flex-1 h-9 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded text-xs active-scale"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Diet preference ── */}
          {step === 4 && (
            <div className="w-full space-y-3.5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dietary Preference</h2>
              {serverError && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs rounded p-2.5">
                  {serverError === "Email already registered" ? (
                    <span>Email already registered. <button onClick={() => navigate("/login")} className="font-bold underline">Log in</button></span>
                  ) : serverError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                {dietaryOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => update("dietaryCategory", opt.value)}
                    className={`p-3 rounded-lg border text-left transition-all active-scale ${
                      form.dietaryCategory === opt.value
                        ? "border-primary bg-blue-50/50 dark:bg-blue-950/20"
                        : "border-gray-200 dark:border-zinc-800 bg-[#fafafa] dark:bg-zinc-900/40"
                    }`}
                  >
                    <div className="text-lg">{opt.label.split(" ")[0]}</div>
                    <div className="font-bold text-xs text-gray-900 dark:text-white mt-1">{opt.label.split(" ").slice(1).join(" ")}</div>
                    <div className="text-[9px] text-gray-400 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setStep(3)} className="flex-1 h-9 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 font-bold rounded text-xs active-scale">Back</button>
                <button
                  onClick={handleSignup}
                  disabled={!form.dietaryCategory || !form.name || !form.email || !form.password || !form.state || !form.district || !profileImage || loading}
                  className="flex-1 h-9 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded text-xs active-scale flex items-center justify-center gap-1.5"
                >
                  {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  {loading ? "Registering..." : "Sign Up"}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Login redirection card */}
        <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-zinc-800 rounded-lg p-5 text-center text-xs shadow-sm">
          <p className="text-gray-500 dark:text-gray-400">
            Have an account?{" "}
            <Link to="/login" className="text-blue-500 font-bold hover:underline">
              Log In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Signup;
