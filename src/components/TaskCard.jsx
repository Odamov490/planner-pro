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

  const totalSub = task.subtasks?.length || 0;
  const doneSub = task.subtasks?.filter(s => s.completed).length || 0;
  const percent = totalSub ? Math.round((doneSub / totalSub) * 100) : 0;

  const handleSave = async () => {
    if (!newTitle.trim()) return;
    await onEdit(task.id, newTitle);
    setIsEditing(false);
  };

  const handleAddSub = async () => {
    if (!subText.trim()) return;
    await addSubtask(task.id, subText);
    setSubText("");
    setShowSubInput(false);
  };

  const handleSaveSub = async (subId) => {
    await editSubtask(task.id, subId, editingSubText);
    setEditingSubId(null);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="bg-white p-4 rounded-2xl shadow space-y-3 border"
    >

      {/* 🔥 TYPE */}
      <div className="flex justify-between items-center text-xs">

        <span className={`px-2 py-1 rounded-full text-white ${
          task.type === "incoming" ? "bg-green-500" : "bg-blue-500"
        }`}>
          {task.type === "incoming" ? "📥 Incoming" : "📤 Outgoing"}
        </span>

        <span>
          {task.priority === "high" && "🔴"}
          {task.priority === "medium" && "🟡"}
          {task.priority === "low" && "🟢"}
        </span>

      </div>

      {/* 👤 EMAIL INFO */}
      <p className="text-xs text-gray-500">
        {task.type === "incoming"
          ? `📩 ${task.createdByEmail} sizga topshiriq berdi`
          : `📤 Siz ${task.assignedEmail || "foydalanuvchiga"} topshiriq berdingiz`}
      </p>

      {/* MAIN */}
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
            <span className={`w-full ${
              task.completed ? "line-through text-gray-400" : ""
            }`}>
              {task.title}
            </span>
          )}

        </div>

        {/* 🔥 TEXT BUTTONS */}
        <div className="flex gap-2 text-sm">

          <button
            onClick={() => setShowSubInput(!showSubInput)}
            className="text-green-600"
          >
            Subtask
          </button>

          {isEditing ? (
            <button onClick={handleSave} className="text-green-500">
              Saqlash
            </button>
          ) : (
            <button onClick={() => setIsEditing(true)} className="text-blue-500">
              Tahrirlash
            </button>
          )}

          <button onClick={() => onDelete(task.id)} className="text-red-500">
            O‘chirish
          </button>

        </div>

      </div>

      {/* 📊 PROGRESS */}
      {totalSub > 0 && (
        <div>
          <div className="w-full bg-gray-200 h-2 rounded-full">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: percent + "%" }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {doneSub}/{totalSub} ({percent}%)
          </p>
        </div>
      )}

      {/* SUBTASKS */}
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
              <span className={`w-full ${
                sub.completed ? "line-through text-gray-400" : ""
              }`}>
                {sub.text}
              </span>
            )}

            <div className="flex gap-2">

              {editingSubId === sub.id ? (
                <button onClick={() => handleSaveSub(sub.id)} className="text-green-500">
                  Saqlash
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditingSubId(sub.id);
                    setEditingSubText(sub.text);
                  }}
                  className="text-blue-500"
                >
                  Edit
                </button>
              )}

              <button
                onClick={() => deleteSubtask(task.id, sub.id)}
                className="text-red-500"
              >
                O‘chirish
              </button>

            </div>

          </div>
        ))}

        {/* ➕ ADD */}
        {showSubInput && (
          <div className="flex gap-2">
            <input
              value={subText}
              onChange={(e) => setSubText(e.target.value)}
              placeholder="Sub vazifa..."
              className="border p-1 rounded w-full text-sm"
            />
            <button onClick={handleAddSub} className="text-green-500">
              Qo‘shish
            </button>
          </div>
        )}

      </div>

    </motion.div>
  );
}