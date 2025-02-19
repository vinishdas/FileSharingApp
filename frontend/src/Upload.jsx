import './App.css'

export default function Upload({onUpdate}){
    return(<>
        <button className="uploadBack" onClick={()=>onUpdate("Home")}>Back</button>
        <p>upload</p>
    </>)
}