"use client"

import "./App.css"
import "./Receive.css"
import { useState } from "react"

// Get the API URL from environment variables or use a default
const API_URL =  "https://filesharingapp-1-k4ij.onrender.com"

const Receive = ({ onUpdate }) => {
  const [token, setToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [downloadStarted, setDownloadStarted] = useState(false)

  const handleTokenSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage("") // Clear previous errors
    setDownloadStarted(false)

    if (!token.trim()) {
      setErrorMessage("Token cannot be empty")
      setIsLoading(false)
      return
    }

    try {
      // First check if the token is valid without redirecting
      const checkResponse = await fetch(`${API_URL}/rec?token=${token}`, {
        method: "HEAD",
      })

      if (!checkResponse.ok) {
        if (checkResponse.status === 404) {
          throw new Error("Invalid token. Please check and try again.")
        } else if (checkResponse.status === 410) {
          throw new Error("This file has expired and is no longer available.")
        } else {
          throw new Error(`Server error: ${checkResponse.status}`)
        }
      }

      // If token is valid, start the download
      setDownloadStarted(true)

      // Use window.location to trigger the download
      window.location.href = `${API_URL}/rec?token=${token}`

      // Reset the token after successful download initiation
      setTimeout(() => {
        setToken("")
        setIsLoading(false)
      }, 2000)
    } catch (error) {
      console.error("Error downloading ZIP:", error)
      setErrorMessage(error.message || "An error occurred. Please check the token and try again.")
      setIsLoading(false)
    }
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
            <label htmlFor="token" className="label">
              Enter your token
            </label>
            <input
              type="text"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="input2"
              placeholder="Enter the file access token (e.g., ABCD-EFGH-IJKL)"
              required
            />
          </div>

          {/* Show error message */}
          {errorMessage && <p className="error-message">{errorMessage}</p>}

          {/* Show success message */}
          {downloadStarted && (
            <p className="success-message">
              Download started! If it doesn't begin automatically, please check your browser settings.
            </p>
          )}

          <button type="submit" disabled={isLoading} className="submit-button">
            {isLoading ? "Verifying..." : "Access Files"}
          </button>
        </form>
      </div>
    </>
  )
}

export default Receive
