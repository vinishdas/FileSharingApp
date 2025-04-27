"use client"

import "./App.css"
import { useState } from "react"

// Get the API URL from environment variables or use a default
const API_URL = "https://filesharingapp-1-k4ij.onrender.com"

export default function Upload({ onUpdate }) {
  const [files, setFiles] = useState([])
  const [token, setToken] = useState(null)
  const [copyMsg, setCopyMsg] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [progress, setProgress] = useState(0) // Added for upload progress

  const change = (event) => {
    const selectedFiles = [...event.target.files]
    setFiles(selectedFiles)
    setErrorMessage("") // Clear error message on file selection change
  }

  const handleUpload = async () => {
    if (files.length === 0) return setErrorMessage("No files selected!")

    // Remove file type validation since server will zip any file type
    // This allows users to upload any file type, not just zip files

    const formData = new FormData()
    files.forEach((file) => formData.append("files", file))

    // Set loading state to true to show animation
    setIsUploading(true)
    setErrorMessage("") // Clear any previous errors
    setProgress(0)

    try {
      // Use XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          setProgress(percentComplete)
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText)
          if (data.success) {
            setToken(data.token)
          } else {
            setErrorMessage("Upload failed, please try again.")
          }
        } else {
          setErrorMessage("Upload failed with status: " + xhr.status)
        }
        setIsUploading(false)
      }

      xhr.onerror = () => {
        setErrorMessage("Network error occurred during upload.")
        setIsUploading(false)
      }

      xhr.open("POST", `${API_URL}/upload`, true)
      xhr.send(formData)
    } catch (err) {
      console.error("Upload error:", err)
      setErrorMessage("An error occurred while uploading files.")
      setIsUploading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(token)
      setCopyMsg("Copied!")
      setTimeout(() => setCopyMsg(""), 1500) // Reset the message after 1.5 seconds
    } catch (err) {
      setCopyMsg("Failed to copy!")
    }
  }

  const resetForm = () => {
    setFiles([])
    setToken(null)
    setErrorMessage("")
    setCopyMsg("")
    setProgress(0)
  }

  return (
    <>
      <button className="uploadBack" onClick={() => onUpdate("Home")}>
        Back
      </button>

      <label htmlFor="images" className="drop-container" id="dropcontainer">
        <span className="drop-title">Drop files here</span>
        or
        <input className="inputFile" name="file" type="file" multiple onChange={change} />
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

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {isUploading && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          <div className="progress-text">{progress}% Uploaded</div>
        </div>
      )}

      {files.length > 0 && !isUploading && !token && (
        <button onClick={handleUpload} className="uploadButton">
          Upload Files
        </button>
      )}

      {token && (
        <div className="tokenSection">
          <p>
            🔑 Token: <strong>{token}</strong>
          </p>
          <p>Share this token with others to allow them to download your files.</p>
          <p>Files will expire in 24 hours.</p>
          <button onClick={copyToClipboard}>{copyMsg ? copyMsg : "Copy Token"}</button>
        </div>
      )}

      {/* Option to reset the form after upload */}
      {token && (
        <button className="resetButton" onClick={resetForm}>
          Upload More Files
        </button>
      )}
    </>
  )
}
