import logo from "./logo.svg";
import "./App.css";
import React from "react";
import axios from "axios";
import { useState } from "react";
import { getData, LoadConversation } from "./grantLogin";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>{window.location.toString()}</p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <button onClick={getData}> GET DATA </button>
      </header>
    </div>
  );
}

export default App;
