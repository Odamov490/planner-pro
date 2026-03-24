import {Link} from "react-router-dom";

export default function Sidebar(){
 return (
  <div className="w-64 h-screen bg-white shadow-xl p-6">
   <h1 className="text-2xl font-bold mb-6">📘 Reja</h1>
   <nav className="flex flex-col gap-4">
    <Link to="/" className="hover:text-blue-500">Dashboard</Link>
    <Link to="/tasks" className="hover:text-blue-500">Vazifalar</Link>
    <Link to="/calendar" className="hover:text-blue-500">Kalendar</Link>
   </nav>
  </div>
 )
}
