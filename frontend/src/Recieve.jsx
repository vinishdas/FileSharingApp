"use client"

import "./App.css"
import "./Receive.css"
import { useState } from "react"
import JSZip from "jszip"
import { saveAs } from "file-saver"

// Your API endpoint
const API_URL = "https://filesharingapp-1-k4ij.onrender.com"

const Receive = ({ onUpdate }) => {
  const [token, setToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [files, setFiles] = useState([])

  const handleTokenSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage("")
    setFiles([])

    if (!token.trim()) {
      setErrorMessage("Token cannot be empty")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/rec?token=${token}`)
      if (!response.ok) {
        throw new Error("Invalid token or file expired.")
      }

      const blob = await response.blob()

      // Use JSZip to extract the files
      const zip = await JSZip.loadAsync(blob)

      const extractedFiles = []
      zip.forEach(async (relativePath, file) => {
        if (!file.dir) {
          const fileData = await file.async("blob")
          extractedFiles.push({ name: relativePath, blob: fileData })
          setFiles(prev => [...prev, { name: relativePath, blob: fileData }])
        }
      })

    } catch (error) {
      console.error("Error processing ZIP:", error)
      setErrorMessage(error.message || "Failed to fetch files.")
    } finally {
      setIsLoading(false)
    }
  }

  const downloadAll = () => {
    files.forEach(file => {
      saveAs(file.blob, file.name)
    })
  }

  return (
    <>
      <button className="uploadBack" onClick={() => onUpdate("Home")}>
        Back
      </button>

      <div className="input">
        <h1 className="heading">Receive Files</h1>

        <form onSubmit={handleTokenSubmit} className="form-container">
          <div className="input-container">
            <label htmlFor="token" className="label">Enter your token</label>
            <input
              type="text"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="input2"
              placeholder="Enter the file access token"
              required
            />
          </div>

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <button type="submit" disabled={isLoading} className="submit-button">
            {isLoading ? "Loading..." : "Access Files"}
          </button>
        </form>

        {files.length > 0 && (
          <>
            <h2 className="heading">Files Ready:</h2>
            <ul className="file-list">
              {files.map((file, index) => (
                <li key={index}>
                  {file.name}
                </li>
              ))}
            </ul>
            <button className="submit-button" onClick={downloadAll}>
              Download All Files
            </button>
          </>
        )}
      </div>
    </>
  )
}

export default Receive
