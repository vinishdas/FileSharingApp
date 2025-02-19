import "./App.css";

export default function Recieve({onUpdate}){
    return(<>
     <button className="uploadBack" onClick={()=>onUpdate("Home")}>Back</button>
       <h1> heyy</h1>
    </>)
}