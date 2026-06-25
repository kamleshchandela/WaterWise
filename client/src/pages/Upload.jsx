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
  const [caption, setCaption] = useState("");

  // Live Camera states
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  const galleryRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (showAppGallery && pastAnalyses.length === 0) {
      api.get("/analysis/history")
        .then(res => setPastAnalyses(res.data.analyses || []))
        .catch(() => {});
    }
  }, [showAppGallery]);

  // Handle Camera initialization
  useEffect(() => {
    if (!preview && !showAppGallery && !loading) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [preview, showAppGallery, loading]);

  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive, preview]);

  const startCamera = async () => {
    setCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access failed", err);
      setCameraError(true);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !cameraActive) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext("2d");
    
    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], "captured-food.jpg", { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      setPreview(url);
      setSelectedFile(file);
      setSource("camera");
      setSelectedFromApp(null);
      stopCamera();
    }, "image/jpeg", 0.95);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setSource("gallery");
    setSelectedFromApp(null);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
    stopCamera();
  };

  const handleAppImageSelect = (analysis) => {
    setSelectedFromApp(analysis);
    setSelectedFile(null);
    setPreview(analysis.imageUrl);
    setSource("app");
    setShowAppGallery(false);
    stopCamera();
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
        if (caption.trim()) {
          formData.append("caption", caption.trim());
        }
        res = await api.post("/analysis/upload", formData);
      }

      toast.success("AI Water Footprint analysis complete!");
      navigate(`/analysis/${res.data.analysis._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setPreview(null);
    setSelectedFile(null);
    setSelectedFromApp(null);
    setSource(null);
    setCaption("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-black flex items-center justify-center text-black dark:text-white">
        <Loader message="🤖 Groq AI analyzes water footprint..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-black pb-24 text-black dark:text-white transition-colors duration-200">
      
      {/* Top Header */}
      <header className="sticky top-0 bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-zinc-800 h-14 flex items-center justify-between px-4 z-40 transition-colors duration-200">
        {preview ? (
          <button onClick={clearSelection} className="text-sm font-semibold text-gray-500 dark:text-zinc-400">Cancel</button>
        ) : (
          <div className="w-12"></div>
        )}
        <h2 className="font-extrabold text-sm tracking-wide">New Post</h2>
        {preview ? (
          <button onClick={handleAnalyze} className="text-sm font-bold text-primary dark:text-secondary hover:scale-105 active:scale-95 transition-transform">Share</button>
        ) : (
          <div className="w-12"></div>
        )}
      </header>

      {/* Upload layout */}
      <div className="max-w-[430px] mx-auto pt-3 px-4">
        
        {/* Main Crop Area / Preview / Live Camera Box */}
        <div className="aspect-square bg-black border border-zinc-800 dark:border-zinc-850 rounded-lg overflow-hidden flex items-center justify-center relative mb-4">
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-8 select-none flex flex-col items-center justify-center text-white">
              {cameraError ? (
                <>
                  <div className="text-5xl mb-4">⚠️</div>
                  <p className="text-sm font-semibold text-zinc-400">Camera Access Failed</p>
                  <p className="text-xs text-zinc-500 mt-1 mb-4">Please grant permission or upload from gallery.</p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-1.5 bg-blue-500 text-white font-bold text-xs rounded-lg active-scale"
                  >
                    Retry Camera
                  </button>
                </>
              ) : (
                <Loader message="Initializing Camera..." />
              )}
            </div>
          )}
        </div>

        {/* Input Triggers */}
        <input type="file" accept="image/*" onChange={handleFileChange} ref={galleryRef} className="hidden" />

        {/* Caption form & Metadata (if image loaded) */}
        {preview && (
          <div className="space-y-3.5 mb-6">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Post details</h4>
            <textarea
              placeholder="Write a description or caption..."
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="w-full h-20 p-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs rounded-xl focus:outline-none focus:border-primary text-black dark:text-white"
            />
          </div>
        )}

        {/* Premium Camera Controls (if no preview) */}
        {!preview && (
          <div className="flex items-center justify-between px-8 py-4 bg-white dark:bg-[#121212] rounded-2xl border border-gray-150 dark:border-zinc-850 mt-2 shadow-sm">
            {/* Gallery Button */}
            <button
              onClick={() => galleryRef.current?.click()}
              className="flex flex-col items-center justify-center w-12 h-12 bg-gray-50 dark:bg-zinc-900 rounded-full border border-gray-150 dark:border-zinc-850 active-scale"
              title="Open Gallery"
            >
              <span className="text-xl">🖼️</span>
            </button>

            {/* Shutter Capture Button */}
            <button
              onClick={capturePhoto}
              disabled={!cameraActive}
              className="w-18 h-18 rounded-full border-[5px] border-gray-300 dark:border-zinc-700 bg-transparent flex items-center justify-center active-scale disabled:opacity-50"
              title="Capture Photo"
            >
              <div className="w-14 h-14 rounded-full bg-white shadow-inner"></div>
            </button>

            {/* Empty Spacer to balance layout and keep shutter centered */}
            <div className="w-12 h-12" />
          </div>
        )}

      </div>

    </div>
  );
};

export default Upload;
