const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { MdFileCopy } = require('react-icons/md');
require('dotenv').config();

const app = express(); 
mongoose.connect(process.env.MONGO_URI,{
    useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("Connected to MongoDB Atlas"))
.catch(err => console.error("MongoDB connection error:", err));

const schema =new mongoose.Schema({
    folderName: { type: String, required: true }, 
    folderId: { type: String, required: true, unique: true },  
    uploadDate: { type: Date, default: Date.now },
    expireAt: { type: Date, required: true }, 
    downloadUrl: { type: String, required: true }, 
    token: { type: String, required: true, unique: true }, 
    files: [{ type: mongoose.Schema.Types.ObjectId, ref: "File" }],  
    isExpired: { type: Boolean, default: false }
    
})

const FileColl= mongoose.model("FileColl",schema);
module.exports = FileColl;


app.use(cors());
app.use(express.json());

app.get('/',(req,res)=>{
    res.send("hello")
})

const PORT = 5000;
app.listen(PORT,()=>{
    console.log(`server is runnig on ${PORT}`);
})