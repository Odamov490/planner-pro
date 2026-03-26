import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { TaskProvider } from "./context/TaskContext";
import { NotificationProvider } from "./context/NotificationContext"; // 🔥 QO‘SHILDI
import { requestPermission } from "./utils/notify";

// 🔔 notification permission
requestPermission();

ReactDOM.createRoot(document.getElementById("root")).render(
  <TaskProvider>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </TaskProvider>
);