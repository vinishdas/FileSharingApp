const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require("multer");
const Folder = require('./model');
const File = require('./Filemodel')
const { MdFileCopy } = require('react-icons/md');
const {getRandomString,generateCoupon} = require('./RandomUtil');
const {createFolder} = require('./UploadGoFile')

require('dotenv').config();





const app = express();
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch(err => console.error("MongoDB connection error:", err));

const API_KEY = process.env.GOFILE_KEY;


app.use(cors());
app.use(express.json());

 
 
 
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});



const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

 app.post("/upload",upload.array("files",5) ,async(req,res)=>{
    try{
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }
        const folderId = getRandomString(9);
        const token  = generateCoupon();
        const expireAt = new Date(Date.now() + 60 * 60 * 1000);
        let uploadedFiles = [];

        for (let file of req.files) {
            const filePath = file.path;
            const formData = new FormData();
            formData.append("file", fs.createReadStream(filePath));

    }
 }catch (error) {
    res.status(500).json({ error: "File upload failed" });
}
});
 

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`server is runnig on ${PORT}`);
})