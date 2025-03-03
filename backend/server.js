const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require("multer");
const fs = require("fs");
const Folder = require('./model');
// const File = require('./Filemodel');
const { getRandomString, generateCoupon } = require('./RandomUtil');
const createFolder = require('./UploadGoFile');
const FormData = require("form-data");
const axios = require("axios");
require('dotenv').config();

const app = express();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    tlsAllowInvalidCertificates: true, // Bypass SSL errors
    serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds if MongoDB is unreachable
})
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch(err => console.error("MongoDB connection error:", err));

const API_KEY = process.env.GOFILE_API;

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

app.post("/upload", upload.array("files", 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        // Get the best available server for upload
        const serverResponse = await axios.get('https://api.gofile.io/servers');
        const server = serverResponse.data.data.servers[0].name;
        console.log(server+" selected");

        // Create metadata for the database
        const folderName = getRandomString(9);

        // Creating a folder to store the files
        const folderId = await createFolder(folderName, '835593c9-5d64-4d01-a26a-f820cc4ccd65');

        // Generating token
        const token = generateCoupon();
        const expireAt = new Date(Date.now() + 60 * 60 * 1000); // 1-hour expiry

        let uploadedFiles = [];

        for (let file of req.files) {
            try {
                const filePath = file.path;
                const formData = new FormData();
                formData.append("file", fs.createReadStream(filePath));
                
                if (folderId) {
                    formData.append("folderId", folderId);
                }
    
                // Uploading files to GoFile.io
                const uploadResponse = await axios.post(
                    `https://${server}.gofile.io/uploadFile`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${API_KEY}`,
                            ...formData.getHeaders(),
                        },
                    }
                );
    
                if (uploadResponse.data.status !== "ok") {
                    console.error("Upload failed:", uploadResponse.data);
                    continue;
                }
    
                const downloadUrl = uploadResponse.data.data.downloadPage;
    
                uploadedFiles.push({
                    originalname: file.originalname,
                    downloadUrl,
                });
                console.log("uploaded :"+file.originalname)
                // Delete file after uploading
                fs.unlinkSync(filePath);
            } catch (uploadError) {
                console.error("Error uploading file:", uploadError);
            }
        }

        if (uploadedFiles.length === 0) {
            return res.status(500).json({ error: "All file uploads failed" });
        }

        // Save file data to the database
        const folderData = new Folder({
            folderId,
            folderName,
            uploadDate: new Date(),
            expireAt,
            downloadUrl: uploadedFiles.map(f => f.downloadUrl).join(", "),
            token,
            isExpired: false,
        });

        await folderData.save();

        res.json({ success: true, folderId,  token });

    } catch (error) {
        console.error("File upload failed:", error);
        res.status(500).json({ error: "File upload failed" });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
