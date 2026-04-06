import { useContext, useEffect, useState } from "react";
import { TaskContext } from "../context/TaskContext";

const PRIORITY_META = {
  high: {
    label: "Yuqori",
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
  medium: {
    label: "O'rta",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  low: {
    label: "Past",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
};

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("uz-UZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatShortDate(dateString) {
  return String(new Date(`${dateString}T00:00:00`).getDate()).padStart(2, "0");
}

function getDaysLeft(dateString) {
  const today = new Date(`${getTodayKey()}T00:00:00`);
  const target = new Date(`${dateString}T00:00:00`);
  const diff = target - today;
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function getDeadlineText(task) {
  if (task.completed) {
    return { text: "Bajarilgan", tone: "text-emerald-600" };
  }

  const daysLeft = getDaysLeft(task.date);

  if (daysLeft < 0) {
    return { text: `${Math.abs(daysLeft)} kun o'tib ketgan`, tone: "text-red-600" };
  }

  if (daysLeft === 0) {
    return { text: "Bugun", tone: "text-blue-600" };
  }

  return { text: `${daysLeft} kun qoldi`, tone: "text-slate-500" };
}

function groupTasksByDate(tasks) {
  return tasks.reduce((acc, task) => {
    if (!task.date || task.archived) return acc;
    if (!acc[task.date]) acc[task.date] = [];
    acc[task.date].push(task);
    return acc;
  }, {});
}

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
    return (a.title || "").localeCompare(b.title || "", "uz");
  });
}

function SummaryCard({ title, value, subtitle, tone }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-3 h-2 w-16 rounded-full ${tone}`} />
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const meta = PRIORITY_META[priority];
  if (!meta) return null;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${meta.badge}`}>
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function SubtaskList({ subtasks = [] }) {
  if (!subtasks.length) return null;

  return (
    <div className="space-y-2 border-l border-slate-200 pl-4">
      {subtasks.map((subtask) => (
        <div
          key={subtask.id}
          className={`text-sm ${subtask.completed ? "text-slate-400 line-through" : "text-slate-600"}`}
        >
          - {subtask.text}
        </div>
      ))}
    </div>
  );
}

function TaskCard({ task, compact = false }) {
  const deadline = getDeadlineText(task);
  const overdue = !task.completed && getDaysLeft(task.date) < 0;

  return (
    <div
      className={`rounded-2xl border p-4 ${
        compact
          ? "border-slate-200 bg-slate-50"
          : overdue
            ? "border-red-200 bg-red-50"
            : "border-blue-100 bg-blue-50/70"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium ${
              task.completed ? "text-slate-400 line-through" : "text-slate-900"
            }`}
          >
            {task.title}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PriorityBadge priority={task.priority} />
            <span className={`text-xs font-medium ${deadline.tone}`}>{deadline.text}</span>
          </div>
        </div>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
            task.completed
              ? "bg-emerald-100 text-emerald-700"
              : overdue
                ? "bg-red-100 text-red-700"
                : "bg-white text-blue-700"
          }`}
        >
          {task.completed ? "OK" : overdue ? "!" : formatShortDate(task.date)}
        </div>
      </div>

      {task.subtasks?.length > 0 && (
        <div className="mt-4">
          <SubtaskList subtasks={task.subtasks} />
        </div>
      )}
    </div>
  );
}

function DateModal({ date, tasks, onClose }) {
  useEffect(() => {
    if (!date) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [date, onClose]);

  if (!date) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Tanlangan sana</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">{formatDateLabel(date)}</h2>
            <p className="mt-1 text-sm text-slate-500">{tasks.length} ta vazifa</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
          >
            Yopish
          </button>
        </div>

        <div className="mt-6 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} compact />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Calendar() {
  const { tasks, loading } = useContext(TaskContext);
  const [selectedDate, setSelectedDate] = useState(null);

  const today = getTodayKey();
  const groupedTasks = groupTasksByDate(tasks || []);
  const calendarDates = Object.keys(groupedTasks).sort((a, b) => a.localeCompare(b));
  const todayTasks = sortTasks((tasks || []).filter((task) => task.date === today && !task.archived));
  const upcomingTasks = calendarDates.reduce(
    (count, date) => count + groupedTasks[date].filter((task) => !task.completed).length,
    0
  );
  const overdueTasks = (tasks || []).filter(
    (task) => !task.archived && !task.completed && task.date && task.date < today
  ).length;
  const modalTasks = selectedDate ? sortTasks(groupedTasks[selectedDate] || []) : [];

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[2rem] bg-gradient-to-r from-slate-900 via-blue-900 to-sky-700 p-6 text-white shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-100">Reja va muddatlar</p>
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold md:text-4xl">Kalendar</h1>
              <p className="mt-2 max-w-2xl text-sm text-blue-100/90 md:text-base">
                Vazifalarni sana bo'yicha ko'ring, bugungi ishlarni ajrating va kechikkan topshiriqlarni darhol toping.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Bugungi sana</p>
              <p className="mt-1 text-lg font-semibold">{formatDateLabel(today)}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            title="Bugungi vazifalar"
            value={todayTasks.length}
            subtitle={todayTasks.length ? "Bugun yakunlanishi kerak" : "Bugunga vazifa biriktirilmagan"}
            tone="bg-blue-500"
          />
          <SummaryCard
            title="Faol rejalashtirilgan"
            value={upcomingTasks}
            subtitle="Kalendar bo'ylab ochiq vazifalar"
            tone="bg-emerald-500"
          />
          <SummaryCard
            title="Kechikkanlar"
            value={overdueTasks}
            subtitle={overdueTasks ? "E'tibor talab qiladi" : "Hammasi nazoratda"}
            tone="bg-red-500"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
          <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Bugungi fokus</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Bugungi vazifalar</h2>
              </div>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                {todayTasks.length} ta
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {loading && <p className="text-sm text-slate-400">Yuklanmoqda...</p>}

              {!loading && !todayTasks.length && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                  Bugun uchun vazifalar topilmadi.
                </div>
              )}

              {!loading &&
                todayTasks.map((task) => (
                  <TaskCard key={task.id} task={task} compact />
                ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sana bo'yicha</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Vazifalar lentasi</h2>
              </div>
              <span className="text-sm text-slate-400">{calendarDates.length} kun</span>
            </div>

            <div className="mt-6 space-y-4">
              {!loading && !calendarDates.length && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                  Hali sana biriktirilgan vazifalar yo'q.
                </div>
              )}

              {calendarDates.map((date) => {
                const dateTasks = sortTasks(groupedTasks[date]);
                const openCount = dateTasks.filter((task) => !task.completed).length;
                const isToday = date === today;

                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className={`w-full rounded-3xl border p-5 text-left transition ${
                      isToday
                        ? "border-blue-200 bg-blue-50 shadow-sm"
                        : "border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-900">{formatDateLabel(date)}</h3>
                          {isToday && (
                            <span className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
                              Bugun
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {dateTasks.length} ta vazifa, {openCount} tasi ochiq
                        </p>
                      </div>

                      <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-600">
                        Batafsil
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3">
                      {dateTasks.slice(0, 2).map((task) => (
                        <TaskCard key={task.id} task={task} compact />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <DateModal date={selectedDate} tasks={modalTasks} onClose={() => setSelectedDate(null)} />
    </>
  );
}
