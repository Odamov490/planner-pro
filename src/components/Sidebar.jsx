import {Link} from "react-router-dom";
export default function Sidebar(){
 return (
  <div className="w-64 h-screen bg-white shadow-lg p-6">
   <h1 className="text-2xl font-bold mb-6">Planner Pro</h1>
   <nav className="flex flex-col gap-4">
    <Link to="/" className="hover:text-blue-500">Dashboard</Link>
    <Link to="/tasks" className="hover:text-blue-500">Tasks</Link>
   </nav>
  </div>
 )
}
