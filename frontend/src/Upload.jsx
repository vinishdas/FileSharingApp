import "./App.css";
import { useState } from "react";

export default function Upload({ onUpdate }) {
  const [files, setFiles] = useState([]);
  const [token, setToken] = useState(null);
  const [copyMsg, setCopyMsg] = useState("");

  const change = (event) => {
    setFiles([...event.target.files]);
  };

  const handleUpload = async () => {
    if (files.length === 0) return alert("No files selected!");

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setToken(data.token);
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopyMsg("Copied!");
      setTimeout(() => setCopyMsg(""), 1500);
    } catch (err) {
      setCopyMsg("Failed to copy!");
    }
  };

  return (
    <>
      <button className="uploadBack" onClick={() => onUpdate("Home")}>
        Back
      </button>

      <label htmlFor="images" className="drop-container" id="dropcontainer">
        <span className="drop-title">Drop files here</span>
        or
        <input
          className="inputFile"
          name="file"
          type="file"
          multiple
          onChange={change}
        />
      </label>

      {files.length > 0 && (
        <ul>
          {files.map((file, index) => (
            <li className="uploadedFile" key={index}>
              📂{file.name}
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <button onClick={handleUpload} className="uploadButton">
          Upload Files
        </button>
      )}

      {token && (
        <div className="tokenSection">
          <p>🔑 Token: <strong>{token}</strong></p>
          <button onClick={copyToClipboard}>Copy Token</button>
          {copyMsg && <span style={{ marginLeft: "10px" }}>{copyMsg}</span>}
        </div>
      )}
    </>
  );
}
