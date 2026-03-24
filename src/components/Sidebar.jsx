import {Link} from "react-router-dom";

export default function Sidebar(){
 return (
  <div className="w-64 h-screen bg-gradient-to-b from-white to-blue-50 shadow-2xl p-6 flex flex-col justify-between">

   <div>
     <h1 className="text-3xl font-extrabold mb-10 text-blue-600 tracking-wide">
       📘 Reja
     </h1>

     <nav className="flex flex-col gap-3">
       <Link 
         to="/" 
         className="px-4 py-3 rounded-xl text-gray-700 font-medium 
         hover:bg-blue-100 hover:text-blue-600 
         hover:scale-105 transition duration-300 shadow-sm hover:shadow-md"
       >
         Dashboard
       </Link>

       <Link 
         to="/tasks" 
         className="px-4 py-3 rounded-xl text-gray-700 font-medium 
         hover:bg-blue-100 hover:text-blue-600 
         hover:scale-105 transition duration-300 shadow-sm hover:shadow-md"
       >
         Vazifalar
       </Link>

       <Link 
         to="/calendar" 
         className="px-4 py-3 rounded-xl text-gray-700 font-medium 
         hover:bg-blue-100 hover:text-blue-600 
         hover:scale-105 transition duration-300 shadow-sm hover:shadow-md"
       >
         Kalendar
       </Link>
     </nav>
   </div>

   <div className="text-sm text-gray-400 mt-10">
     © 2026 Planner
   </div>

  </div>
 )
}