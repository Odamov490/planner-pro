import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import {TaskProvider} from "./context/TaskContext";
import {requestPermission} from "./utils/notify";

requestPermission();

ReactDOM.createRoot(document.getElementById("root")).render(
 <TaskProvider><App/></TaskProvider>
);
