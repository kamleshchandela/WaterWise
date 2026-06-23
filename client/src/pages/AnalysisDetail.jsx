import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import AlternativeCard from "../components/AlternativeCard";
import WaterBadge from "../components/WaterBadge";
import Loader from "../components/Loader";

const AnalysisDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/analysis/${id}`)
      .then(res => setAnalysis(res.data.analysis))
      .catch(() => navigate("/home"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen bg-bg flex items-center justify-center"><Loader /></div>;
  if (!analysis) return null;

  return (
    <div className="min-h-screen bg-bg pb-20">
      <div className="max-w-[430px] mx-auto">
        <div className="relative">
          <img src={analysis.imageUrl} alt={analysis.foodItemDetected} className="w-full aspect-[16/9] object-cover" />
          <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white">
            ←
          </button>
        </div>

        <div className="px-4 -mt-6 relative z-10">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🍽️</span>
              <h2 className="text-xl font-bold text-gray-800">{analysis.foodItemDetected || "Unknown Food"}</h2>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <WaterBadge liters={analysis.waterUsedLiters} size="lg" />
              <span className="text-sm text-gray-400">water used</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
              <span>📍 {analysis.userDistrict}, {analysis.userState}</span>
              <span>•</span>
              <span className="capitalize">🥗 {analysis.dietaryCategoryUsed}</span>
            </div>
          </div>
        </div>

        {analysis.alternatives && analysis.alternatives.length > 0 && (
          <div className="px-4 mt-4">
            <h3 className="font-semibold text-gray-800 mb-3">── Better Alternatives ──</h3>
            <div className="space-y-3">
              {analysis.alternatives.map((alt, i) => (
                <AlternativeCard key={i} alt={alt} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisDetail;
