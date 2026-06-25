import { useState, useEffect, useRef } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";

const StoryCreator = ({ isOpen, onClose, onUploadSuccess }) => {
  const [mode, setMode] = useState("capture"); // "capture" | "edit"
  const [selectedMedia, setSelectedMedia] = useState(null); // { url, file, isVideo }
  const [selectedFilter, setSelectedFilter] = useState("filter-none");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  
  // Recording video states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  
  // Overlays state
  const [overlays, setOverlays] = useState([]); // { id, text, x, y, font, color, hasBg, size }
  const [showTextModal, setShowTextModal] = useState(false);
  const [newText, setNewText] = useState("");
  const [newTextColor, setNewTextColor] = useState("#ffffff");
  const [newTextFont, setNewTextFont] = useState("'Poppins', sans-serif");
  const [newTextHasBg, setNewTextHasBg] = useState(false);
  const [selectedOverlayId, setSelectedOverlayId] = useState(null);

  // Background Music tracks
  const [selectedMusic, setSelectedMusic] = useState(null); // { name, url }
  const [showMusicModal, setShowMusicModal] = useState(false);
  const audioPreviewRef = useRef(new Audio());

  const musicTracks = [
    { name: "Vibrant Pop 🎵", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { name: "Chill Lo-Fi 🎹", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { name: "Energetic Beats ⚡", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
    { name: "Acoustic Flow 🎸", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
    { name: "Corporate Tech 💻", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" }
  ];

  // Gallery items state (contains mock preloads + user uploaded ones)
  const [galleryItems, setGalleryItems] = useState([
    { id: "mock1", url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80", isVideo: false },
    { id: "mock2", url: "https://images.unsplash.com/photo-1548826879-d86f2405767c?w=500&q=80", isVideo: false },
    { id: "mock3", url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&q=80", isVideo: false },
    { id: "mock4", url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80", isVideo: false }
  ]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const containerRef = useRef(null);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  const colors = [
    { label: "White", value: "#ffffff" },
    { label: "Black", value: "#000000" },
    { label: "Yellow", value: "#facc15" },
    { label: "Red", value: "#ef4444" },
    { label: "Blue", value: "#3b82f6" },
    { label: "Green", value: "#22c55e" },
    { label: "Neon Pink", value: "#ec4899" }
  ];

  const fonts = [
    { name: "Modern", value: "'Poppins', sans-serif" },
    { name: "Elegant", value: "'Playball', cursive" },
    { name: "Bold", value: "Impact, Charcoal, sans-serif" },
    { name: "Typewriter", value: "'Courier New', Courier, monospace" },
    { name: "Classic", value: "Georgia, serif" }
  ];

  const cssFilters = [
    { name: "None", class: "filter-none" },
    { name: "Lark", class: "brightness-110 contrast-105 saturate-120" },
    { name: "Juno", class: "sepia-[0.15] saturate-150 contrast-110 hue-rotate-15" },
    { name: "Ludwig", class: "brightness-105 saturate-[1.3] contrast-95" },
    { name: "Aden", class: "brightness-115 contrast-90 sepia-[0.25] saturate-85" },
    { name: "Crema", class: "sepia-[0.2] saturate-110 brightness-105 contrast-[1.05]" }
  ];

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen && mode === "capture") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, mode]);

  // Attach stream to video element once cameraActive becomes true
  // (video DOM element must be mounted first)
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  const startCamera = async () => {
    setCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true
      });
      streamRef.current = stream;
      // Mark active — the useEffect above will attach stream to <video>
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

  // Capture Photo from video stream
  const capturePhoto = () => {
    if (!videoRef.current || !cameraActive) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    
    // Draw horizontal flip for front camera feel
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const file = new File([blob], "captured-story.jpg", { type: "image/jpeg" });
      setSelectedMedia({ url, file, isVideo: false });
      stopCamera();
      setMode("edit");
    }, "image/jpeg", 0.95);
  };

  // Record 5s Video
  const startRecording = () => {
    if (!streamRef.current || isRecording) return;
    chunksRef.current = [];
    
    // Try webm or mp4 depending on support
    let options = { mimeType: "video/webm;codecs=vp9,opus" };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: "video/webm" };
    }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        clearInterval(timerRef.current);
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const file = new File([blob], "recorded-story.webm", { type: "video/webm" });
        setSelectedMedia({ url, file, isVideo: true });
        setIsRecording(false);
        setRecordingSeconds(0);
        stopCamera();
        setMode("edit");
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      // Setup 5 seconds timer limit
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds += 1;
        setRecordingSeconds(seconds);
        if (seconds >= 5) {
          stopRecording();
        }
      }, 1000);

    } catch (err) {
      toast.error("Failed to start video recording");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  // Add custom file from browser
  const handleDeviceFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    
    // If video, check 5s warning/restriction
    if (isVideo) {
      toast.success("Tip: Video stories display for 5 seconds maximum! ⏱️");
    }

    const url = URL.createObjectURL(file);
    const newGalleryItem = {
      id: "user_" + Date.now(),
      url,
      file,
      isVideo
    };

    setGalleryItems(prev => [newGalleryItem, ...prev]);
    // Auto-select it
    setSelectedMedia({ url, file, isVideo });
    stopCamera();
    setMode("edit");
  };

  // Select an item from our gallery picker
  const selectGalleryItem = async (item) => {
    if (item.file) {
      setSelectedMedia({ url: item.url, file: item.file, isVideo: item.isVideo });
    } else {
      // It's a mock preloaded URL, let's fetch it and convert to file so it uploadable
      try {
        const response = await fetch(item.url);
        const blob = await response.blob();
        const file = new File([blob], "story-media.jpg", { type: "image/jpeg" });
        setSelectedMedia({ url: item.url, file, isVideo: item.isVideo });
      } catch (err) {
        setSelectedMedia({ url: item.url, file: null, isVideo: item.isVideo });
      }
    }
    stopCamera();
    setMode("edit");
  };

  // Text overlay handlers
  const handleAddText = (e) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const newItem = {
      id: "text_" + Date.now(),
      text: newText,
      x: 50,
      y: 40,
      font: newTextFont,
      color: newTextColor,
      hasBg: newTextHasBg,
      size: 24
    };

    setOverlays(prev => [...prev, newItem]);
    setSelectedOverlayId(newItem.id);
    setNewText("");
    setShowTextModal(false);
  };

  // Drag logic
  const handleStartDrag = (id, e) => {
    e.preventDefault();
    setSelectedOverlayId(id);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    if (!containerRef.current) return;
    const container = containerRef.current.getBoundingClientRect();
    
    const handleDrag = (dragEvent) => {
      const curX = dragEvent.touches ? dragEvent.touches[0].clientX : dragEvent.clientX;
      const curY = dragEvent.touches ? dragEvent.touches[0].clientY : dragEvent.clientY;
      
      let nextX = ((curX - container.left) / container.width) * 100;
      let nextY = ((curY - container.top) / container.height) * 100;
      
      // Limit bounds
      nextX = Math.max(5, Math.min(95, nextX));
      nextY = Math.max(5, Math.min(95, nextY));
      
      setOverlays(prev => prev.map(o => o.id === id ? { ...o, x: nextX, y: nextY } : o));
    };

    const handleEndDrag = () => {
      document.removeEventListener("mousemove", handleDrag);
      document.removeEventListener("mouseup", handleEndDrag);
      document.removeEventListener("touchmove", handleDrag);
      document.removeEventListener("touchend", handleEndDrag);
    };

    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", handleEndDrag);
    document.addEventListener("touchmove", handleDrag);
    document.addEventListener("touchend", handleEndDrag);
  };

  // Share story upload
  const handleShareStory = async () => {
    if (!selectedMedia || !selectedMedia.file) {
      toast.error("Please record/select media file first");
      return;
    }

    const toastId = toast.loading("Uploading story to your profile...");
    
    try {
      const formData = new FormData();
      formData.append("file", selectedMedia.file);
      formData.append("isVideo", selectedMedia.isVideo ? "true" : "false");
      
      // Append text overlays metadata and filter class
      // Append text overlays metadata and filter class
      const storyMeta = {
        overlays: overlays,
        filter: selectedFilter
      };
      formData.append("textOverlays", JSON.stringify(storyMeta));
      if (selectedMusic) {
        formData.append("music", selectedMusic.url);
      }

      const res = await api.post("/analysis/story", formData);
      if (res.data.success) {
        toast.success("Story posted successfully! 🥳 Visible for 24h.", { id: toastId });
        resetCreator();
        onUploadSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed", { id: toastId });
    }
  };

  const handleSelectMusic = (track) => {
    if (selectedMusic?.url === track.url) {
      setSelectedMusic(null);
      audioPreviewRef.current.pause();
    } else {
      setSelectedMusic(track);
      audioPreviewRef.current.src = track.url;
      audioPreviewRef.current.loop = true;
      audioPreviewRef.current.play().catch(() => {});
    }
  };

  const resetCreator = () => {
    setSelectedMedia(null);
    setSelectedFilter("filter-none");
    setOverlays([]);
    setMode("capture");
    setIsRecording(false);
    setRecordingSeconds(0);
    clearInterval(timerRef.current);
    setSelectedOverlayId(null);
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current.src = "";
    }
    setSelectedMusic(null);
  };

  const handleClose = () => {
    stopCamera();
    resetCreator();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center max-w-[430px] mx-auto select-none overflow-hidden font-sans">
      
      {/* ──────────────────────────────────────────────── */}
      {/* CAPTURE MODE                                     */}
      {/* ──────────────────────────────────────────────── */}
      {mode === "capture" && (
        <div className="relative w-full h-full flex flex-col justify-between p-4">
          
          {/* Header */}
          <div className="flex items-center justify-between z-20 text-white pt-2">
            <button onClick={handleClose} className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-lg active-scale">
              ✕
            </button>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white drop-shadow-md">
              Create Story
            </h3>
            <div className="w-9"></div> {/* balance placeholder */}
          </div>

          {/* Camera View Area */}
          <div className="absolute inset-0 bg-[#121212] flex items-center justify-center">
            {/* Video always in DOM so videoRef.current is always available */}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover scale-x-[-1] ${cameraActive && !cameraError ? "block" : "hidden"}`}
            />
            {/* Fallback shown only when camera not active */}
            {(!cameraActive || cameraError) && (
              <div className="text-center px-6 text-gray-400">
                <div className="text-4xl mb-3">📷</div>
                <p className="text-sm font-semibold">
                  {cameraError ? "Camera permission denied" : "Starting camera..."}
                </p>
                <p className="text-xs mt-1 text-gray-500">Use the Gallery button below to pick a photo or video.</p>
              </div>
            )}

            {/* Video recording progress bar */}
            {isRecording && (
              <div className="absolute top-16 left-4 right-4 h-1.5 bg-white/20 rounded overflow-hidden z-20">
                <div
                  className="h-full bg-red-500 transition-all ease-linear duration-1000"
                  style={{ width: `${(recordingSeconds / 5) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Bottom Controls — only two round buttons */}
          <div className="z-20 w-full mb-8">
            <div className="flex items-end justify-around px-6">

              {/* Gallery / File Picker button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-1.5 active-scale"
                title="Choose from Gallery"
              >
                <div className="w-14 h-14 rounded-full bg-black/50 border-2 border-white/30 flex items-center justify-center text-2xl shadow-lg">
                  🖼️
                </div>
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Gallery</span>
              </button>

              {/* Camera Shutter — Photo only */}
              {cameraActive ? (
                <button
                  onClick={capturePhoto}
                  className="w-20 h-20 rounded-full border-[5px] border-white bg-transparent flex items-center justify-center active:scale-90 transition-transform shadow-xl"
                  title="Take Photo"
                >
                  <div className="w-14 h-14 rounded-full bg-white" />
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  className="w-20 h-20 rounded-full bg-primary border-[5px] border-white flex items-center justify-center active:scale-90 transition-transform shadow-xl text-white text-[10px] font-bold text-center leading-tight"
                >
                  Enable<br/>Camera
                </button>
              )}

              {/* Spacer to balance layout */}
              <div className="w-14" />
            </div>
          </div>

          {/* Hidden Input file selector */}
          <input
            type="file"
            accept="image/*,video/*"
            ref={fileInputRef}
            onChange={handleDeviceFileSelect}
            className="hidden"
          />

        </div>
      )}

      {/* ──────────────────────────────────────────────── */}
      {/* EDIT MODE (APPLY FILTER AND ADD TEXT)             */}
      {/* ──────────────────────────────────────────────── */}
      {mode === "edit" && selectedMedia && (
        <div className="relative w-full h-full flex flex-col justify-between p-4">
          
          {/* Editing Toolbar */}
          <div className="flex items-center justify-between z-20 text-white pt-2">
            <button
              onClick={() => { setMode("capture"); startCamera(); }}
              className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-lg active-scale"
              title="Back to camera"
            >
              ←
            </button>

            <div className="flex items-center gap-2">
              {/* Aa Text tool button */}
              <button
                onClick={() => setShowTextModal(true)}
                className="px-4 py-1.5 rounded-full bg-black/40 border border-white/20 text-xs font-bold flex items-center gap-1.5 active-scale"
              >
                <span className="text-sm">Aa</span>
                <span>Text</span>
              </button>

              {/* Music tool button */}
              <button
                onClick={() => setShowMusicModal(true)}
                className={`px-4 py-1.5 rounded-full bg-black/40 border text-xs font-bold flex items-center gap-1.5 active-scale transition-all ${
                  selectedMusic ? "border-yellow-400 text-yellow-400 bg-yellow-500/10" : "border-white/20"
                }`}
              >
                <span className="text-sm">🎵</span>
                <span>{selectedMusic ? selectedMusic.name.split(" ")[0] : "Music"}</span>
              </button>
            </div>

            <button
              onClick={resetCreator}
              className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-xs active-scale"
              title="Reset Story"
            >
              Reset
            </button>
          </div>

          {/* Preview Container */}
          <div
            ref={containerRef}
            className="absolute inset-0 bg-[#0d0d0d] flex items-center justify-center overflow-hidden"
          >
            {selectedMedia.isVideo ? (
              <video
                src={selectedMedia.url}
                autoPlay
                loop
                muted
                playsInline
                className={`w-full h-full object-cover ${selectedFilter}`}
              />
            ) : (
              <img
                src={selectedMedia.url}
                alt="Selected"
                className={`w-full h-full object-cover ${selectedFilter}`}
              />
            )}

            {/* Text Overlays Render Layer */}
            <div className="absolute inset-0 pointer-events-none">
              {overlays.map(item => (
                <div
                  key={item.id}
                  onMouseDown={(e) => handleStartDrag(item.id, e)}
                  onTouchStart={(e) => handleStartDrag(item.id, e)}
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    transform: "translate(-50%, -50%)",
                    fontFamily: item.font,
                    color: item.color,
                    fontSize: `${item.size}px`,
                  }}
                  className={`absolute pointer-events-auto cursor-move select-none whitespace-nowrap px-2.5 py-1 rounded-lg text-center font-bold tracking-wide active:scale-105 transition-transform ${
                    item.hasBg ? "bg-black/60 backdrop-blur-xs text-white" : ""
                  } ${
                    selectedOverlayId === item.id ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Edit Bar */}
          <div className="z-20 w-full space-y-4 mb-4">

            {/* Font size and styling drawer for the selected text overlay */}
            {selectedOverlayId && (
              <div className="p-3 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-between gap-3 mx-2 animate-fade-in">
                <span className="text-white text-[9px] font-bold uppercase tracking-wider">Font Size</span>
                <input
                  type="range"
                  min="12"
                  max="52"
                  value={overlays.find(o => o.id === selectedOverlayId)?.size || 24}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setOverlays(prev => prev.map(o => o.id === selectedOverlayId ? { ...o, size: val } : o));
                  }}
                  className="flex-1 accent-primary h-1 rounded-lg bg-gray-600 appearance-none cursor-pointer"
                />
                <button
                  onClick={() => setOverlays(prev => prev.filter(o => o.id !== selectedOverlayId))}
                  className="text-red-500 text-[10px] font-black uppercase tracking-wider px-2"
                >
                  Delete
                </button>
              </div>
            )}
            
            {/* Filters Slider Strip */}
            <div className="bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest block mb-2 px-1">
                Swipe Filters
              </span>
              <div className="flex gap-3 overflow-x-auto no-scrollbar">
                {cssFilters.map(filt => (
                  <button
                    key={filt.name}
                    onClick={() => setSelectedFilter(filt.class)}
                    className={`flex flex-col items-center flex-shrink-0 transition-transform ${
                      selectedFilter === filt.class ? "scale-105" : "opacity-70"
                    }`}
                  >
                    {/* Small Filter thumbnail preview */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-transparent select-none bg-zinc-800">
                      <img
                        src={selectedMedia.url}
                        alt="preview"
                        className={`w-full h-full object-cover pointer-events-none ${filt.class}`}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-white mt-1">{filt.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Share Footer */}
            <div className="flex gap-3 justify-end items-center px-2">
              <button
                onClick={resetCreator}
                className="h-11 px-5 rounded-xl border border-white/20 text-white font-bold text-xs active-scale"
              >
                Discard
              </button>
              
              <button
                onClick={handleShareStory}
                className="h-11 px-7 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 text-white font-bold text-xs shadow-lg active-scale flex items-center gap-1"
              >
                <span>🚀</span>
                <span>Share to Story</span>
              </button>
            </div>

          </div>

          {/* Add Text overlay input Modal dialog */}
          {showTextModal && (
            <div className="fixed inset-0 bg-black/85 z-50 flex flex-col justify-between p-4 max-w-[430px] mx-auto animate-fade-in">
              <div className="flex justify-between items-center text-white pt-2">
                <button
                  type="button"
                  onClick={() => setShowTextModal(false)}
                  className="text-white text-xs font-bold"
                >
                  Cancel
                </button>
                
                {/* Background Box button toggle */}
                <button
                  type="button"
                  onClick={() => setNewTextHasBg(!newTextHasBg)}
                  className={`px-3.5 py-1 rounded text-[10px] font-extrabold uppercase transition-all ${
                    newTextHasBg ? "bg-white text-black font-black" : "border border-white text-white"
                  }`}
                >
                  Background
                </button>
                
                <button
                  type="button"
                  disabled={!newText.trim()}
                  onClick={handleAddText}
                  className="text-primary font-bold text-xs disabled:opacity-50"
                >
                  Done
                </button>
              </div>

              {/* Text Input Block */}
              <div className="flex-1 flex items-center justify-center">
                <input
                  type="text"
                  autoFocus
                  placeholder="Type story text..."
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  style={{
                    fontFamily: newTextFont,
                    color: newTextColor,
                  }}
                  className={`w-full max-w-[340px] text-center bg-transparent border-none text-2xl font-bold focus:outline-none placeholder-gray-600 leading-relaxed px-4 py-2 rounded-xl ${
                    newTextHasBg ? "bg-black/60 backdrop-blur-xs text-white" : ""
                  }`}
                />
              </div>

              {/* Styles toolbar selectors */}
              <div className="space-y-4 pb-4">
                {/* Font Selector */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {fonts.map(font => (
                    <button
                      key={font.name}
                      type="button"
                      onClick={() => setNewTextFont(font.value)}
                      style={{ fontFamily: font.value }}
                      className={`h-7 px-3 text-[10px] rounded-full flex-shrink-0 font-bold transition-all border ${
                        newTextFont === font.value
                          ? "bg-white text-black border-white"
                          : "bg-transparent text-white border-zinc-700"
                      }`}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>

                {/* Color Selector */}
                <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 justify-center">
                  {colors.map(col => (
                    <button
                      key={col.label}
                      type="button"
                      onClick={() => setNewTextColor(col.value)}
                      style={{ backgroundColor: col.value }}
                      className={`w-7 h-7 rounded-full border-2 transition-transform flex-shrink-0 ${
                        newTextColor === col.value ? "border-primary scale-110" : "border-white/20"
                      }`}
                      title={col.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Music Selector Modal Dialog */}
          {showMusicModal && (
            <div className="fixed inset-0 bg-black/90 z-50 flex flex-col justify-between p-6 max-w-[430px] mx-auto animate-fade-in text-white">
              <div className="flex justify-between items-center pt-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">Add Music to Story</h3>
                <button
                  type="button"
                  onClick={() => setShowMusicModal(false)}
                  className="text-primary font-bold text-xs bg-white/10 px-3 py-1 rounded-full active-scale"
                >
                  Done
                </button>
              </div>

              {/* Tracks List */}
              <div className="flex-1 overflow-y-auto my-6 space-y-3 pr-1">
                {musicTracks.map(track => {
                  const isCurrent = selectedMusic?.url === track.url;
                  return (
                    <div
                      key={track.url}
                      onClick={() => handleSelectMusic(track)}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer active-scale transition-all ${
                        isCurrent 
                          ? "bg-primary/20 border-primary text-primary font-bold" 
                          : "bg-zinc-900 border-zinc-800 text-gray-300 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                          isCurrent ? "bg-primary text-white animate-bounce" : "bg-zinc-800 text-gray-400"
                        }`}>
                          🎼
                        </div>
                        <div>
                          <h4 className="text-xs font-bold">{track.name}</h4>
                          <span className="text-[9px] text-gray-500 block mt-0.5">Free Instagram Audio</span>
                        </div>
                      </div>
                      <div className="text-xs">
                        {isCurrent ? "⏸️ Playing" : "▶️ Preview"}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pb-4 text-center">
                {selectedMusic ? (
                  <p className="text-[10px] text-yellow-400 font-medium">
                    Selected Track: <span className="font-bold">{selectedMusic.name}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-gray-500">
                    Choose background music to make your footprint story stand out!
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default StoryCreator;
