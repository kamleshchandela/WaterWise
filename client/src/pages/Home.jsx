import { useState, useEffect, useRef } from "react";
import api from "../utils/api";
import Loader from "../components/Loader";
import { useTheme } from "../App";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import StoryCreator from "../components/StoryCreator";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "vegetarian" | "jain" | "eggetarian" | "nonvegetarian"
  
  // Real stories list from server
  const [friendStories, setFriendStories] = useState([]);
  
  // Post interaction states
  const [postLikes, setPostLikes] = useState({});
  const [showHeartPop, setShowHeartPop] = useState({});
  const [commentsModal, setCommentsModal] = useState(null); // post object or null
  const [activeComments, setActiveComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  
  // Custom tips stories slide modal state
  const [activeTipsStoryModal, setActiveTipsStoryModal] = useState(false);
  const [currentTipsIndex, setCurrentTipsIndex] = useState(0);

  // Active friend stories viewer modal state
  const [viewingUserStories, setViewingUserStories] = useState(null); // { name, stories: [] }
  const [currentUserStoryIndex, setCurrentUserStoryIndex] = useState(0);
  
  // Story creator state
  const [storyCreatorOpen, setStoryCreatorOpen] = useState(false);

  // Story view and like states
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const storyAudioRef = useRef(new Audio());
  const [viewersModalStory, setViewersModalStory] = useState(null); // story object or null

  const [storyProgress, setStoryProgress] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const lastTapRef = useRef({});
  const clickTimeoutRef = useRef({});

  const holdTimerRef = useRef(null);
  const clickStartRef = useRef(0);
  const pointerStartX = useRef(0);
  const lastNavTimeRef = useRef(0);

  const handleStoryPointerDown = (e) => {
    clickStartRef.current = Date.now();
    
    // Support mouse clientX and touch coordinates
    const startX = e.clientX ?? (e.touches?.[0]?.clientX) ?? (e.targetTouches?.[0]?.clientX) ?? 0;
    pointerStartX.current = startX;

    holdTimerRef.current = setTimeout(() => {
      setIsPaused(true);
      if (storyAudioRef.current) {
        storyAudioRef.current.pause();
      }
      const activeVideo = document.getElementById("story-active-video");
      if (activeVideo) {
        activeVideo.pause();
      }
    }, 250); // Hold for 250ms to pause
  };

  const handleStoryPointerUp = (e) => {
    clearTimeout(holdTimerRef.current);
    const clickDuration = Date.now() - clickStartRef.current;
    
    if (isPaused) {
      setIsPaused(false);
      if (storyAudioRef.current && storyAudioRef.current.src) {
        storyAudioRef.current.play().catch(() => {});
      }
      const activeVideo = document.getElementById("story-active-video");
      if (activeVideo) {
        activeVideo.play().catch(() => {});
      }
    } else if (clickDuration < 250) {
      const now = Date.now();
      if (now - lastNavTimeRef.current < 350) {
        // Prevent touch double-fire exits
        return;
      }
      lastNavTimeRef.current = now;

      const rect = e.currentTarget.getBoundingClientRect();
      const relativeX = pointerStartX.current - rect.left;
      const containerWidth = rect.width;
      
      const currentGroupIdx = friendStories.findIndex(g => g.userId === viewingUserStories.userId);
      
      if (relativeX < containerWidth * 0.35) {
        if (currentUserStoryIndex > 0) {
          setCurrentUserStoryIndex(prev => prev - 1);
        } else {
          const prevGroup = friendStories[currentGroupIdx - 1];
          if (prevGroup) {
            setViewingUserStories(prevGroup);
            setCurrentUserStoryIndex(prevGroup.stories.length - 1);
          }
        }
      } else {
        if (currentUserStoryIndex < viewingUserStories.stories.length - 1) {
          setCurrentUserStoryIndex(prev => prev + 1);
        } else {
          const nextGroup = friendStories[currentGroupIdx + 1];
          if (nextGroup) {
            setViewingUserStories(nextGroup);
            setCurrentUserStoryIndex(0);
          } else {
            setViewingUserStories(null);
          }
        }
      }
    }
  };

  const handleStoryPointerCancel = () => {
    clearTimeout(holdTimerRef.current);
    if (isPaused) {
      setIsPaused(false);
      if (storyAudioRef.current && storyAudioRef.current.src) {
        storyAudioRef.current.play().catch(() => {});
      }
      const activeVideo = document.getElementById("story-active-video");
      if (activeVideo) {
        activeVideo.play().catch(() => {});
      }
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        if (currentUserStoryIndex < viewingUserStories.stories.length - 1) {
          setCurrentUserStoryIndex(prev => prev + 1);
        } else {
          const nextGroupIdx = otherStoriesGroups.findIndex(g => g.userId === viewingUserStories.userId) + 1;
          if (nextGroupIdx < otherStoriesGroups.length) {
            setViewingUserStories(otherStoriesGroups[nextGroupIdx]);
            setCurrentUserStoryIndex(0);
          } else {
            setViewingUserStories(null);
          }
        }
      } else {
        if (currentUserStoryIndex > 0) {
          setCurrentUserStoryIndex(prev => prev - 1);
        } else {
          const prevGroupIdx = otherStoriesGroups.findIndex(g => g.userId === viewingUserStories.userId) - 1;
          if (prevGroupIdx >= 0) {
            setViewingUserStories(otherStoriesGroups[prevGroupIdx]);
            setCurrentUserStoryIndex(0);
          } else {
            setCurrentUserStoryIndex(0);
          }
        }
      }
    }
  };

  const waterTips = [
    { title: "Millet Option 🌾", text: "Swapping Rice for Millet saves up to 800L of water per serving!" },
    { title: "Almond Water Footprint 🌰", text: "One single almond requires about 12 Liters of water to grow. Choose oats instead!" },
    { title: "Go Veg & Save 🌿", text: "Eating vegetarian meals saves an average of 1,500 Liters of water per day." },
    { title: "Coffee Footprint ☕", text: "A single cup of coffee costs 140 Liters of water, mostly in crop cultivation!" }
  ];

  const fetchFeedAndStories = () => {
    setLoading(true);
    // Fetch feed analyses (returns logged in user + friends' uploads combined!)
    api.get("/analysis/history")
      .then(res => {
        setAnalyses(res.data.analyses || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch grouped active stories
    api.get("/analysis/stories")
      .then(res => {
        setFriendStories(res.data.stories || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchFeedAndStories();

    // Load initial likes state
    const savedLikes = localStorage.getItem("waterwise_likes");
    if (savedLikes) {
      setPostLikes(JSON.parse(savedLikes));
    }
  }, []);

  const refreshStories = () => {
    api.get("/analysis/stories")
      .then(res => setFriendStories(res.data.stories || []))
      .catch(() => {});
  };

  const handleLike = (postId) => {
    setPostLikes(prev => {
      const updated = { ...prev, [postId]: !prev[postId] };
      localStorage.setItem("waterwise_likes", JSON.stringify(updated));
      return updated;
    });
  };

  const handleImageClick = (postId, e) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[postId] || 0;
    
    if (now - lastTap < 300) {
      if (clickTimeoutRef.current[postId]) {
        clearTimeout(clickTimeoutRef.current[postId]);
        clickTimeoutRef.current[postId] = null;
      }
      if (!postLikes[postId]) {
        handleLike(postId);
      }
      setShowHeartPop(prev => ({ ...prev, [postId]: true }));
      setTimeout(() => {
        setShowHeartPop(prev => ({ ...prev, [postId]: false }));
      }, 800);
    } else {
      if (clickTimeoutRef.current[postId]) {
        clearTimeout(clickTimeoutRef.current[postId]);
      }
      clickTimeoutRef.current[postId] = setTimeout(() => {
        navigate(`/analysis/${postId}`);
        clickTimeoutRef.current[postId] = null;
      }, 300);
    }
    lastTapRef.current[postId] = now;
  };

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

  // Comments functionality
  const openComments = async (post) => {
    setCommentsModal(post);
    try {
      const res = await api.get(`/analysis/${post._id}`);
      const defaultComments = [
        { name: "Neha Sharma", text: "Wow, I didn't know it required this much water! 😮", time: "1h" },
        { name: "Raj Patel", text: "Healthy choice and environment friendly!", time: "45m" }
      ];
      const dbComments = (res.data.analysis.comments || []).map(c => ({
        name: c.userId?.name || "Anonymous",
        text: c.text,
        time: formatRelativeTime(c.createdAt)
      }));
      setActiveComments([...defaultComments, ...dbComments]);
    } catch (err) {
      console.error("Failed to load comments:", err);
      toast.error("Failed to load comments");
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !commentsModal) return;
    
    try {
      const res = await api.post(`/analysis/${commentsModal._id}/comment`, { text: newCommentText });
      const defaultComments = [
        { name: "Neha Sharma", text: "Wow, I didn't know it required this much water! 😮", time: "1h" },
        { name: "Raj Patel", text: "Healthy choice and environment friendly!", time: "45m" }
      ];
      const dbComments = (res.data.comments || []).map(c => ({
        name: c.userId?.name || "Anonymous",
        text: c.text,
        time: formatRelativeTime(c.createdAt)
      }));
      setActiveComments([...defaultComments, ...dbComments]);
      setNewCommentText("");
      toast.success("Comment added!");
    } catch (err) {
      console.error("Failed to post comment:", err);
      toast.error(err.response?.data?.message || "Failed to post comment");
    }
  };

  // Filter feed logic
  const filteredAnalyses = analyses.filter(item => {
    if (activeFilter === "all") return true;
    return item.dietaryCategoryUsed?.toLowerCase().trim() === activeFilter.toLowerCase().trim();
  });

  const getInitials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase() || "W";

  // Story highlight slideshow timing (Tips)
  useEffect(() => {
    let timer;
    if (activeTipsStoryModal) {
      timer = setTimeout(() => {
        if (currentTipsIndex < waterTips.length - 1) {
          setCurrentTipsIndex(prev => prev + 1);
        } else {
          setActiveTipsStoryModal(false);
          setCurrentTipsIndex(0);
        }
      }, 4000);
    }
    return () => clearTimeout(timer);
  }, [activeTipsStoryModal, currentTipsIndex]);

  // Story timing with real progress updates (pauses on hold or when viewers insights are open)
  useEffect(() => {
    if (!viewingUserStories) {
      setStoryProgress(0);
      return;
    }
    const interval = setInterval(() => {
      if (!isPaused && !viewersModalStory) {
        setStoryProgress(prev => {
          if (prev >= 100) {
            if (currentUserStoryIndex < viewingUserStories.stories.length - 1) {
              setCurrentUserStoryIndex(curr => curr + 1);
            } else {
              setViewingUserStories(null);
            }
            return 0;
          }
          return prev + 1;
        });
      }
    }, 50); // 50ms tick (5s total)
    return () => clearInterval(interval);
  }, [viewingUserStories, currentUserStoryIndex, isPaused, viewersModalStory]);

  useEffect(() => {
    setStoryProgress(0);
  }, [currentUserStoryIndex, viewingUserStories]);

  // Pause media when viewers insights modal is opened
  useEffect(() => {
    if (viewersModalStory) {
      if (storyAudioRef.current) {
        storyAudioRef.current.pause();
      }
      const activeVideo = document.getElementById("story-active-video");
      if (activeVideo) {
        activeVideo.pause();
      }
    } else {
      if (viewingUserStories && !isPaused) {
        if (storyAudioRef.current && storyAudioRef.current.src) {
          storyAudioRef.current.play().catch(() => {});
        }
        const activeVideo = document.getElementById("story-active-video");
        if (activeVideo) {
          activeVideo.play().catch(() => {});
        }
      }
    }
  }, [viewersModalStory, viewingUserStories, isPaused]);

  // View logger effect
  useEffect(() => {
    if (viewingUserStories && viewingUserStories.stories[currentUserStoryIndex]) {
      const currentStory = viewingUserStories.stories[currentUserStoryIndex];
      api.post(`/analysis/story/${currentStory._id}/view`)
        .then(res => {
          if (res.data.success) {
            setFriendStories(prev =>
              prev.map(g => {
                if (g.userId === viewingUserStories.userId) {
                  return {
                    ...g,
                    stories: g.stories.map(s => {
                      if (s._id === currentStory._id) {
                        const alreadyViewed = s.views.some(v => v._id === user?._id);
                        if (!alreadyViewed) {
                          return {
                            ...s,
                            views: [...s.views, { _id: user?._id, name: user?.name }]
                          };
                        }
                      }
                      return s;
                    })
                  };
                }
                return g;
              })
            );
          }
        })
        .catch(() => {});
    }
  }, [viewingUserStories, currentUserStoryIndex]);

  // Background Music playback effect
  useEffect(() => {
    if (viewingUserStories) {
      const currentStory = viewingUserStories.stories[currentUserStoryIndex];
      if (currentStory && currentStory.music) {
        storyAudioRef.current.src = currentStory.music;
        storyAudioRef.current.loop = true;
        storyAudioRef.current.muted = isMuted;
        storyAudioRef.current.play().catch(() => {});
      } else {
        storyAudioRef.current.pause();
        storyAudioRef.current.src = "";
      }
    } else {
      storyAudioRef.current.pause();
      storyAudioRef.current.src = "";
    }
    
    return () => {
      storyAudioRef.current.pause();
    };
  }, [viewingUserStories, currentUserStoryIndex]);

  // Story Like toggler
  const handleStoryLike = async (storyId) => {
    try {
      const res = await api.post(`/analysis/story/${storyId}/like`);
      if (res.data.success) {
        toast.success(res.data.liked ? "Story Liked! ❤️" : "Story Unliked");
        
        setFriendStories(prev =>
          prev.map(g => {
            if (g.userId === viewingUserStories.userId) {
              return {
                ...g,
                stories: g.stories.map(s => {
                  if (s._id === storyId) {
                    const alreadyLiked = s.likes.some(l => l._id === user?._id);
                    const updatedLikes = alreadyLiked 
                      ? s.likes.filter(l => l._id !== user?._id)
                      : [...s.likes, { _id: user?._id, name: user?.name }];
                    return {
                      ...s,
                      likes: updatedLikes
                    };
                  }
                  return s;
                })
              };
            }
            return g;
          })
        );
      }
    } catch {
      toast.error("Failed to update story like");
    }
  };

  // Check if current user has active stories posted
  const myStoriesGroup = friendStories.find(g => g.userId === user?._id);
  const otherStoriesGroups = friendStories.filter(g => g.userId !== user?._id);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-black pb-24 text-black dark:text-white transition-colors duration-200">
      

      {/* Top Header */}
      <header className="sticky top-0 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 h-14 flex items-center justify-between px-4 z-40 transition-colors duration-200">
        <h1 className="instagram-logo-text text-3xl font-semibold tracking-wide bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent select-none">
          Watergram
        </h1>
        <div className="flex items-center gap-4">
          
          {/* Refresh Feed button */}
          <button onClick={fetchFeedAndStories} className="text-black dark:text-white active-scale">
            <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>

          {/* Light/Dark Toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-yellow-400 hover:scale-105 active:scale-95 transition-all"
            title="Toggle theme"
          >
            {theme === "light" ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            )}
          </button>

          {/* Chat Icon */}
          <button className="text-black dark:text-white" onClick={() => toast("Conversations page mockup 💬")}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Feed Content */}
      <div className="max-w-[430px] mx-auto pt-3">
        
        {/* Stories Horizontal Scrolling Bar */}
        <div className="flex items-center gap-4 overflow-x-auto px-4 py-2 border-b border-gray-100 dark:border-zinc-900 no-scrollbar select-none">
          
          {/* Your Story Circle */}
          <div className="flex flex-col items-center flex-shrink-0 cursor-pointer relative">
            <div
              onClick={() => {
                if (myStoriesGroup) {
                  setViewingUserStories(myStoriesGroup);
                  setCurrentUserStoryIndex(0);
                } else {
                  setStoryCreatorOpen(true);
                }
              }}
              className={`w-16 h-16 rounded-full p-[2px] mb-1 active-scale transition-all ${
                myStoriesGroup ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" : "bg-gray-200 dark:bg-zinc-800"
              }`}
            >
              <div className="w-full h-full bg-white dark:bg-black rounded-full p-[2px]">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user?.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(user?.name)}
                  </div>
                )}
              </div>
            </div>

            {/* "+" badge: show when fewer than 5 stories (or no stories) */}
            {(!myStoriesGroup || myStoriesGroup.stories.length < 5) && (
              <span
                onClick={() => setStoryCreatorOpen(true)}
                className="absolute bottom-5 right-0 bg-blue-500 text-white rounded-full w-5 h-5 border-2 border-white dark:border-black flex items-center justify-center font-bold text-xs pointer-events-auto cursor-pointer z-10"
                title="Add story"
              >
                +
              </span>
            )}
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">Your Story</span>
          </div>

          {/* Friends Real Stories */}
          {otherStoriesGroups.map(group => (
            <div
              key={group.userId}
              onClick={() => {
                setViewingUserStories(group);
                setCurrentUserStoryIndex(0);
              }}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full p-[2px] mb-1 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 active-scale transition-all animate-gradient-spin">
                <div className="w-full h-full bg-white dark:bg-black rounded-full p-[2px]">
                  {group.profileImage ? (
                    <img
                      src={group.profileImage}
                      alt={group.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-cyan-600 flex items-center justify-center text-white text-xs font-extrabold shadow-inner">
                      {getInitials(group.name)}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold truncate max-w-[65px]">
                {group.name}
              </span>
            </div>
          ))}

          {/* Water Facts Info Story */}
          <div
            onClick={() => { setActiveTipsStoryModal(true); setCurrentTipsIndex(0); }}
            className="flex flex-col items-center flex-shrink-0 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-cyan-400 to-blue-600 mb-1 active-scale">
              <div className="w-full h-full bg-white dark:bg-black rounded-full p-[2px]">
                <div className="w-full h-full rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-2xl">
                  💧
                </div>
              </div>
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">Water Facts</span>
          </div>

        </div>

        {/* Dietary Categories Capsules Filter list (moved below stories) */}
        <div className="flex gap-2 overflow-x-auto px-4 py-2 border-b border-gray-100 dark:border-zinc-900 no-scrollbar select-none">
          {[
            { id: "all", name: "All meals", emoji: "🍽️" },
            { id: "vegetarian", name: "Veg", emoji: "🌿" },
            { id: "jain", name: "Jain", emoji: "🟤" },
            { id: "eggetarian", name: "Egg", emoji: "🥚" },
            { id: "nonvegetarian", name: "Non-Veg", emoji: "🍗" }
          ].map(capsule => (
            <button
              key={capsule.id}
              onClick={() => setActiveFilter(capsule.id)}
              className={`h-7 px-3 text-[10px] font-bold rounded-full flex items-center gap-1 border transition-all active-scale ${
                activeFilter === capsule.id
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-400"
              }`}
            >
              <span>{capsule.emoji}</span>
              <span>{capsule.name}</span>
            </button>
          ))}
        </div>

        {/* Feed Posts */}
        {loading ? (
          <Loader message="Loading feed..." />
        ) : filteredAnalyses.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="text-5xl mb-4">📸</div>
            <p className="text-gray-500 font-bold">Your feed is empty</p>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Scan your own food or go to the **Explore** page and search/add friends to start seeing their food posts here!
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {filteredAnalyses.map(post => {
              const isLiked = postLikes[post._id] || false;
              const formattedLiters = post.waterUsedLiters?.toLocaleString() + "L";
              const timeAgo = post.createdAt ? new Date(post.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Recently";
              
              return (
                <article key={post._id} className="bg-white dark:bg-[#121212] border-b border-gray-100 dark:border-zinc-900 transition-colors duration-200">
                  
                  {/* Post User Header */}
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                        {post.creatorAvatar ? (
                          <img
                            src={post.creatorAvatar}
                            alt={post.creatorName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                            {getInitials(post.creatorName)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">{post.creatorName}</h4>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">📍 {post.userDistrict}, {post.userState}</span>
                      </div>
                    </div>
                    <button className="text-gray-500 dark:text-zinc-400" onClick={() => navigate(`/analysis/${post._id}`)}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>
                    </button>
                  </div>

                  {/* Post Image Container */}
                  <div
                    className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-zinc-950 border-y border-gray-100 dark:border-zinc-900 cursor-pointer select-none"
                    onClick={(e) => handleImageClick(post._id, e)}
                  >
                    <img
                      src={post.imageUrl}
                      alt={post.foodItemDetected}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Double-tap heart overlay animation */}
                    {showHeartPop[post._id] && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg className="w-24 h-24 text-white drop-shadow-2xl fill-white animate-heart-pop absolute" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </div>
                    )}

                    {/* Floating Premium water badge */}
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md border border-white/10">
                      💧 {formattedLiters}
                    </div>

                    {/* Dietary badge */}
                    <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded capitalize">
                      {post.dietaryCategoryUsed === "vegetarian" ? "🌿 Veg" : post.dietaryCategoryUsed === "jain" ? "🟤 Jain" : post.dietaryCategoryUsed === "eggetarian" ? "🥚 Egg" : "🍗 Non-Veg"}
                    </div>
                  </div>

                  {/* Action Toolbar */}
                  <div className="flex items-center justify-between px-3 pt-3 pb-1">
                    <div className="flex items-center gap-4">
                      {/* Like button */}
                      <button onClick={() => handleLike(post._id)} className="transition-transform active:scale-125 duration-150">
                        {isLiked ? (
                          <svg className="w-6.5 h-6.5 text-rose-500 fill-current" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                        ) : (
                          <svg className="w-6.5 h-6.5 text-black dark:text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        )}
                      </button>

                      {/* Comment button */}
                      <button onClick={() => openComments(post)} className="text-black dark:text-white active-scale transition-transform">
                        <svg className="w-6.5 h-6.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </button>

                      {/* Share button */}
                      <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/analysis/${post._id}`); toast.success("Link copied! Share it anywhere."); }} className="text-black dark:text-white active-scale transition-transform">
                        <svg className="w-6.5 h-6.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l4.636-2.318a2.5 2.5 0 11.905 1.808l-4.637 2.318a2.5 2.5 0 11-.905-1.808zm0 2.516l4.637 2.318a2.5 2.5 0 10.905-1.808l-4.637-2.318a2.5 2.5 0 10-.905 1.808z" />
                        </svg>
                      </button>
                    </div>

                    {/* Bookmark button */}
                    <button onClick={() => toast("Post bookmarked! 🔖")} className="text-black dark:text-white">
                      <svg className="w-6.5 h-6.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                  </div>

                  {/* Likes Count */}
                  <div className="px-3 py-1 font-bold text-xs text-gray-900 dark:text-white">
                    {isLiked ? "101 likes" : "100 likes"}
                  </div>

                  {/* Post Caption */}
                  <div className="px-3 pb-1 text-xs leading-relaxed text-gray-800 dark:text-gray-300">
                    <span className="font-bold text-gray-900 dark:text-white mr-1.5">{post.creatorName}</span>
                    Analyzed <span className="font-semibold text-primary dark:text-secondary">{post.foodItemDetected}</span>. This meal consumes <span className="font-semibold text-blue-600 dark:text-blue-400">{formattedLiters}</span> of water footprint.
                  </div>

                  {/* Comments count preview */}
                  <div className="px-3 pb-2 text-[10px] text-gray-400 cursor-pointer" onClick={() => openComments(post)}>
                    View all comments...
                  </div>

                  {/* In-line Date */}
                  <div className="px-3 pb-4 text-[9px] uppercase tracking-wider text-gray-400">
                    {timeAgo}
                  </div>

                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Static Water Facts Tips slides Modal */}
      {activeTipsStoryModal && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center max-w-[430px] mx-auto">
          <div className="absolute top-4 left-0 right-0 flex gap-1 px-4 z-50">
            {waterTips.map((tip, idx) => (
              <div key={idx} className="h-1 flex-1 bg-white/30 rounded overflow-hidden">
                <div
                  className="h-full bg-white transition-all ease-linear"
                  style={{
                    width: currentTipsIndex > idx ? "100%" : currentTipsIndex === idx ? "100%" : "0%",
                    transitionDuration: currentTipsIndex === idx ? "4000ms" : "0ms"
                  }}
                />
              </div>
            ))}
          </div>

          <div className="absolute top-7 left-0 right-0 flex items-center justify-between px-4 z-50 text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-xs border border-white">
                💧
              </div>
              <span className="text-xs font-bold">Water Facts Story</span>
            </div>
            <button
              onClick={() => setActiveTipsStoryModal(false)}
              className="text-white text-lg font-bold w-6 h-6 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <div className="px-6 text-center text-white">
            <h3 className="text-2xl font-bold tracking-wide text-blue-400 mb-4">
              {waterTips[currentTipsIndex].title}
            </h3>
            <p className="text-lg leading-relaxed font-medium">
              {waterTips[currentTipsIndex].text}
            </p>
          </div>
        </div>
      )}

      {/* Active Friend Stories Slideshow Modal Overlay */}
      {viewingUserStories && (() => {
        const currentStory = viewingUserStories.stories[currentUserStoryIndex];
        let parsedMeta = { overlays: [], filter: "filter-none" };
        if (currentStory && currentStory.textOverlays) {
          try {
            parsedMeta = JSON.parse(currentStory.textOverlays);
          } catch (e) {
            console.error("Failed to parse story metadata", e);
          }
        }
        
        return (
          <div
            className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center max-w-[430px] mx-auto select-none"
            onPointerDown={handleStoryPointerDown}
            onPointerUp={handleStoryPointerUp}
            onPointerLeave={handleStoryPointerCancel}
            onPointerCancel={handleStoryPointerCancel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Top Progress indicators */}
            <div className="absolute top-4 left-0 right-0 flex gap-1 px-4 z-[110]">
              {viewingUserStories.stories.map((story, idx) => {
                let widthVal = "0%";
                if (currentUserStoryIndex > idx) {
                  widthVal = "100%";
                } else if (currentUserStoryIndex === idx) {
                  widthVal = `${storyProgress}%`;
                }
                return (
                  <div key={story._id} className="h-[3px] flex-1 bg-white/30 rounded overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-75 ease-linear"
                      style={{ width: widthVal }}
                    />
                  </div>
                );
              })}
            </div>

            {/* User information header */}
            <div 
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              className="absolute top-7 left-0 right-0 flex items-center justify-between px-4 z-50 text-white"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border border-white overflow-hidden flex-shrink-0">
                  {viewingUserStories.profileImage ? (
                    <img
                      src={viewingUserStories.profileImage}
                      alt={viewingUserStories.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold">
                      {getInitials(viewingUserStories.name)}
                    </div>
                  )}
                </div>
                <span className="text-xs font-bold">{viewingUserStories.name}</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Speaker icon for music if story has track */}
                {currentStory?.music && (
                  <button
                    onClick={() => {
                      const newMuted = !isMuted;
                      setIsMuted(newMuted);
                      storyAudioRef.current.muted = newMuted;
                    }}
                    className="text-white text-xs bg-black/40 px-2.5 py-1 rounded-full flex items-center gap-1.5 active-scale"
                    title="Toggle Music"
                  >
                    <span>{isMuted ? "🔇" : "🔊"}</span>
                    <span className="text-[10px]">Music</span>
                  </button>
                )}
                <button
                  onClick={() => setViewingUserStories(null)}
                  className="text-white text-lg font-bold w-6 h-6 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Story Media Viewer */}
            <div className="w-full h-full max-h-[80vh] flex items-center justify-center px-2 relative">
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl bg-zinc-900 shadow-2xl">
                {currentStory?.isVideo ? (
                  <video
                    id="story-active-video"
                    key={currentStory._id}
                    src={currentStory.imageUrl}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-contain ${parsedMeta.filter || "filter-none"}`}
                  />
                ) : (
                  <img
                    src={currentStory?.imageUrl}
                    alt="Story"
                    className={`w-full h-full object-contain ${parsedMeta.filter || "filter-none"}`}
                  />
                )}

                {/* Overlays Rendering Layer */}
                <div className="absolute inset-0 pointer-events-none">
                  {(parsedMeta.overlays || []).map((item, index) => (
                    <div
                      key={index}
                      style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        transform: "translate(-50%, -50%)",
                        fontFamily: item.font,
                        color: item.color,
                        fontSize: `${item.size}px`,
                      }}
                      className={`absolute text-center font-bold tracking-wide px-2.5 py-1 rounded-lg select-none whitespace-nowrap ${
                        item.hasBg ? "bg-black/60 text-white" : ""
                      }`}
                    >
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Story Viewer Footer Overlay */}
            <div 
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              className="absolute bottom-10 left-0 right-0 px-6 z-[110] flex items-center justify-between text-white text-xs"
            >
              <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <span className="font-bold">👁️ {currentStory?.views?.length || 0} views</span>
                {viewingUserStories.userId === user?._id && (
                  <>
                    <span className="text-gray-500">•</span>
                    <span className="font-bold">❤️ {currentStory?.likes?.length || 0} likes</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Viewers modal button if current user is owner */}
                {viewingUserStories.userId === user?._id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setViewersModalStory(currentStory); }}
                    className="h-9 px-4 bg-white text-black font-bold rounded-full text-[10px] uppercase tracking-wider active-scale shadow-md"
                  >
                    📊 Viewers
                  </button>
                )}

                {/* Like button (rendered for ALL users, including owner) */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleStoryLike(currentStory?._id); }}
                  className="w-9 h-9 rounded-full bg-black/50 border border-white/15 flex items-center justify-center active-scale"
                  title="Like Story"
                >
                  {currentStory?.likes?.some(l => l._id === user?._id) ? (
                    <span className="text-rose-500 text-lg fill-current">❤️</span>
                  ) : (
                    <span className="text-white text-lg">♡</span>
                  )}
                </button>
              </div>
            </div>

            {/* Desktop Navigation Chevrons */}
            {currentUserStoryIndex > 0 && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentUserStoryIndex(prev => prev - 1);
                }}
                className="hidden md:flex absolute left-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white items-center justify-center z-[110] border border-white/10 text-xs font-bold active-scale transition-colors"
              >
                〈
              </button>
            )}
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                if (currentUserStoryIndex < viewingUserStories.stories.length - 1) {
                  setCurrentUserStoryIndex(prev => prev + 1);
                } else {
                  setViewingUserStories(null);
                }
              }}
              className="hidden md:flex absolute right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white items-center justify-center z-[110] border border-white/10 text-xs font-bold active-scale transition-colors"
            >
              〉
            </button>

            {/* Left/Right click regions to navigate story */}
            <div className="absolute inset-y-0 left-0 w-1/3 z-40 cursor-pointer" onClick={() => {
              if (currentUserStoryIndex > 0) {
                setCurrentUserStoryIndex(prev => prev - 1);
              }
            }} />
            <div className="absolute inset-y-0 right-0 w-1/3 z-40 cursor-pointer" onClick={() => {
              if (currentUserStoryIndex < viewingUserStories.stories.length - 1) {
                setCurrentUserStoryIndex(prev => prev + 1);
              } else {
                setViewingUserStories(null);
              }
            }} />
          </div>
        );
      })()}

      {/* Slide-up Comments Drawer Modal */}
      {commentsModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={() => setCommentsModal(null)}>
          <div
            className="bg-white dark:bg-[#1c1c1e] w-full max-w-[430px] rounded-t-2xl flex flex-col max-h-[70vh] shadow-2xl transition-colors duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-zinc-700 rounded-full mx-auto my-3 cursor-pointer" onClick={() => setCommentsModal(null)} />
            <div className="px-4 pb-3 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Comments</h3>
              <button onClick={() => setCommentsModal(null)} className="text-gray-400 dark:text-zinc-500 font-bold">Close</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeComments.length === 0 ? (
                <p className="text-center text-gray-400 text-xs py-8">No comments yet. Start the conversation!</p>
              ) : (
                activeComments.map((comment, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-white text-[9px] font-bold">
                      {getInitials(comment.name)}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs bg-gray-50 dark:bg-zinc-900/60 p-2.5 rounded-xl">
                        <span className="font-bold text-gray-900 dark:text-white mr-1.5">{comment.name}</span>
                        <span className="text-gray-800 dark:text-gray-300">{comment.text}</span>
                      </div>
                      <span className="text-[9px] text-gray-400 mt-1 block ml-2">{comment.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={addComment} className="p-3 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-[#1c1c1e] flex gap-2 items-center">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newCommentText}
                onChange={e => setNewCommentText(e.target.value)}
                className="flex-1 h-10 px-3.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs rounded-xl focus:outline-none focus:border-primary text-black dark:text-white"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="text-xs font-bold text-primary dark:text-secondary disabled:opacity-50 px-2"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Story Creator Modal */}
      <StoryCreator
        isOpen={storyCreatorOpen}
        onClose={() => setStoryCreatorOpen(false)}
        onUploadSuccess={refreshStories}
      />

      {/* Slide-up Story Viewers list Drawer Modal */}
      {viewersModalStory && (
        <div className="fixed inset-0 bg-black/70 z-[200] flex items-end justify-center animate-fade-in" onClick={() => setViewersModalStory(null)}>
          <div
            className="bg-white dark:bg-[#1c1c1e] w-full max-w-[430px] rounded-t-2xl flex flex-col max-h-[50vh] shadow-2xl transition-colors duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-zinc-700 rounded-full mx-auto my-3 cursor-pointer" onClick={() => setViewersModalStory(null)} />
            <div className="px-4 pb-3 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Story Insights 📊</h3>
              <button onClick={() => setViewersModalStory(null)} className="text-gray-400 dark:text-zinc-500 font-bold">Close</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-black dark:text-white">
              {/* Likes list */}
              <div>
                <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2.5">
                  Liked by ({viewersModalStory.likes?.length || 0})
                </h4>
                {viewersModalStory.likes?.length === 0 ? (
                  <p className="text-gray-400 text-xs italic">No likes on this story yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {viewersModalStory.likes?.map(liker => (
                      <span key={liker._id} className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-3 py-1 rounded-full">
                        ❤️ {liker.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Viewers list */}
              <div className="pt-2">
                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2.5">
                  Viewed by ({viewersModalStory.views?.length || 0})
                </h4>
                {viewersModalStory.views?.length === 0 ? (
                  <p className="text-gray-400 text-xs italic">No views yet</p>
                ) : (
                  <div className="space-y-2">
                    {viewersModalStory.views?.map(viewer => (
                      <div key={viewer._id} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-white text-[8px] font-extrabold">
                          {viewer.name?.slice(0,2).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{viewer.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Home;
