import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill all fields");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      toast.success("Welcome back!");
      login(res.data.token, res.data.user);
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[430px]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">💧 WaterWise</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Login</h2>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:border-primary focus:bg-white" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:border-primary focus:bg-white" />
          <button type="submit" disabled={loading} className="w-full h-12 bg-primary text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account? <Link to="/" className="text-primary font-medium">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
