import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1  className='title'>Share your file </h1>
     <div className="main">
      <div className="upload">
          <button>
            upload
          </button>
      </div>
      <p className='orclass'> or</p>
      <div className="recieve">
        <button>recieve</button>
      </div>

     </div>
    </>
  )
}

export default App
