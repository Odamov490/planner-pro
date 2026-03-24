import { useState, useContext } from "react";
import { motion } from "framer-motion";
import { TaskContext } from "../context/TaskContext";

export default function TaskCard({ task, onToggle, onDelete, onEdit }) {

  const { addSubtask, toggleSubtask } = useContext(TaskContext);

  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(task.title);
  const [subText, setSubText] = useState("");

  const handleSave = async () => {
    if (!newTitle.trim()) return;
    await onEdit(task.id, newTitle);
    setIsEditing(false);
  };

  const handleAddSub = async () => {
    if (!subText.trim()) return;
    await addSubtask(task.id, subText);
    setSubText("");
  };

  return (
    <motion.div className="bg-white p-4 rounded-xl shadow space-y-3">

      {/* MAIN TASK */}
      <div className="flex justify-between items-center">

        <div className="flex items-center gap-3 w-full">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggle(task.id)}
          />

          {isEditing ? (
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="border p-1 rounded w-full"
            />
          ) : (
            <span className={`w-full ${task.completed ? "line-through text-gray-400" : ""}`}>
              {task.title}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <button onClick={handleSave} className="text-green-500">
              Saqlash
            </button>
          ) : (
            <button onClick={() => setIsEditing(true)} className="text-blue-500">
              Edit
            </button>
          )}

          <button onClick={() => onDelete(task.id)} className="text-red-500">
            O‘chirish
          </button>
        </div>

      </div>

      {/* 🔥 SUBTASKS */}
      <div className="pl-6 space-y-2">

        {(task.subtasks || []).map(sub => (
          <div key={sub.id} className="flex items-center gap-2 text-sm">

            <input
              type="checkbox"
              checked={sub.completed}
              onChange={() => toggleSubtask(task.id, sub.id)}
            />

            <span className={sub.completed ? "line-through text-gray-400" : ""}>
              {sub.text}
            </span>

          </div>
        ))}

        {/* ➕ ADD SUBTASK */}
        <div className="flex gap-2">
          <input
            value={subText}
            onChange={(e) => setSubText(e.target.value)}
            placeholder="Sub vazifa..."
            className="border p-1 rounded w-full text-sm"
          />
          <button
            onClick={handleAddSub}
            className="text-green-500 text-sm"
          >
            +
          </button>
        </div>

      </div>

    </motion.div>
  );
}