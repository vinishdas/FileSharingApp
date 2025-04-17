import "./App.css";
import "./Receive.css";
import { useState } from "react";
import { saveAs } from "file-saver";

const Recieve = ({ onUpdate }) => {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTokenSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
  
    try {
      const response = await fetch(`/rec?token=${token}`);
  
      if (!response.ok) {
        const errorText = await response.text(); // Grab error body
        throw new Error(`Server error: ${errorText}`);
      }
  
      // Check for correct content type
      const contentType = response.headers.get("Content-Type");
      if (!contentType || !contentType.includes("application/zip")) {
        const errorText = await response.text(); // May be HTML or JSON
        throw new Error(`Expected ZIP but got: ${contentType}\n${errorText}`);
      }
  
      const blob = await response.blob();
      const zipFileName = `${token}.zip`;
  
      saveAs(blob, zipFileName);
    } catch (error) {
      console.error("Error downloading ZIP:", error);
      alert("An error occurred. Please check the token and try again.");
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <>
      <button className="uploadBack" onClick={() => onUpdate("Home")}>
        Back
      </button>

      <div className="input">
        <h1 className="heading">Receive Files</h1>
        <form onSubmit={handleTokenSubmit}>
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
              placeholder="Enter the file access token"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isLoading ? "Verifying..." : "Access Files"}
          </button>
        </form>
      </div>
    </>
  );
};

export default Recieve;

