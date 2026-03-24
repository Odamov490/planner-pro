import {BrowserRouter,Routes,Route} from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Calendar from "./pages/Calendar";

export default function App(){
 return (
  <BrowserRouter>
   <div className="flex">
    <Sidebar/>
    <div className="flex-1 p-6">
     <Routes>
      <Route path="/" element={<Dashboard/>}/>
      <Route path="/tasks" element={<Tasks/>}/>
      <Route path="/calendar" element={<Calendar/>}/>
     </Routes>
    </div>
   </div>
  </BrowserRouter>
 )
}
