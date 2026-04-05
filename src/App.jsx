import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useContext } from "react";

import { AuthProvider, AuthContext } from "./context/AuthContext";
import { TaskProvider } from "./context/TaskContext";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Calendar from "./pages/Calendar";
import Login from "./pages/Login";
import Incoming from "./pages/Incoming";
import Outgoing from "./pages/Outgoing";
import Notifications from "./pages/Notifications";
import Teams from "./pages/Teams";
import Checkers from "./pages/Checkers";
import
// 🔐 ROUTE CONTROL
function AppRoutes(){
  const { user } = useContext(AuthContext);

  // ❗ agar login qilmagan bo‘lsa
  if (!user) return <Login />;

  // ✅ login qilgan bo‘lsa
  return (
    <div className="flex">
      <Sidebar/>
      <div className="flex-1 p-6 ml-64">
        <Routes>
          <Route path="/" element={<Dashboard/>}/>
          <Route path="/tasks" element={<Tasks/>}/>
          <Route path="/calendar" element={<Calendar/>}/>
          <Route path="/incoming" element={<Incoming />} />
          <Route path="/outgoing" element={<Outgoing />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/checkers" element={<Checkers />} />
          <Route path="/chess" element={<Chess />} />
        </Routes>
      </div>
    </div>
  );
}

// 🔥 MAIN APP
export default function App(){
  return (
    <AuthProvider>
      <TaskProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TaskProvider>
    </AuthProvider>
  );
}