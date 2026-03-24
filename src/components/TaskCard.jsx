import { useState, useContext } from "react";
import { motion } from "framer-motion";
import { TaskContext } from "../context/TaskContext";

export default function TaskCard({ task, onToggle, onDelete, onEdit }) {

  const { addSubtask, toggleSubtask, deleteSubtask, editSubtask } = useContext(TaskContext);

  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(task.title);

  const [showSubInput, setShowSubInput] = useState(false);
  const [subText, setSubText] = useState("");

  const [editingSubId, setEditingSubId] = useState(null);
  const [editingSubText, setEditingSubText] = useState("");

  // MAIN EDIT
  const handleSave = async () => {
    if (!newTitle.trim()) return;
    await onEdit(task.id, newTitle);
    setIsEditing(false);
  };

  // ADD SUBTASK
  const handleAddSub = async () => {
    if (!subText.trim()) return;
    await addSubtask(task.id, subText);
    setSubText("");
    setShowSubInput(false); // 🔥 yopiladi
  };

  // SAVE SUB EDIT
  const handleSaveSub = async (subId) => {
    await editSubtask(task.id, subId, editingSubText);
    setEditingSubId(null);
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

        <div className="flex gap-2 items-center">

          {/* ➕ SUBTASK BUTTON */}
          <button
            onClick={() => setShowSubInput(!showSubInput)}
            className="text-green-600 font-bold text-lg"
          >
            +
          </button>

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

      {/* 🔥 SUBTASK LIST */}
      <div className="pl-6 space-y-2">

        {(task.subtasks || []).map(sub => (
          <div key={sub.id} className="flex items-center gap-2 text-sm">

            <input
              type="checkbox"
              checked={sub.completed}
              onChange={() => toggleSubtask(task.id, sub.id)}
            />

            {editingSubId === sub.id ? (
              <input
                value={editingSubText}
                onChange={(e) => setEditingSubText(e.target.value)}
                className="border p-1 rounded w-full"
              />
            ) : (
              <span className={`w-full ${sub.completed ? "line-through text-gray-400" : ""}`}>
                {sub.text}
              </span>
            )}

            <div className="flex gap-2">

              {editingSubId === sub.id ? (
                <button
                  onClick={() => handleSaveSub(sub.id)}
                  className="text-green-500"
                >
                  ✔
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditingSubId(sub.id);
                    setEditingSubText(sub.text);
                  }}
                  className="text-blue-500"
                >
                  ✏️
                </button>
              )}

              <button
                onClick={() => deleteSubtask(task.id, sub.id)}
                className="text-red-500"
              >
                ❌
              </button>

            </div>

          </div>
        ))}

        {/* ➕ INPUT (faqat tugma bosilganda chiqadi) */}
        {showSubInput && (
          <div className="flex gap-2">
            <input
              value={subText}
              onChange={(e) => setSubText(e.target.value)}
              placeholder="Sub vazifa..."
              className="border p-1 rounded w-full text-sm"
            />
            <button
              onClick={handleAddSub}
              className="text-green-500"
            >
              ✔
            </button>
          </div>
        )}

      </div>

    </motion.div>
  );
}