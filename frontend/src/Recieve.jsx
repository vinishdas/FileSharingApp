import "./App.css";
import "./Receive.css";
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Recieve = ({ onUpdate }) => {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleTokenSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await axios.post('/api/verify-token', { token });
      
      if (response.data.valid) {
        navigate(`/retrieve/${token}`);
      } else {
        
        alert('Invalid token. Please check and try again.');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
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
          disabled={isLoading}
          className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isLoading ? 'Verifying...' : 'Access Files'}
        </button>
      </form>
    </div>
    </>)
}
export default Recieve;