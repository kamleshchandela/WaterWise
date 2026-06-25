import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import Loader from "../components/Loader";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const AnalysisDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return "Just now";
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  useEffect(() => {
    setLoading(true);
    api.get(`/analysis/${id}`)
      .then(res => {
        setAnalysis(res.data.analysis);
        
        const defaultComments = [
          { name: "EcoScan AI", text: "Based on local data, this meal uses a typical regional recipe.", time: "1h" },
          { name: "Priya Das", text: "Is there a way to prepare this with less water? 🤔", time: "30m" }
        ];
        
        const dbComments = (res.data.analysis.comments || []).map(c => ({
          name: c.userId?.name || "Anonymous",
          text: c.text,
          time: formatRelativeTime(c.createdAt)
        }));

        setComments([...defaultComments, ...dbComments]);
      })
      .catch(() => navigate("/home"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !analysis) return;

    try {
      const res = await api.post(`/analysis/${analysis._id}/comment`, { text: newComment });
      
      const defaultComments = [
        { name: "EcoScan AI", text: "Based on local data, this meal uses a typical regional recipe.", time: "1h" },
        { name: "Priya Das", text: "Is there a way to prepare this with less water? 🤔", time: "30m" }
      ];

      const dbComments = (res.data.comments || []).map(c => ({
        name: c.userId?.name || "Anonymous",
        text: c.text,
        time: formatRelativeTime(c.createdAt)
      }));

      setComments([...defaultComments, ...dbComments]);
      setNewComment("");
      toast.success("Comment added!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to post comment");
    }
  };

  const getWaterLevel = (liters) => {
    if (liters < 500) return { label: "Low Footprint", color: "text-green-500", barColor: "bg-green-500", pct: 25 };
    if (liters <= 1200) return { label: "Moderate Footprint", color: "text-amber-500", barColor: "bg-amber-500", pct: 60 };
    return { label: "High Footprint", color: "text-rose-500", barColor: "bg-rose-500", pct: 90 };
  };

  const getInitials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";

  if (loading) return <div className="min-h-screen bg-[#fafafa] dark:bg-black flex items-center justify-center"><Loader /></div>;
  if (!analysis) return null;

  const level = getWaterLevel(analysis.waterUsedLiters);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-black pb-28 text-black dark:text-white transition-colors duration-200">
      
      {/* Detail Header */}
      <header className="sticky top-0 bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-zinc-800 h-14 flex items-center justify-between px-4 z-40 transition-colors duration-200">
        <button onClick={() => navigate(-1)} className="text-gray-700 dark:text-zinc-300 w-8 h-8 flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="font-extrabold text-sm tracking-wide">Footprint Report</h2>
        <button onClick={() => toast("Options clicked")} className="text-gray-700 dark:text-zinc-300 w-8 h-8 flex items-center justify-center">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>
        </button>
      </header>

      {/* Report details contents */}
      <div className="max-w-[430px] mx-auto pt-3 px-4 space-y-5">
        
        {/* Post Food Image */}
        <div className="aspect-square bg-gray-50 dark:bg-zinc-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-sm">
          <img src={analysis.imageUrl} alt={analysis.foodItemDetected} className="w-full h-full object-cover" />
        </div>

        {/* Footprint metrics card */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-zinc-800 space-y-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold uppercase tracking-wider">
              <span>🍽️</span> Analyzed Food Item
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{analysis.foodItemDetected || "Unknown Food"}</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 border-y border-gray-100 dark:border-zinc-800 py-3">
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Water Used</div>
              <div className="text-2xl font-extrabold text-blue-500 mt-0.5">{analysis.waterUsedLiters?.toLocaleString()} Liters</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Eco Status</div>
              <div className={`text-sm font-extrabold mt-1.5 ${level.color}`}>{level.label}</div>
            </div>
          </div>

          {/* Visual Footprint Gauge */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase">
              <span>Low (0L)</span>
              <span>Mod (800L)</span>
              <span>High (1500L+)</span>
            </div>
            <div className="w-full h-3 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden relative">
              <div className={`h-full ${level.barColor} rounded-full transition-all duration-500`} style={{ width: `${level.pct}%` }}></div>
            </div>
          </div>

          {/* Location & category badges */}
          <div className="flex flex-wrap gap-2 text-xs text-gray-500 pt-1">
            <span className="bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 px-2.5 py-1 rounded-full font-medium">📍 {analysis.userDistrict}, {analysis.userState}</span>
            <span className="bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 px-2.5 py-1 rounded-full font-medium capitalize">🥗 Preference: {analysis.dietaryCategoryUsed}</span>
          </div>
        </div>

        {/* Better alternatives carousel */}
        {analysis.alternatives && analysis.alternatives.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-1.5">
              <span>🔄</span> Better Alternatives to Save Water
            </h3>
            
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar select-none">
              {analysis.alternatives.map((alt, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-[#1c1c1e] rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-sm w-[230px] flex-shrink-0 active-scale transition-transform"
                >
                  <img
                    src={alt.imageUrl}
                    alt={alt.name}
                    className="w-full h-28 object-cover"
                    onError={(e) => { e.target.src = "https://via.placeholder.com/400x300/eee?text=Food" }}
                  />
                  <div className="p-3 space-y-2">
                    <div>
                      <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate">{alt.name}</h4>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 truncate mt-0.5">{alt.description}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                        💧 {alt.waterUsedLiters?.toLocaleString()}L
                      </span>
                      <span className="text-[10px] font-semibold bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                        💚 Save {alt.waterSavedLiters?.toLocaleString()}L
                      </span>
                    </div>

                    <a
                      href={alt.googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-8 bg-primary hover:bg-blue-600 text-white font-bold text-[10px] rounded-lg flex items-center justify-center gap-1 active-scale transition-all"
                    >
                      <span>📍</span> Find Near Me
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments section */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-zinc-800 space-y-3.5">
          <h3 className="font-bold text-sm text-gray-800 dark:text-white">Discussion</h3>
          
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="text-center text-gray-400 text-xs py-4">No comments yet.</p>
            ) : (
              comments.map((c, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-white text-[9px] font-bold">
                    {getInitials(c.name)}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 dark:bg-zinc-900/60 p-2.5 rounded-xl">
                      <span className="font-bold text-gray-900 dark:text-white mr-1.5">{c.name}</span>
                      <span className="text-gray-800 dark:text-gray-300">{c.text}</span>
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1 block ml-2">{c.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add comment in detail */}
          <form onSubmit={handleAddComment} className="flex gap-2 items-center pt-2 border-t border-gray-100 dark:border-zinc-800/80">
            <input
              type="text"
              placeholder="Add comment..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="flex-1 h-9 px-3.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs rounded-xl focus:outline-none focus:border-primary text-black dark:text-white"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="text-xs font-bold text-primary dark:text-secondary disabled:opacity-50 px-2"
            >
              Post
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default AnalysisDetail;
