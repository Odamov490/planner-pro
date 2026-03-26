import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { TaskProvider } from "./context/TaskContext";
import { NotificationProvider } from "./context/NotificationContext";
import { UserProvider } from "./context/UserContext"; // 🔥 YANGI

import { requestPermission } from "./utils/notify";

// 🔔 notification permission
requestPermission();

ReactDOM.createRoot(document.getElementById("root")).render(
  <UserProvider> {/* 🔥 ENG TEPADA */}
    <TaskProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </TaskProvider>
  </UserProvider>
);