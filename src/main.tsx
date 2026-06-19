import React from "react";
import ReactDOM from "react-dom/client";
import Example from "./components/yahoo-stock/Example";
//import App from "./App";

// Render the app to the DOM
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* <App /> */}
    <Example />
  </React.StrictMode>,
);
