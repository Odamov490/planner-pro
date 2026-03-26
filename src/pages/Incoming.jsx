import { useContext } from "react";
import { TaskContext } from "../context/TaskContext";
import { AuthContext } from "../context/AuthContext";
import { getIncomingTasks } from "../utils/filters";
import TaskCard from "../components/TaskCard";

export default function Incoming(){

  const { tasks, toggleTask, deleteTask, editTask } = useContext(TaskContext);
  const { user } = useContext(AuthContext);

  // 🔥 FILTER
  const incoming = getIncomingTasks(tasks, user?.uid);

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* HEADER */}
      <h1 className="text-3xl font-bold text-blue-600">
        📥 Menga berilgan vazifalar
      </h1>

      {/* EMPTY */}
      {incoming.length === 0 && (
        <div className="text-center text-gray-400 mt-10">
          Sizga hali vazifa berilmagan
        </div>
      )}

      {/* LIST */}
      <div className="space-y-3">

        {incoming.map(task => (
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