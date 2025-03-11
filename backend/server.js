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
const puppeteer = require('puppeteer');
const archiver = require('archiver');
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
        console.log(server + " selected");

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
                console.log("uploaded :" + file.originalname)
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

        res.json({ success: true, folderId, folderName, token });

    } catch (error) {
        console.error("File upload failed:", error);
        res.status(500).json({ error: "File upload failed" });
    }
});




async function extractWtTokenFromDownloadPage(downloadPageUrl) {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    let wtToken = null;

    // Listen for network requests to capture the WT token
    page.on('request', request => {
        const url = request.url();
        if (url.includes('/contents/')) {
            const match = url.match(/wt=([^&]+)/);
            if (match) {
                wtToken = match[1];
            }
        }
    });

    await page.goto(downloadPageUrl, { waitUntil: 'networkidle2' });

    // Wait a bit for all network requests to go through
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)));
    await browser.close();
    console.log("Extracted wt token:", wtToken);

    return wtToken;
}


app.get("/rec", async (req, res) => {
    try {

        const token = req.query.token;
        if (!token) {
            return res.status(400).json({ error: "Token is missing" });
        }

        // Find all records with this token
        const folder = await Folder.findOne({ token });
        console.log("found folder " + folder.folderId);
        if (folder.length === 0) {
            return res.status(404).json({ error: "No folders found for this token" });
        }
        console.log(folder.downloadUrl);
        const firstDownloadUrl = folder.downloadUrl.split(",")[0].trim();
        console.log(firstDownloadUrl);
        const wtToken = await extractWtTokenFromDownloadPage(firstDownloadUrl);

        if (!wtToken) {
            return res.status(500).json({ error: "WT token not found very sorry " });
        }

        const gofileUrl = `https://api.gofile.io/contents/${folder.folderId}?wt=${wtToken}`;
        const response = await axios.get(gofileUrl, {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
            },
        });
        if (response.data.status !== 'ok') {
            return res.status(500).json({ error: " fetch folder contents" });
        }else
        console.log("fetdhed files from the folder and saved in the zip");

        const child = response.data.data.children;
        const filee = Object.values(child);
        if (filee.length == 0) {
            return res.status(404).json({ error: 'No files in folder' });
        }
        res.setHeader('Content-Disposition', 'attachment; filename="download.zip"');
        res.setHeader('Content-Type', 'application/zip');
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);


        for (const file of filee) {
            const fileStream = await axios.get(file.link, { responseType: 'stream' });
            archive.append(fileStream.data, { name: file.name });
        }

        await archive.finalize();
    } catch (error) {
        console.error("toekn not exists", error);
        res.status(404).json({ error: "token doesn't exists " });
    }
})

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
