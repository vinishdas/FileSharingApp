import "./App.css";
import { useState } from "react";

export default function Upload({ onUpdate }) {
  const [file, setfile] = useState([]);
  const change = (event) => {
    setfile([...event.target.files]);
  };
  return (
    <>
      <button className="uploadBack" onClick={() => onUpdate("Home")}>
        Back
      </button>
      <p>upload</p>
      <label for="images" class="drop-container" id="dropcontainer">
        <span class="drop-title">Drop files here</span>
        or
        <input
          placeholder="Enter your text..."
          class="input"
          name="file"
          type="file"
          multiple
          onChange={change}
        />
      </label>

      {file.length > 0 && (
        <ul>
          {file.map((file, index) => (
            <li  key={index}>{file.name}</li>
          ))}
        </ul>
      )}
    </>
  );
}
