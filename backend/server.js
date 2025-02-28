const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require("multer");
const Folder = require('./model');
const File = require('./Filemodel')
const { MdFileCopy } = require('react-icons/md');
require('dotenv').config();

const app = express();
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch(err => console.error("MongoDB connection error:", err));




app.use(cors());
app.use(express.json());

 app.post("/upload",async(req,res)=>{
    try{
        const files = req.body;
        const fileDoc = await File.insertMany(files.map(file=>({
            filename: file.filename
        })));

    }
 })

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`server is runnig on ${PORT}`);
})