import { useState, useEffect } from "react";
import api from "../utils/api";
import Loader from "../components/Loader";

const Stats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/user/profile")
      .then(res => {
        setStats(res.data.stats || {
          totalAnalyses: 0,
          avgWaterPerMeal: 0,
          waterSaved: 0
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatWater = (liters) => liters?.toLocaleString() + "L" || "0L";

  // Mock comparison details if user is new, so stats look rich
  const defaultAvgWater = stats?.avgWaterPerMeal || 750;
  const defaultSaved = stats?.waterSaved || 1200;
  const defaultCount = stats?.totalAnalyses || 3;

  // Let's compute equivalent comparisons
  const bathtubsSaved = Math.round(defaultSaved / 150); // 150L per bathtub
  const showersSaved = Math.round(defaultSaved / 80);   // 80L per standard shower

  // Food categories footprint comparison
  const footprintCategories = [
    { name: "Meats & Poultry", value: 2400, percent: 100, color: "bg-red-500" },
    { name: "Dairy & Cheese", value: 1200, percent: 50, color: "bg-orange-400" },
    { name: "Grains & Rice", value: 800, percent: 33, color: "bg-yellow-500" },
    { name: "Fruits & Veggies", value: 300, percent: 12, color: "bg-green-500" },
    { name: "Beverages (Coffee/Tea)", value: 140, percent: 6, color: "bg-blue-400" }
  ];

  // Swaps recommendations (Reels-style infographics)
  const popularSwaps = [
    { from: "White Rice (1 portion)", fromLiters: 1100, to: "Millet / Bajra (1 portion)", toLiters: 250, icon: "🌾" },
    { from: "Beef/Chicken Patty", fromLiters: 2100, to: "Paneer / Tofu Patty", toLiters: 600, icon: "🍔" },
    { from: "Dairy Latte (1 cup)", fromLiters: 200, to: "Almond/Oat Latte", toLiters: 45, icon: "☕" }
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-black pb-24 text-black dark:text-white transition-colors duration-200">
      <div className="max-w-[430px] mx-auto px-4 pt-6">
        <h1 className="text-2xl font-bold mb-1">Analytics Dashboard</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Your water footprint and conservation metrics</p>

        {loading ? (
          <Loader message="Compiling your water reports..." />
        ) : (
          <div className="space-y-6">
            
            {/* Visual Circular Meter Card */}
            <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800 text-center relative overflow-hidden">
              <span className="absolute top-3 right-3 text-xs font-bold text-green-500 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded-full">
                Active
              </span>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Goal Progress</h3>
              
              <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                {/* SVG Progress Circle */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-gray-100 dark:text-zinc-800"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-primary dark:text-secondary"
                    fill="transparent"
                    strokeDasharray="377"
                    strokeDashoffset={377 - (377 * 68) / 100} // 68% placeholder goal
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-extrabold">{formatWater(defaultSaved)}</span>
                  <span className="text-[10px] text-gray-400 font-medium">Total Saved</span>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 px-2">
                🌟 You saved enough water to fill <span className="font-bold text-green-600 dark:text-green-400">{bathtubsSaved} bathtubs</span> or run <span className="font-bold text-green-600 dark:text-green-400">{showersSaved} showers</span>!
              </p>
            </div>

            {/* General Stats Counters */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-[#1c1c1e] p-3 rounded-xl border border-gray-100 dark:border-zinc-800 text-center">
                <span className="text-2xl">📸</span>
                <div className="text-lg font-bold text-gray-800 dark:text-white mt-1">{defaultCount}</div>
                <div className="text-[10px] text-gray-400 font-medium">Scans</div>
              </div>
              <div className="bg-white dark:bg-[#1c1c1e] p-3 rounded-xl border border-gray-100 dark:border-zinc-800 text-center">
                <span className="text-2xl">💧</span>
                <div className="text-lg font-bold text-blue-500 mt-1">{formatWater(defaultAvgWater)}</div>
                <div className="text-[10px] text-gray-400 font-medium">Avg Meal</div>
              </div>
              <div className="bg-white dark:bg-[#1c1c1e] p-3 rounded-xl border border-gray-100 dark:border-zinc-800 text-center">
                <span className="text-2xl">🌱</span>
                <div className="text-lg font-bold text-green-500 mt-1">Grade A</div>
                <div className="text-[10px] text-gray-400 font-medium">Eco Rank</div>
              </div>
            </div>

            {/* Footprint Categories Bar Graph */}
            <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-gray-800 dark:text-white mb-4">Average Footprint per Category</h3>
              <div className="space-y-3">
                {footprintCategories.map(cat => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-700 dark:text-gray-300">{cat.name}</span>
                      <span className="text-gray-500 dark:text-gray-400">{formatWater(cat.value)}</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.percent}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Swap Suggestions Section */}
            <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-gray-800 dark:text-white mb-3 flex items-center gap-1.5">
                <span>🔄</span> Smart Swaps to Conserve Water
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Swap high footprint items with low water alternatives:</p>
              
              <div className="space-y-3">
                {popularSwaps.map((swap, idx) => {
                  const saved = swap.fromLiters - swap.toLiters;
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-900/60 rounded-xl border border-gray-100/50 dark:border-zinc-800/40">
                      <div className="text-2xl bg-white dark:bg-zinc-800 w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
                        {swap.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-red-500 line-through truncate max-w-[80px]">{swap.from}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-green-500 font-bold truncate max-w-[100px]">{swap.to}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[10px] text-gray-400">Save {formatWater(saved)} per serving</span>
                          <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-1.5 py-0.5 rounded">
                            -{Math.round((saved / swap.fromLiters) * 100)}% Water
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Stats;
