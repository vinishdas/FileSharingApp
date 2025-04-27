"use client"

import { BrowserRouter } from "react-router-dom"
import { useState } from "react"
import "./App.css"
import Home from "./Home"
import Recieve from "./Recieve"
import Upload from "./Upload"

function App() {
  const [show, setshow] = useState("Home")

  const UpdateUser = (newvalue) => {
    console.log("Switching to:", newvalue)
    setshow(newvalue)
  }

  const render_content = () => {
    switch (show) {
      case "Upload":
        return <Upload onUpdate={UpdateUser} className="fade-in" />
      case "Recieve":
        return <Recieve onUpdate={UpdateUser} className="fade-in" />
      case "Home":
      default:
        return <Home onUpdate={UpdateUser} className="fade-in" />
    }
  }

  return (
    <BrowserRouter>
      <div className="app-container">{render_content()}</div>
    </BrowserRouter>
  )
}

export default App
