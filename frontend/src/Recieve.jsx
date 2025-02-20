import "./App.css";
import "./Receive.css";
import { useState } from 'react';


export default function Recieve({onUpdate}){
  const [token, setToken] = useState('');
    return(<>
     <button className="uploadBack" onClick={()=>onUpdate("Home")}>Back</button>
      <div className="input">
      <h1 className="heading">Receive Files</h1>
      <form>
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
        >
         submit
        </button>
      </form>
    </div>
    </>)
}