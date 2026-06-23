import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 max-w-[430px] mx-auto">
      <div className="flex justify-around items-center h-16">
        <Link to="/home" className={`flex flex-col items-center ${location.pathname === "/home" ? "text-primary" : "text-gray-400"}`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link to="/upload" className={`flex flex-col items-center ${location.pathname === "/upload" ? "text-primary" : "text-gray-400"}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          <span className="text-xs mt-1">Upload</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center ${location.pathname === "/profile" ? "text-primary" : "text-gray-400"}`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
