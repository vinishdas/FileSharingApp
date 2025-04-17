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
// const puppeteer = require('puppeteer');
const puppeteer = require("puppeteer"); // instead of puppeteer-core

const archiver = require('archiver');
const cron = require("node-cron");
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




// async function extractWtTokenFromDownloadPage(downloadPageUrl) {
//     const browser = await puppeteer.launch({ headless: 'new' });
//     const page = await browser.newPage();

//     let wtToken = null;

//     // Listen for network requests to capture the WT token
//     page.on('request', request => {
//         const url = request.url();
//         if (url.includes('/contents/')) {
//             const match = url.match(/wt=([^&]+)/);
//             if (match) {
//                 wtToken = match[1];
//             }
//         }
//     });

//     await page.goto(downloadPageUrl, { waitUntil: 'networkidle2' });

//     // Wait a bit for all network requests to go through
//     await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)));
//     await browser.close();
//     console.log("Extracted wt token:", wtToken);

//     return wtToken;
// }

async function extractWtTokenFromDownloadPage(downloadPageUrl) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
    });
  
    const page = await browser.newPage();
  
    let wtToken = null;
  
    // Listen for network requests to capture the WT token
    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("/contents/")) {
        const match = url.match(/wt=([^&]+)/);
        if (match) {
          wtToken = match[1];
        }
      }
    });
  
    await page.goto(downloadPageUrl, { waitUntil: "networkidle2" });
  
    // Wait a bit for all network requests to go through
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 3000)));
  
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
  
      // Find the folder by token in the database
      const folder = await Folder.findOne({ token });
      if (!folder) {
        return res.status(404).json({ error: "No folder found for this token" });
      }
  
      // Check if the file has expired
      const currentDate = new Date();
      const expireAt = new Date(folder.expireAt);
      if (currentDate > expireAt) {
        // If the file has expired, return an error response
        return res.status(410).json({ error: "The files have expired." });
      }
  
      console.log("Found folder: ", folder.folderId);
      const firstDownloadUrl = folder.downloadUrl.split(",")[0].trim();
  
      // Fetch the WT token
      const wtToken = await extractWtTokenFromDownloadPage(firstDownloadUrl);
      if (!wtToken) {
        return res.status(500).json({ error: "WT token not found" });
      }
  
      const gofileUrl = `https://api.gofile.io/contents/${folder.folderId}?wt=${wtToken}`;
  
      // Fetch folder contents from GoFile API
      const response = await axios.get(gofileUrl, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      });
  
      if (response.data.status !== 'ok') {
        return res.status(500).json({ error: "Failed to fetch folder contents" });
      }
  
      const childFiles = response.data.data.children;
      const files = Object.values(childFiles);
  
      if (files.length === 0) {
        return res.status(404).json({ error: "No files in folder" });
      }
  
      // Set headers to force download the zip file
      res.setHeader('Content-Disposition', 'attachment; filename="download.zip"');
      res.setHeader('Content-Type', 'application/zip');
  
      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(res);
  
      // Append each file to the zip archive
      for (const file of files) {
        const fileStream = await axios.get(file.link, { responseType: 'stream' });
        archive.append(fileStream.data, { name: file.name });
      }
  
      await archive.finalize();
  
    } catch (error) {
      console.error("Error occurred: ", error);
      res.status(500).json({ error: "An error occurred while processing your request" });
    }
  });



  cron.schedule('*/10 * * * *', async () => {
    try {
      console.log("Checking for expired files...");
  
      const currentDate = new Date();
  
      // Find all expired files in MongoDB
      const expiredFiles = await Folder.find({ expireAt: { $lt: currentDate }, isExpired: false });
  
      if (expiredFiles.length === 0) {
        console.log("No expired files found.");
        return;
      }
  
      for (const file of expiredFiles) {
        console.log(`Deleting expired file with token: ${file.token}`);
  
        // Delete file from GoFile.io
        const gofileDeleteUrl = `https://api.gofile.io/contents/${file.folderId}`;
        try {
          const deleteResponse = await axios.delete(gofileDeleteUrl, {
            headers: {
              Authorization: `Bearer ${API_KEY}`,
            },
          });
  
          if (deleteResponse.data.status === 'ok') {
            console.log(`File deleted from GoFile.io: ${file.folderId}`);
          } else {
            console.log(`Failed to delete file from GoFile.io: ${file.folderId}`);
          }
        } catch (deleteError) {
          console.error(`Error deleting file from GoFile.io: ${file.folderId}`, deleteError);
        }
  
        // Delete file record from MongoDB
        await Folder.deleteOne({ _id: file._id });
        console.log(`Deleted file record from MongoDB: ${file._id}`);
      }
  
    } catch (error) {
      console.error("Error during expired file cleanup: ", error);
    }
  });

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
