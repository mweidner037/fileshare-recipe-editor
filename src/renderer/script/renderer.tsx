import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/app";
import { setupReceiveIpc } from "./ipc/receive_ipc";

setupReceiveIpc();

const root = createRoot(document.getElementById("app")!);
root.render(<App />);
