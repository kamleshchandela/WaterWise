import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import Loader from "../components/Loader";

const Profile = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/user/profile")
      .then(res => setStats(res.data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getInitials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";

  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  };

  const formatWater = (liters) => liters?.toLocaleString() + "L" || "0L";

  if (loading) return <div className="min-h-screen bg-bg flex items-center justify-center"><Loader /></div>;

  return (
    <div className="min-h-screen bg-bg pb-20">
      <div className="max-w-[430px] mx-auto px-4 pt-6">
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3">
            {getInitials(user?.name)}
          </div>
          <h2 className="text-xl font-bold text-gray-800">{user?.name}</h2>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <span>📍 {user?.district}, {user?.state}</span>
            <span>•</span>
            <span className="capitalize">🥗 {user?.dietaryCategory}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <h3 className="font-semibold text-gray-800 mb-3">📊 Your Stats</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{stats?.totalAnalyses || 0}</div>
              <div className="text-xs text-gray-500">Analyses</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">{formatWater(stats?.avgWaterPerMeal)}</div>
              <div className="text-xs text-gray-500">Avg Water</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{formatWater(stats?.waterSaved)}</div>
              <div className="text-xs text-gray-500">Water Saved</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-2">ℹ️ Account Info</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Member since</span>
              <span>{formatDate(user?.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Last login</span>
              <span>{user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("en-IN") : "N/A"}</span>
            </div>
          </div>
        </div>

        <button onClick={logout} className="w-full mt-6 h-12 bg-red-50 text-red-500 font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
