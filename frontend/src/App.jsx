import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Home from "./home";
import Recieve from "./Recieve";
import Upload from "./Upload";

function App() {
  const [show, setshow] = useState("Home");

  const UpdateUser = (newvalue) => {
    setshow(newvalue);
  };

  const render_content = () => {
    switch (show) {
      case "Upload":
        return <Upload onUpdate={UpdateUser}></Upload>;
      case "Recieve":
        return <Recieve onUpdate={UpdateUser}></Recieve>;
      case "Home":
        return <Home onUpdate={UpdateUser}></Home>;
    }
  };

  return <>{render_content()}</>;
}

export default App;
