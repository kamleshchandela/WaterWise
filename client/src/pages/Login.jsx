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
      toast.success("Welcome back to Watergram!");
      login(res.data.token, res.data.user);
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-black flex flex-col items-center justify-center p-4 text-black dark:text-white transition-colors duration-200">
      <div className="w-full max-w-[350px] space-y-3">
        
        {/* Instagram Login Card */}
        <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-zinc-800 rounded-lg p-8 flex flex-col items-center shadow-sm">
          <h1 className="instagram-logo-text text-4xl font-semibold tracking-wide bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-6 select-none">
            Watergram
          </h1>
          
          <form onSubmit={handleLogin} className="w-full space-y-3.5">
            <div className="relative">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-10 px-3 bg-[#fafafa] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs rounded focus:outline-none focus:border-gray-400 dark:focus:border-zinc-600 text-black dark:text-white placeholder-gray-400"
                required
              />
            </div>
            
            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-10 px-3 bg-[#fafafa] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs rounded focus:outline-none focus:border-gray-400 dark:focus:border-zinc-600 text-black dark:text-white placeholder-gray-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-8.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-xs rounded flex items-center justify-center gap-1.5 active:scale-98 transition-transform"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              {loading ? "Signing In..." : "Log In"}
            </button>
          </form>

          {/* Separator */}
          <div className="flex items-center w-full my-5">
            <div className="flex-1 h-[1px] bg-gray-200 dark:bg-zinc-800"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase px-3.5 select-none">OR</span>
            <div className="flex-1 h-[1px] bg-gray-200 dark:bg-zinc-800"></div>
          </div>

          <button
            onClick={() => toast("Facebook Login mockup 👤")}
            className="text-xs font-bold text-blue-900 dark:text-blue-400 flex items-center gap-1.5 hover:underline"
          >
            <span className="text-sm">👤</span> Log in with Facebook
          </button>
        </div>

        {/* Bottom Signup redirection card */}
        <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-zinc-800 rounded-lg p-5 text-center text-xs shadow-sm">
          <p className="text-gray-500 dark:text-gray-400">
            Don't have an account?{" "}
            <Link to="/" className="text-blue-500 font-bold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
