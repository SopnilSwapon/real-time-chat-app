import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingPage from "./pages/SettingPage";
import ProfilePage from "./pages/ProfilePage";
import { useAuthStore } from "./store/useAuthStore";

export default function App() {
  const {authUser, checkAuth} = useAuthStore();
  console.log(authUser, 'check the auth user data')
  return (
    <div className='text-2xl text-red-600'>
       <Navbar/>
 <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/signup" element={<SignUpPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/setting" element={<SettingPage />} />
    <Route path="/profile" element={<ProfilePage />} />
 </Routes>

    </div>
  )
}
