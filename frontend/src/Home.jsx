import { useState } from "react"
import "./App.css"

export default function Home( {onUpdate}){
    

    return(<>
    <h1  className='title'>Share your file </h1>
     <div className="main">
      <div className="upload">
          <button  onClick={()=>onUpdate("Upload")} >
            upload
          </button>
      </div>
      <p className='orclass'> or</p>
      <div className="recieve">
        <button  onClick={()=>onUpdate("Recieve")} >recieve</button>
      </div>

     </div>
    </>)
}