import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../utils/api";
import Loader from "../components/Loader";

const Upload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [source, setSource] = useState(null); // "camera" | "gallery" | "app"
  const [loading, setLoading] = useState(false);
  const [showAppGallery, setShowAppGallery] = useState(false);
  const [pastAnalyses, setPastAnalyses] = useState([]);
  const [selectedFromApp, setSelectedFromApp] = useState(null);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (showAppGallery && pastAnalyses.length === 0) {
      api.get("/analysis/history").then(res => setPastAnalyses(res.data.analyses)).catch(() => {});
    }
  }, [showAppGallery]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setSource(file.name === "camera" ? "camera" : "gallery");
    setSelectedFromApp(null);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleAppImageSelect = (analysis) => {
    setSelectedFromApp(analysis);
    setSelectedFile(null);
    setPreview(analysis.imageUrl);
    setSource("app");
    setShowAppGallery(false);
  };

  const handleAnalyze = async () => {
    if (!selectedFile && !selectedFromApp) return toast.error("Select an image first");

    setLoading(true);
    try {
      let res;
      if (source === "app" && selectedFromApp) {
        res = await api.post("/analysis/reanalyze", { analysisId: selectedFromApp._id });
      } else if (selectedFile) {
        const formData = new FormData();
        formData.append("image", selectedFile);
        res = await api.post("/analysis/upload", formData);
      }
      toast.success("Analysis complete!");
      navigate(`/analysis/${res.data.analysis._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader message="🤖 Groq AI is analyzing your food..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-20">
      <div className="max-w-[430px] mx-auto px-4 pt-4">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Analyze Food</h1>
        <p className="text-sm text-gray-500 mb-6">Kaise image lena chahte ho?</p>

        {!preview && (
          <div className="flex gap-3 mb-6">
            <button onClick={() => cameraRef.current?.click()} className="flex-1 flex flex-col items-center gap-2 bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:scale-95 transition-transform">
              <span className="text-3xl">📷</span>
              <span className="text-sm font-medium text-gray-700">Camera</span>
            </button>
            <button onClick={() => galleryRef.current?.click()} className="flex-1 flex flex-col items-center gap-2 bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:scale-95 transition-transform">
              <span className="text-3xl">🖼️</span>
              <span className="text-sm font-medium text-gray-700">Gallery</span>
            </button>
            <button onClick={() => setShowAppGallery(true)} className="flex-1 flex flex-col items-center gap-2 bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:scale-95 transition-transform">
              <span className="text-3xl">📁</span>
              <span className="text-sm font-medium text-gray-700">App Images</span>
            </button>
          </div>
        )}

        <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} ref={cameraRef} className="hidden" />
        <input type="file" accept="image/*" onChange={(e) => { const dt = new DataTransfer(); if (e.target.files[0]) { const f = e.target.files[0]; Object.defineProperty(f, 'name', { value: 'camera' }); dt.items.add(f); e.target.files = dt.files; } handleFileChange(e); }} ref={galleryRef} className="hidden" />

        {preview && (
          <div className="mb-6">
            <img src={preview} alt="Preview" className="w-full aspect-square object-cover rounded-xl" />
            <button onClick={() => { setPreview(null); setSelectedFile(null); setSelectedFromApp(null); setSource(null); }} className="text-sm text-red-500 mt-2">Remove</button>
          </div>
        )}

        {preview && (
          <button onClick={handleAnalyze} className="w-full h-14 bg-primary text-white font-semibold rounded-xl text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg">
            💧 Analyze Water Footprint
          </button>
        )}

        {showAppGallery && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
            <div className="bg-white w-full max-w-[430px] mx-auto rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">📁 App Ki Images</h3>
                <button onClick={() => setShowAppGallery(false)} className="text-gray-400 text-xl">✕</button>
              </div>
              {pastAnalyses.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No past images found</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {pastAnalyses.map(a => (
                    <div key={a._id} onClick={() => handleAppImageSelect(a)} className={`cursor-pointer rounded-lg overflow-hidden border-2 ${selectedFromApp?._id === a._id ? "border-primary" : "border-transparent"} aspect-square`}>
                      <img src={a.imageUrl} alt={a.foodItemDetected} className="w-full h-full object-cover" />
                      <p className="text-xs text-gray-700 mt-1 truncate">{a.foodItemDetected || "Food"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
