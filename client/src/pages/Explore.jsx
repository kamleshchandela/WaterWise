import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import Loader from "../components/Loader";
import toast from "react-hot-toast";

const Explore = () => {
  const [activeSearchTab, setActiveSearchTab] = useState("foods"); // "foods" | "users"
  
  // Foods states
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  // Users states
  const [userQuery, setUserQuery] = useState("");
  const [usersList, setUsersList] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Preload foods grid
    api.get("/analysis/history")
      .then(res => {
        const history = res.data.analyses || [];
        if (history.length === 0) {
          setItems([
            { _id: "mock1", foodItemDetected: "Avocado Toast", waterUsedLiters: 250, imageUrl: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=400&q=80", userDistrict: "Mumbai", userState: "Maharashtra", alternatives: [] },
            { _id: "mock2", foodItemDetected: "Cheese Burger", waterUsedLiters: 2400, imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80", userDistrict: "Ahmedabad", userState: "Gujarat", alternatives: [] },
            { _id: "mock3", foodItemDetected: "Black Coffee", waterUsedLiters: 140, imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80", userDistrict: "Pune", userState: "Maharashtra", alternatives: [] },
            { _id: "mock4", foodItemDetected: "Margherita Pizza", waterUsedLiters: 1200, imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&q=80", userDistrict: "Gandhinagar", userState: "Gujarat", alternatives: [] },
            { _id: "mock5", foodItemDetected: "Rice & Dal", waterUsedLiters: 800, imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80", userDistrict: "Jaipur", userState: "Rajasthan", alternatives: [] },
            { _id: "mock6", foodItemDetected: "Chocolate Cake", waterUsedLiters: 1500, imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80", userDistrict: "Kolkata", userState: "West Bengal", alternatives: [] },
            { _id: "mock7", foodItemDetected: "Apple Pie", waterUsedLiters: 600, imageUrl: "https://images.unsplash.com/photo-1519869325930-281384150729?w=400&q=80", userDistrict: "Simla", userState: "Himachal Pradesh", alternatives: [] }
          ]);
        } else {
          setItems(history);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Search users functionality
  const handleUserSearch = (val) => {
    setUserQuery(val);
    if (!val.trim()) {
      setUsersList([]);
      return;
    }
    setSearchingUsers(true);
    api.get(`/user/search?q=${val}`)
      .then(res => {
        setUsersList(res.data.users || []);
      })
      .catch(() => {})
      .finally(() => setSearchingUsers(false));
  };

  const [pendingRequests, setPendingRequests] = useState([]);

  const fetchPendingRequests = async () => {
    try {
      const res = await api.get("/user/friend/requests");
      setPendingRequests(res.data.requests || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeSearchTab === "users") {
      fetchPendingRequests();
    }
  }, [activeSearchTab]);

  // Handle friend requests and connection state
  const handleFriendAction = async (userId, action) => {
    try {
      let endpoint = "";
      if (action === "request") endpoint = `/user/friend/request/${userId}`;
      else if (action === "cancel") endpoint = `/user/friend/request/${userId}`; // same endpoint cancels/toggles
      else if (action === "accept") endpoint = `/user/friend/accept/${userId}`;
      else if (action === "reject") endpoint = `/user/friend/reject/${userId}`;
      else if (action === "unfriend") endpoint = `/user/friend/unfriend/${userId}`;

      const res = await api.post(endpoint);
      if (res.data.success) {
        const newStatus = res.data.status;
        toast.success(
          action === "accept" ? "Friend request accepted! 🤝" :
          action === "reject" ? "Request deleted" :
          action === "unfriend" ? "Removed from friends" :
          action === "request" ? "Request sent! ✉️" : "Request cancelled"
        );

        // Update list status
        setUsersList(prev =>
          prev.map(u => (u._id === userId ? { ...u, status: newStatus } : u))
        );

        // Update pending requests list if accepted/rejected
        if (action === "accept" || action === "reject") {
          setPendingRequests(prev => prev.filter(r => r._id !== userId));
        }

        fetchPendingRequests();
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const filteredItems = items.filter(item =>
    item.foodItemDetected?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getGridSpanClass = (index) => {
    if (index % 7 === 1) return "col-span-2 row-span-2 h-64";
    return "col-span-1 row-span-1 h-32";
  };

  const handleCardClick = (item) => {
    if (item._id.startsWith("mock")) {
      setSelectedItem(item);
    } else {
      navigate(`/analysis/${item._id}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-black pb-24 text-black dark:text-white transition-colors duration-200">
      <div className="max-w-[430px] mx-auto px-3 pt-4">
        
        {/* Tab switch bar */}
        <div className="flex border-b border-gray-100 dark:border-zinc-800 mb-4 select-none">
          <button
            onClick={() => setActiveSearchTab("foods")}
            className={`flex-1 py-2 font-bold text-xs border-b-2 transition-colors ${
              activeSearchTab === "foods" ? "border-primary text-primary dark:text-secondary dark:border-secondary" : "border-transparent text-gray-400"
            }`}
          >
            🔍 Search Foods
          </button>
          <button
            onClick={() => setActiveSearchTab("users")}
            className={`flex-1 py-2 font-bold text-xs border-b-2 transition-colors ${
              activeSearchTab === "users" ? "border-primary text-primary dark:text-secondary dark:border-secondary" : "border-transparent text-gray-400"
            }`}
          >
            👤 Find Friends
          </button>
        </div>

        {/* Tab 1: Foods discovery */}
        {activeSearchTab === "foods" && (
          <>
            {/* Search Header */}
            <div className="sticky top-0 bg-[#fafafa] dark:bg-black z-10 py-1 mb-3">
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-400 dark:text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search food footprint..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-[#efefef] dark:bg-[#262626] border-none text-sm rounded-lg text-black dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>

            {loading ? (
              <Loader message="Discovering food data..." />
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-20 text-gray-400 dark:text-gray-500">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-medium">No footprint results found</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 auto-rows-min">
                {filteredItems.map((item, index) => (
                  <div
                    key={item._id}
                    onClick={() => handleCardClick(item)}
                    className={`relative group cursor-pointer overflow-hidden rounded-sm active-scale transition-all ${getGridSpanClass(index)}`}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.foodItemDetected}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col justify-center items-center text-white transition-opacity duration-200">
                      <span className="font-bold text-sm text-center px-1 truncate max-w-full">
                        {item.foodItemDetected}
                      </span>
                      <span className="text-xs font-semibold mt-1 flex items-center gap-0.5">
                        💧 {item.waterUsedLiters?.toLocaleString()}L
                      </span>
                    </div>

                    <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded font-medium pointer-events-none">
                      💧 {item.waterUsedLiters?.toLocaleString()}L
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Tab 2: Users Search */}
        {activeSearchTab === "users" && (
          <div className="space-y-4">
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-400 dark:text-gray-500">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search user email or name..."
                value={userQuery}
                onChange={e => handleUserSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-[#efefef] dark:bg-[#262626] border-none text-sm rounded-lg text-black dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* Pending Requests Panel */}
            {pendingRequests.length > 0 && (
              <div className="p-4 bg-gradient-to-br from-blue-50/40 to-cyan-50/40 dark:from-zinc-900/40 dark:to-zinc-800/40 rounded-2xl border border-blue-100/50 dark:border-zinc-800 shadow-sm">
                <h3 className="text-[10px] font-bold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-xs">📩</span> Friend Requests ({pendingRequests.length})
                </h3>
                <div className="space-y-3.5">
                  {pendingRequests.map(reqUser => (
                    <div key={reqUser._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-white text-[10px] font-black">
                          {reqUser.name?.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">{reqUser.name}</h4>
                          <span className="text-[9px] text-gray-400 dark:text-gray-500 block capitalize">{reqUser.dietaryCategory} • {reqUser.district}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleFriendAction(reqUser._id, "accept")}
                          className="h-7 px-3 text-[10px] font-bold rounded-lg bg-primary text-white hover:bg-blue-600 active:scale-95 transition-all shadow-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleFriendAction(reqUser._id, "reject")}
                          className="h-7 px-3 text-[10px] font-bold rounded-lg bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-zinc-700 active:scale-95 transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchingUsers ? (
              <Loader message="Searching Watergram users..." />
            ) : usersList.length === 0 ? (
              <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                <div className="text-4xl mb-3">🤝</div>
                <p className="font-semibold text-sm">Find friends to connect</p>
                <p className="text-xs mt-1">Type name or email to search and add them.</p>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {usersList.map(itemUser => (
                  <div
                    key={itemUser._id}
                    className="flex items-center justify-between p-3.5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-xl shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-extrabold">
                        {itemUser.name?.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">{itemUser.name}</h4>
                        <span className="text-[10px] text-gray-400 block">{itemUser.email}</span>
                        <span className="text-[9px] text-blue-500 capitalize font-semibold">{itemUser.dietaryCategory} preference</span>
                      </div>
                    </div>

                    {itemUser.status === "received" ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleFriendAction(itemUser._id, "accept")}
                          className="h-8 px-3.5 text-xs font-bold rounded-lg bg-green-500 text-white hover:bg-green-600 shadow-sm transition-all active-scale"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleFriendAction(itemUser._id, "reject")}
                          className="h-8 px-3.5 text-xs font-bold rounded-lg bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-zinc-700 transition-all active-scale"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (itemUser.status === "friends") handleFriendAction(itemUser._id, "unfriend");
                          else if (itemUser.status === "sent") handleFriendAction(itemUser._id, "cancel");
                          else handleFriendAction(itemUser._id, "request");
                        }}
                        className={`h-8 px-4 text-xs font-bold rounded-lg transition-all active-scale ${
                          itemUser.status === "friends"
                            ? "bg-red-50 dark:bg-red-950/20 text-red-500 border border-red-200 dark:border-red-900/30 hover:bg-red-100/50"
                            : itemUser.status === "sent"
                            ? "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-zinc-700 hover:bg-gray-200/60"
                            : "bg-primary text-white hover:bg-blue-600 shadow-sm"
                        }`}
                      >
                        {itemUser.status === "friends" ? "Unfriend" : 
                         itemUser.status === "sent" ? "Requested" : "Add Friend"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Mock details modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-white dark:bg-[#262626] rounded-2xl overflow-hidden w-full max-w-[360px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="relative aspect-square">
              <img src={selectedItem.imageUrl} alt={selectedItem.foodItemDetected} className="w-full h-full object-cover" />
              <button onClick={() => setSelectedItem(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center text-lg font-bold">
                ✕
              </button>
              <div className="absolute bottom-3 left-3 bg-blue-600 text-white font-bold px-3 py-1 rounded-full text-xs shadow-md">
                💧 {selectedItem.waterUsedLiters} Liters
              </div>
            </div>
            <div className="p-4">
              <span className="text-[10px] uppercase font-bold text-primary tracking-wide">AI Footprint Insight</span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{selectedItem.foodItemDetected}</h3>
              <p className="text-xs text-gray-500 mt-1">📍 Local estimates for {selectedItem.userDistrict}, {selectedItem.userState}</p>
              
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">💡 Water Fact:</p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                  Producing this portion requires equivalent water to running a shower for {Math.round(selectedItem.waterUsedLiters / 8)} minutes. Choose water-friendly alternatives to save water.
                </p>
              </div>
              
              <button
                onClick={() => { setSelectedItem(null); navigate("/upload"); }}
                className="w-full h-11 bg-primary text-white font-semibold rounded-xl text-sm mt-4 active:scale-95 transition-all shadow-md"
              >
                Scan Your Own Food
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Explore;
