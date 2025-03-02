const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require("multer");
const Folder = require('./model');
const File = require('./Filemodel')
const { MdFileCopy } = require('react-icons/md');
const {getRandomString,generateCoupon} = require('./RandomUtil');
const {createFolder} = require('./UploadGoFile');
const FormData = require("form-data");
const axios = require("axios"); 
const Folder = require('./model');

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



const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });//settting a limter to how big the fiels can be 
 app.post("/upload",upload.array("files",5) ,async(req,res)=>{
    try{
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }
        //get the best server avilabel online 

        const serverResponse = await axios.get('https://api.gofile.io/getServer');
        const server = serverResponse.data.data.server;
        
        //creat meta data for the databse 

        const folderName = getRandomString(9);

        //creating folder to store the fiels 
        const folderId = createFolder(folderName,'835593c9-5d64-4d01-a26a-f820cc4ccd65');
        
        //generating token 
        const token  = generateCoupon();
        const expireAt = new Date(Date.now() + 60 * 60 * 1000);
        let uploadedFiles = [];
        //creging a form data to send viva api callf or gofile.io 
        for (let file of req.files) {
            const filePath = file.path;
            const formData = new FormData();
            formData.append("file", fs.createReadStream(filePath));
            formData .append('folderId', folderId); 

            //uploading files to GOFile.io
            const uploadResponse = await axios.post(`https://${server}.gofile.io/uploadFile`, form, {
                headers: {
                    Authorization: API_KEY,
                    ...formData.getHeaders(),
                },
            });
    
            console.log("File Uploaded:", uploadResponse.data.data.downloadPage);
            uploadedFiles.push({originalname:file.originalname,
                downloadUrl
            });
            fs.unlinkSync(filePath);

    }

    const fileData = new File({
        folderId,
        folderName,
        uploadDate: new Date(),
        expireAt,
        downloadUrl: uploadedFiles.map(f => f.downloadUrl).join(", "),
        token,
        isExpired: false
    });
    await fileData.save();
    res.json({ success: true, folderId, files: uploadedFiles, token });

 }catch (error) {
    res.status(500).json({ error: "File upload failed" });
}
});
 

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`server is runnig on ${PORT}`);
})