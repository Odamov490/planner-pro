import { useContext } from "react";
import { TaskContext } from "../context/TaskContext";
import { AuthContext } from "../context/AuthContext";
import { getOutgoingTasks } from "../utils/filters";
import TaskCard from "../components/TaskCard";

export default function Outgoing(){

  const { tasks, toggleTask, deleteTask, editTask } = useContext(TaskContext);
  const { user } = useContext(AuthContext);

  // 🔥 FILTER
  const outgoing = getOutgoingTasks(tasks, user?.uid);

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* HEADER */}
      <h1 className="text-3xl font-bold text-blue-600">
        📤 Men bergan vazifalar
      </h1>

      {/* EMPTY */}
      {outgoing.length === 0 && (
        <div className="text-center text-gray-400 mt-10">
          Siz hali hech kimga vazifa bermagansiz
        </div>
      )}

      {/* LIST */}
      <div className="space-y-3">

        {outgoing.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onEdit={editTask}
          />
        ))}

      </div>

    </div>
  );
}