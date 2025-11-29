import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingPage from "./pages/SettingPage";
import ProfilePage from "./pages/ProfilePage";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";
import ActiveCallModal from "./components/ActiveCallModal";
import IncomingCallModal from "./components/IncomingCallModal";
import CallingModal from "./components/callingModal";

export default function App() {
  const { authUser, isCheckingAuth, checkAuth } = useAuthStore((s) => s);
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  if (isCheckingAuth && !authUser) {
    return (
      <div className="h-screen flex justify-center items-center">
        <span className="loading loading-infinity loading-xl"></span>
      </div>
    );
  }
  return (
    <div>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to={"/login"} />}
        />
        <Route
          path="/signup"
          element={!authUser ? <SignUpPage /> : <Navigate to={"/login"} />}
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/setting" element={<SettingPage />} />
        <Route
          path="/profile"
          element={authUser ? <ProfilePage /> : <Navigate to={"/login"} />}
        />
      </Routes>
      <audio id="remoteAudio" autoPlay playsInline></audio>

      <IncomingCallModal />
      <CallingModal />
      <ActiveCallModal />
    </div>
  );
}
