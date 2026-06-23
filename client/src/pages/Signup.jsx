import { useState } from "react";
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
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const getDistricts = () => DISTRICTS[form.state] || DISTRICTS["default"];

  const handleSignup = async () => {
    setLoading(true);
    setServerError("");
    try {
      const res = await api.post("/auth/signup", form);
      toast.success("Account created!");
      login(res.data.token, res.data.user);
    } catch (err) {
      const msg = err.response?.data?.message || "Signup failed";
      setServerError(msg);
      if (msg === "Email already registered") {
        toast((t) => (
          <div className="flex flex-col gap-2">
            <span>Email already registered</span>
            <button onClick={() => { toast.dismiss(t.id); navigate("/login"); }} className="bg-primary text-white px-3 py-1 rounded-lg text-sm font-medium">
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
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[430px]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">💧 WaterWise</h1>
          <p className="text-gray-500 text-sm mt-1">Know your food's water footprint</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map(s => (
              <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === s ? "bg-primary text-white" : step > s ? "bg-green-100 text-success" : "bg-gray-100 text-gray-400"}`}>
                {step > s ? "✓" : s}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Basic Info</h2>
              <input type="text" placeholder="Full Name" value={form.name} onChange={e => update("name", e.target.value)} className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:border-primary focus:bg-white" />
              <input type="email" placeholder="Email" value={form.email} onChange={e => update("email", e.target.value)} className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:border-primary focus:bg-white" />
              <input type="tel" placeholder="Phone (optional)" value={form.phone} onChange={e => update("phone", e.target.value)} className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:border-primary focus:bg-white" />
              <input type="password" placeholder="Password" value={form.password} onChange={e => update("password", e.target.value)} className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:border-primary focus:bg-white" />
              <button onClick={() => setStep(2)} disabled={!form.name || !form.email || !form.password} className="w-full h-12 bg-primary text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Your Location</h2>
              <select value={form.state} onChange={e => { update("state", e.target.value); update("district", ""); }} className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:border-primary focus:bg-white appearance-none">
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={form.district} onChange={e => update("district", e.target.value)} className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:border-primary focus:bg-white appearance-none">
                <option value="">Select District</option>
                {getDistricts().map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 h-12 bg-gray-100 text-gray-600 font-semibold rounded-xl">Back</button>
                <button onClick={() => setStep(3)} disabled={!form.state || !form.district} className="flex-1 h-12 bg-primary text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Dietary Preference</h2>
              {serverError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3">
                  {serverError === "Email already registered" ? (
                    <span>This email is already registered. <button onClick={() => navigate("/login")} className="font-medium underline">Log in</button></span>
                  ) : serverError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {dietaryOptions.map(opt => (
                  <button key={opt.value} onClick={() => update("dietaryCategory", opt.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${form.dietaryCategory === opt.value ? "border-primary bg-blue-50" : "border-gray-100 bg-gray-50"}`}>
                    <div className="text-xl mb-1">{opt.label.split(" ")[0]}</div>
                    <div className="font-medium text-gray-800">{opt.label.split(" ").slice(1).join(" ")}</div>
                    <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 h-12 bg-gray-100 text-gray-600 font-semibold rounded-xl">Back</button>
                <button onClick={handleSignup} disabled={!form.dietaryCategory || !form.name || !form.email || !form.password || !form.state || !form.district || loading} className="flex-1 h-12 bg-primary text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account? <Link to="/login" className="text-primary font-medium">Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
