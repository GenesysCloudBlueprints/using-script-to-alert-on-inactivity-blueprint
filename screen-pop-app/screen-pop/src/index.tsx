import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { GrantLogin } from "./grantLogin";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <GrantLogin />
  </React.StrictMode>
);

