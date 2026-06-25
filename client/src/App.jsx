import { createContext, useContext, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import AnalysisDetail from "./pages/AnalysisDetail";
import Profile from "./pages/Profile";
import Explore from "./pages/Explore";
import Stats from "./pages/Stats";

const ThemeContext = createContext(null);

export const useTheme = () => useContext(ThemeContext);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <>
      <div className="pb-16">{children}</div>
      <Navbar />
    </>
  );
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (user) return <Navigate to="/home" replace />;
  return children;
};

function AppContent() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`min-h-screen bg-[#fafafa] dark:bg-black text-[#262626] dark:text-[#f5f5f5] transition-colors duration-200 border-x border-gray-100 dark:border-zinc-900`} style={{ maxWidth: "430px", margin: "0 auto" }}>
      <Routes>
        <Route path="/" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
        <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
        <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
        <Route path="/analysis/:id" element={<ProtectedRoute><AnalysisDetail /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      <Toaster position="top-center" toastOptions={{ duration: 3000, style: { fontSize: "14px", background: theme === "dark" ? "#262626" : "#fff", color: theme === "dark" ? "#fff" : "#333" } }} />
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeContext.Provider>
    </BrowserRouter>
  );
}

export default App;
