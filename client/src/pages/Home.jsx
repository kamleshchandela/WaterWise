import { useState, useEffect } from "react";
import api from "../utils/api";
import ImageCard from "../components/ImageCard";
import Loader from "../components/Loader";

const Home = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/analysis/history")
      .then(res => setAnalyses(res.data.analyses))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-bg pb-20">
      <div className="max-w-[430px] mx-auto px-4 pt-4">
        <h1 className="text-xl font-bold text-primary mb-4">💧 WaterWise</h1>

        {loading ? (
          <Loader message="Loading your feed..." />
        ) : analyses.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📸</div>
            <p className="text-gray-500">No analyses yet</p>
            <p className="text-sm text-gray-400 mt-1">Upload a food photo to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {analyses.map(a => (
              <ImageCard key={a._id} analysis={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
