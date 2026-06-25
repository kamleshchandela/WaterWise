import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import Loader from "../components/Loader";
import toast from "react-hot-toast";

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

const dietLabel = (cat) => {
  if (cat === "vegetarian") return { icon: "🌿", label: "Veg", color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30" };
  if (cat === "jain") return { icon: "🟤", label: "Jain", color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30" };
  if (cat === "eggetarian") return { icon: "🥚", label: "Egg", color: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30" };
  return { icon: "🍗", label: "Non-Veg", color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30" };
};

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [posts, setPosts] = useState([]);
  const [myStories, setMyStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState("grid"); // "grid" | "stats"
  const navigate = useNavigate();

  // Story viewer state
  const [viewingStory, setViewingStory] = useState(null);
  const [storyIdx, setStoryIdx] = useState(0);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "", dietaryCategory: "", state: "", district: "", bio: ""
  });
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [updating, setUpdating] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => { fetchProfileData(); }, []);

  const fetchProfileData = () => {
    setLoading(true);
    api.get("/user/profile")
      .then(res => {
        setStats(res.data.stats);
        if (res.data.user) {
          updateUser(res.data.user);
          setEditForm({
            name: res.data.user.name || "",
            dietaryCategory: res.data.user.dietaryCategory || "",
            state: res.data.user.state || "",
            district: res.data.user.district || "",
            bio: res.data.user.bio || ""
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        Promise.all([
          api.get("/analysis/my-posts"),
          api.get("/user/my-stories")
        ])
          .then(([postsRes, storiesRes]) => {
            setPosts(postsRes.data.analyses || []);
            setMyStories(storiesRes.data.stories || []);
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      });
  };

  const handleImageSelect = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    setEditImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setEditImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const fd = new FormData();
      fd.append("name", editForm.name);
      fd.append("dietaryCategory", editForm.dietaryCategory);
      fd.append("state", editForm.state);
      fd.append("district", editForm.district);
      fd.append("bio", editForm.bio ?? "");
      if (editImageFile) fd.append("profileImage", editImageFile);

      // multipart/form-data header required for file upload
      const res = await api.put("/user/profile", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data.success) {
        updateUser(res.data.user);
        toast.success("Profile updated successfully!");
        setShowEditModal(false);
        setEditImageFile(null);
        setEditImagePreview("");
        fetchProfileData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const getInitials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";
  const getDistricts = () => DISTRICTS[editForm.state] || DISTRICTS["default"];
  const formatWater = (liters) => liters ? liters.toLocaleString() + "L" : "0L";

  const bestMeal = posts.length > 0
    ? posts.reduce((min, p) => p.waterUsedLiters < min.waterUsedLiters ? p : min, posts[0])
    : null;
  const totalWater = posts.reduce((sum, p) => sum + (p.waterUsedLiters || 0), 0);
  const diet = dietLabel(user?.dietaryCategory);

  // Story viewer helpers
  const openStory = (idx) => { setStoryIdx(idx); setViewingStory(myStories[idx]); };
  const closeStory = () => setViewingStory(null);
  const nextStory = () => {
    if (storyIdx < myStories.length - 1) { setStoryIdx(s => s + 1); setViewingStory(myStories[storyIdx + 1]); }
    else closeStory();
  };
  const prevStory = () => {
    if (storyIdx > 0) { setStoryIdx(s => s - 1); setViewingStory(myStories[storyIdx - 1]); }
  };

  const profileImageSrc = editImagePreview || user?.profileImage;

  if (loading) return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-black flex items-center justify-center">
      <Loader />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-black pb-24 text-black dark:text-white transition-colors duration-200">

      {/* Top Header */}
      <header className="sticky top-0 bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-zinc-800 h-14 flex items-center justify-between px-4 z-40 transition-colors duration-200">
        <div className="w-8" />
        <h2 className="font-bold text-sm tracking-wide truncate max-w-[200px]">{user?.email}</h2>
        <button
          onClick={logout}
          className="text-red-500 hover:scale-105 active:scale-95 transition-all w-8 h-8 flex items-center justify-center"
          title="Log Out"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </header>

      <div className="max-w-[430px] mx-auto px-4 pt-5">

        {/* ── Avatar + Stats Row ── */}
        <div className="flex items-center gap-6 mb-5 select-none">
          {/* Avatar ring — clickable to open edit */}
          <div
            className="relative w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex-shrink-0 shadow-lg cursor-pointer group"
            onClick={() => setShowEditModal(true)}
          >
            <div className="w-full h-full bg-white dark:bg-black rounded-full p-[2px]">
              {profileImageSrc ? (
                <img
                  src={profileImageSrc}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-extrabold shadow-inner">
                  {getInitials(user?.name)}
                </div>
              )}
            </div>
            {/* Camera overlay on hover */}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>
          </div>

          {/* Stats numbers */}
          <div className="flex-1 grid grid-cols-3 gap-1 text-center">
            <div>
              <div className="text-lg font-extrabold text-gray-900 dark:text-white leading-tight">{posts.length}</div>
              <div className="text-[10px] text-gray-400 font-medium">Scans</div>
            </div>
            <div>
              <div className="text-lg font-extrabold text-blue-500 leading-tight">{formatWater(stats?.avgWaterPerMeal)}</div>
              <div className="text-[10px] text-gray-400 font-medium">Avg Water</div>
            </div>
            <div>
              <div className="text-lg font-extrabold text-emerald-500 leading-tight">{formatWater(stats?.waterSaved)}</div>
              <div className="text-[10px] text-gray-400 font-medium">Saved</div>
            </div>
          </div>
        </div>

        {/* ── Bio ── */}
        <div className="mb-4">
          <h3 className="font-extrabold text-gray-900 dark:text-white text-base leading-tight">{user?.name}</h3>
          <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2">
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${diet.color}`}>
              {diet.icon} {diet.label}
            </span>
            <span className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              📍 {user?.district}, {user?.state}
            </span>
          </div>
          {user?.bio ? (
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{user.bio}</p>
          ) : (
            <p className="text-xs text-gray-400 leading-relaxed italic">
              🌱 Tracking my water footprint, one meal at a time. 🌎💧
            </p>
          )}
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setShowEditModal(true)}
            className="flex-1 h-9 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 font-bold rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Edit Profile
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Profile link copied!"); }}
            className="flex-1 h-9 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 font-bold rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Share Profile
          </button>
        </div>

        {/* ── Stories Row ── */}
        <div className="flex gap-4 overflow-x-auto pb-4 border-b border-gray-200 dark:border-zinc-800 no-scrollbar mb-1 select-none">
          {/* Add Story Button */}
          <div
            className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
            onClick={() => navigate("/upload?tab=story")}
          >
            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-zinc-800 border-2 border-dashed border-gray-300 dark:border-zinc-600 flex items-center justify-center text-2xl mb-1 group-hover:scale-105 active:scale-95 transition-transform shadow-sm">
              <span className="text-gray-400 text-3xl font-light leading-none">+</span>
            </div>
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Add Story</span>
          </div>

          {/* Existing Stories */}
          {myStories.map((story, idx) => (
            <div
              key={story._id}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
              onClick={() => openStory(idx)}
            >
              <div className="w-14 h-14 rounded-full p-[2.5px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 group-hover:scale-105 active:scale-95 transition-transform shadow-sm">
                <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-black p-[1.5px]">
                  <img
                    src={story.imageUrl}
                    alt="story"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mt-1 max-w-[56px] truncate">
                {new Date(story.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}

          {/* Highlight circles (goals, best meal, analytics) */}
          <div className="flex flex-col items-center flex-shrink-0 cursor-pointer group" onClick={() => toast("Goals: Save 5,000L this month! 🎯")}>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-100 to-rose-200 dark:from-pink-950/40 dark:to-rose-900/30 border-2 border-rose-200 dark:border-rose-800 flex items-center justify-center text-xl mb-1 group-hover:scale-105 active:scale-95 transition-transform shadow-sm">
              🎯
            </div>
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Goals</span>
          </div>
          <div className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
            onClick={() => bestMeal ? toast(`Best: ${bestMeal.foodItemDetected} (${bestMeal.waterUsedLiters}L) 🏆`) : toast("No scans yet!")}>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-100 to-amber-200 dark:from-yellow-950/40 dark:to-amber-900/30 border-2 border-amber-200 dark:border-amber-800 flex items-center justify-center text-xl mb-1 group-hover:scale-105 active:scale-95 transition-transform shadow-sm">
              🏆
            </div>
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Best Meal</span>
          </div>
          <div className="flex flex-col items-center flex-shrink-0 cursor-pointer group" onClick={() => navigate("/stats")}>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-950/40 dark:to-green-900/30 border-2 border-green-200 dark:border-green-800 flex items-center justify-center text-xl mb-1 group-hover:scale-105 active:scale-95 transition-transform shadow-sm">
              📊
            </div>
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Analytics</span>
          </div>
        </div>

        {/* ── Tab Switcher ── */}
        <div className="flex border-b border-gray-200 dark:border-zinc-800 select-none">
          <button
            onClick={() => setActiveTab("grid")}
            className={`flex-1 py-3 flex justify-center border-b-2 transition-colors ${activeTab === "grid" ? "border-black dark:border-white text-black dark:text-white" : "border-transparent text-gray-400"}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex-1 py-3 flex justify-center border-b-2 transition-colors ${activeTab === "stats" ? "border-black dark:border-white text-black dark:text-white" : "border-transparent text-gray-400"}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
            </svg>
          </button>
        </div>

        {/* ── Tab Content ── */}
        <div className="pt-0.5 pb-8">
          {activeTab === "grid" ? (
            posts.length === 0 ? (
              <div className="text-center py-20 px-4">
                <div className="text-5xl mb-4">📸</div>
                <p className="font-bold text-gray-700 dark:text-gray-300">No scans yet</p>
                <p className="text-xs text-gray-400 mt-1">Scan a meal to start building your food journey gallery!</p>
                <button
                  onClick={() => navigate("/upload")}
                  className="mt-5 h-10 px-6 bg-primary text-white font-bold text-xs rounded-xl active-scale shadow-md"
                >
                  Scan My First Meal 📷
                </button>
              </div>
            ) : (
              <>
                <div className="py-3 px-1 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Your Food Journey · {posts.length} meals
                  </span>
                  <span className="text-[11px] font-bold text-blue-500">
                    💧 {totalWater.toLocaleString()}L total
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-0.5">
                  {posts.map((post, index) => {
                    const isFeature = index % 7 === 0;
                    return (
                      <div
                        key={post._id}
                        onClick={() => navigate(`/analysis/${post._id}`)}
                        className={`relative overflow-hidden cursor-pointer group active-scale bg-gray-100 dark:bg-zinc-900 ${
                          isFeature ? "col-span-2 row-span-2" : "col-span-1 row-span-1"
                        }`}
                        style={{ aspectRatio: "1 / 1" }}
                      >
                        <img
                          src={post.imageUrl}
                          alt={post.foodItemDetected}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2">
                          <p className="text-white text-[10px] font-bold leading-tight truncate">{post.foodItemDetected}</p>
                          <p className="text-blue-300 text-[9px] font-semibold">💧 {post.waterUsedLiters?.toLocaleString()}L</p>
                        </div>
                        <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full opacity-70 group-hover:opacity-0 transition-opacity">
                          💧{post.waterUsedLiters >= 1000 ? (post.waterUsedLiters / 1000).toFixed(1) + "k" : post.waterUsedLiters}L
                        </div>
                        <div className={`absolute top-1.5 left-1.5 w-2 h-2 rounded-full ${
                          post.dietaryCategoryUsed === "vegetarian" ? "bg-green-400" :
                          post.dietaryCategoryUsed === "jain" ? "bg-amber-400" :
                          post.dietaryCategoryUsed === "eggetarian" ? "bg-yellow-300" :
                          "bg-red-400"
                        } shadow-sm opacity-80`} />
                      </div>
                    );
                  })}
                </div>
              </>
            )
          ) : (
            /* Stats Panel */
            <div className="space-y-3 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4">
                  <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{formatWater(stats?.avgWaterPerMeal)}</div>
                  <div className="text-[10px] text-blue-500 dark:text-blue-400 font-semibold mt-0.5">Avg per meal</div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4">
                  <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatWater(stats?.waterSaved)}</div>
                  <div className="text-[10px] text-emerald-500 dark:text-emerald-400 font-semibold mt-0.5">Water saved</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-2xl p-4">
                  <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{posts.length}</div>
                  <div className="text-[10px] text-purple-500 dark:text-purple-400 font-semibold mt-0.5">Total scans</div>
                </div>
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-4">
                  <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{formatWater(totalWater)}</div>
                  <div className="text-[10px] text-rose-500 dark:text-rose-400 font-semibold mt-0.5">Total consumed</div>
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Avg vs Goal (1,000L)</span>
                  <span className={`text-xs font-extrabold ${stats?.avgWaterPerMeal > 1000 ? "text-rose-500" : "text-emerald-500"}`}>
                    {stats?.avgWaterPerMeal > 1000 ? "⚠️ Above" : "✅ On Track"}
                  </span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${stats?.avgWaterPerMeal > 1000 ? "bg-rose-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(100, ((stats?.avgWaterPerMeal || 0) / 2000) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[9px] text-gray-400">
                  <span>0L</span><span>Goal: 1,000L</span><span>2,000L</span>
                </div>
              </div>
              {bestMeal && (
                <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden flex items-center gap-3 p-3">
                  <img src={bestMeal.imageUrl} alt={bestMeal.foodItemDetected} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  <div>
                    <div className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wider">🏆 Best Low-Water Meal</div>
                    <div className="text-xs font-bold text-gray-800 dark:text-white mt-0.5">{bestMeal.foodItemDetected}</div>
                    <div className="text-[10px] text-blue-500 font-semibold">💧 {bestMeal.waterUsedLiters?.toLocaleString()}L</div>
                  </div>
                </div>
              )}
              <button
                onClick={() => navigate("/stats")}
                className="w-full h-10 bg-primary text-white font-bold text-xs rounded-xl active-scale transition-transform shadow-md"
              >
                Open Full Analytics →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Story Full-screen Viewer ── */}
      {viewingStory && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Progress bars */}
          <div className="flex gap-1 p-2 pt-safe">
            {myStories.map((_, i) => (
              <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/30">
                <div className={`h-full bg-white rounded-full ${i < storyIdx ? "w-full" : i === storyIdx ? "animate-story-progress" : "w-0"}`} />
              </div>
            ))}
          </div>

          {/* Story image */}
          <div className="flex-1 relative flex items-center justify-center">
            <img src={viewingStory.imageUrl} alt="story" className="max-h-full max-w-full object-contain" />

            {/* Text overlays */}
            {viewingStory.textOverlays && (() => {
              try {
                return JSON.parse(viewingStory.textOverlays).map((ov, i) => (
                  <div
                    key={i}
                    className="absolute text-white font-bold text-center pointer-events-none"
                    style={{ left: `${ov.x}%`, top: `${ov.y}%`, transform: "translate(-50%,-50%)", fontSize: `${ov.fontSize || 20}px`, color: ov.color || "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}
                  >{ov.text}</div>
                ));
              } catch { return null; }
            })()}

            {/* Left / Right tap zones */}
            <button className="absolute left-0 top-0 w-1/2 h-full opacity-0" onClick={prevStory} />
            <button className="absolute right-0 top-0 w-1/2 h-full opacity-0" onClick={nextStory} />
          </div>

          {/* Bottom info */}
          <div className="p-4 pb-safe">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20">
                  {profileImageSrc
                    ? <img src={profileImageSrc} alt="me" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">{getInitials(user?.name)}</div>
                  }
                </div>
                <div>
                  <p className="text-white text-xs font-bold">{user?.name}</p>
                  <p className="text-white/60 text-[10px]">{new Date(viewingStory.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <button onClick={closeStory} className="text-white/80 hover:text-white text-2xl font-light leading-none">✕</button>
            </div>
            <div className="flex gap-4 mt-3 text-white/70 text-xs">
              <span>👁 {viewingStory.views?.length || 0} views</span>
              <span>❤️ {viewingStory.likes?.length || 0} likes</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Profile Modal ── */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl w-full max-w-[360px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Edit Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            {/* Profile Image Editor */}
            <div className="flex flex-col items-center mb-5">
              <div
                className="relative w-20 h-20 rounded-full cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[3px]">
                  <div className="w-full h-full rounded-full bg-white dark:bg-black p-[2px]">
                    {(editImagePreview || user?.profileImage) ? (
                      <img src={editImagePreview || user.profileImage} alt="profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl font-extrabold">
                        {getInitials(user?.name)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => fileInputRef.current?.click()} className="text-[11px] font-bold text-blue-500 hover:underline">📁 Gallery</button>
                <span className="text-gray-300">|</span>
                <button onClick={() => cameraInputRef.current?.click()} className="text-[11px] font-bold text-blue-500 hover:underline">📷 Camera</button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageSelect(e.target.files[0])} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={e => handleImageSelect(e.target.files[0])} />
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Display Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full h-11 px-3.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs rounded-xl focus:outline-none focus:border-primary text-black dark:text-white"
                  required
                />
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell something about yourself..."
                  rows={3}
                  maxLength={150}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs rounded-xl focus:outline-none focus:border-primary text-black dark:text-white resize-none"
                />
                <p className="text-[9px] text-gray-400 text-right">{editForm.bio.length}/150</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Diet Preference</label>
                <select
                  value={editForm.dietaryCategory}
                  onChange={e => setEditForm(prev => ({ ...prev, dietaryCategory: e.target.value }))}
                  className="w-full h-11 px-3.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs rounded-xl focus:outline-none focus:border-primary text-black dark:text-white appearance-none"
                >
                  <option value="vegetarian">Vegetarian</option>
                  <option value="jain">Jain</option>
                  <option value="eggetarian">Eggetarian</option>
                  <option value="nonvegetarian">Non-Vegetarian</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">State</label>
                <select
                  value={editForm.state}
                  onChange={e => setEditForm(prev => ({ ...prev, state: e.target.value, district: "" }))}
                  className="w-full h-11 px-3.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs rounded-xl focus:outline-none focus:border-primary text-black dark:text-white appearance-none"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">District</label>
                <select
                  value={editForm.district}
                  onChange={e => setEditForm(prev => ({ ...prev, district: e.target.value }))}
                  className="w-full h-11 px-3.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs rounded-xl focus:outline-none focus:border-primary text-black dark:text-white appearance-none"
                  disabled={!editForm.state}
                >
                  <option value="">Select District</option>
                  {(DISTRICTS[editForm.state] || DISTRICTS["default"]).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 h-11 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 font-bold rounded-xl text-xs active-scale"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 h-11 bg-primary text-white font-bold rounded-xl text-xs active-scale flex items-center justify-center"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
