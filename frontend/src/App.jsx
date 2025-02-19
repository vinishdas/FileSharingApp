import { useState } from "react";
import "./App.css";
import Home from "./home";
import Recieve from "./Recieve";
import Upload from "./Upload";
import {AnimatePresence, motion} from "framer-motion";

function App() {
  const [show, setshow] = useState("Home");

  const UpdateUser = (newvalue) => {
    setshow(newvalue);
  };


  const render_content = () => {
    switch (show) {
      case "Upload":
        return <Upload onUpdate={UpdateUser} className="fade-in" />;
      case "Recieve":
        return <Recieve onUpdate={UpdateUser} className="fade-in" />;
      case "Home":
      default:
        return <Home onUpdate={UpdateUser} className="fade-in" />;
    }
  };

  return <div>{render_content()}</div>;
}

export default App;
