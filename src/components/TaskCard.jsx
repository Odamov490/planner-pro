import { useState } from "react";
import { motion } from "framer-motion";

export default function TaskCard({ task, onToggle, onDelete, onEdit }) {

  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(task.title);

  const handleSave = () => {
    if (!newTitle.trim()) return;
    onEdit(task.id, newTitle);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-between items-center bg-white p-4 rounded shadow"
    >

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

      <div className="flex gap-2 ml-2">

        {isEditing ? (
          <button
            onClick={handleSave}
            className="text-green-500 font-semibold"
          >
            Saqlash
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-500"
          >
            Edit
          </button>
        )}

        <button
          onClick={() => onDelete(task.id)}
          className="text-red-500"
        >
          O‘chirish
        </button>

      </div>

    </motion.div>
  );
}