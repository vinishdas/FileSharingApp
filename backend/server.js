const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const archiver = require('archiver');
const { createClient } = require('@supabase/supabase-js');
const Folder = require('./model');
const { getRandomString, generateCoupon } = require('./RandomUtil');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    tlsAllowInvalidCertificates: true,
    serverSelectionTimeoutMS: 5000,
}).then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Allow requests from frontend
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Multer setup for local storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

// Helper function to create a zip
function createZip(files, outputZipPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputZipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve());
        archive.on('error', (err) => reject(err));

        archive.pipe(output);

        for (const file of files) {
            archive.file(file.path, { name: file.originalname });
        }

        archive.finalize();
    });
}

// Upload endpoint
app.post('/upload', upload.array('files', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        const folderName = getRandomString(9);
        const zipPath = `uploads/${folderName}.zip`;

        // Create ZIP
        await createZip(req.files, zipPath);

        // Upload ZIP to Supabase - FIX: Read file as buffer instead of stream
        const fileBuffer = fs.readFileSync(zipPath);
        
        const { data, error } = await supabase.storage
            .from('uploads')
            .upload(`${folderName}/${folderName}.zip`, fileBuffer, {
                cacheControl: '3600',
                contentType: 'application/zip',
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            return res.status(500).json({ error: "Failed to upload ZIP to storage" });
        }

        // Get public URL
        const { data: publicUrlData } = supabase
            .storage
            .from('uploads')
            .getPublicUrl(`${folderName}/${folderName}.zip`);

        const publicZipUrl = publicUrlData.publicUrl;

        // Cleanup local files
        fs.unlinkSync(zipPath);
        req.files.forEach(file => fs.unlinkSync(file.path));

        // Save metadata in MongoDB
        const token = generateCoupon();
        const expireAt = new Date(Date.now() +  5 *60 * 1000); // expire in 24 hours (changed from 10 minutes)

        const folderData = new Folder({
            folderId: folderName,
            folderName,
            uploadDate: new Date(),
            expireAt,
            downloadUrl: publicZipUrl,
            token,
            isExpired: false,
        });

        await folderData.save();

        res.json({ success: true, folderId: folderName, token });

    } catch (error) {
        console.error('Upload failed:', error);
        res.status(500).json({ error: "Upload failed" });
    }
});

app.get('/wake-up', (req, res) => {
    console.log('Received wake-up call!');
    res.status(200).send('Server is awake!');
  });


// Download endpoint (updated for private Supabase bucket)
app.get('/rec', async (req, res) => {
  try {
      const token = req.query.token;

      if (!token) {
          return res.status(400).json({ error: "Token is missing" });
      }

      // Find folder in MongoDB
      const folder = await Folder.findOne({ token });

      if (!folder) {
          return res.status(404).json({ error: "No folder found for this token" });
      }

      // Check expiry
      const currentDate = new Date();
      if (currentDate > new Date(folder.expireAt)) {
          // Mark as expired in database
          folder.isExpired = true;
          await folder.save();
          return res.status(410).json({ error: "The files have expired." });
      }

      // Generate signed URL from Supabase
      const { data, error } = await supabase.storage
          .from('uploads')
          .createSignedUrl(`${folder.folderId}/${folder.folderName}.zip`, 60 * 10); // signed URL valid for 10 minutes

      if (error || !data) {
          console.error('Error creating signed URL:', error);
          return res.status(500).json({ error: "Failed to create signed URL" });
      }

      // Redirect user to signed URL (auto download)
      res.redirect(data.signedUrl);

  } catch (error) {
      console.error('Download failed:', error);
      res.status(500).json({ error: "Failed to process request" });
  }
});

// Status endpoint to check if server is running
app.get('/status', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Cron job to delete expired files every hour (changed from 10 minutes)
const cron = require('node-cron');
cron.schedule('*/10 * * * *', async () => {
    try {
        console.log("Checking for expired files...");

        const currentDate = new Date();
        const expiredFolders = await Folder.find({ expireAt: { $lt: currentDate }, isExpired: false });

        for (const folder of expiredFolders) {
            console.log(`Deleting expired folder: ${folder.folderId}`);

            try {
                // Delete ZIP from Supabase
                const { error } = await supabase.storage
                    .from('uploads')
                    .remove([`${folder.folderId}/${folder.folderName}.zip`]);

                if (error) {
                    console.error(`Failed to delete ZIP from Supabase:`, error);
                } else {
                    console.log(`Deleted ZIP from Supabase: ${folder.folderId}`);
                }
            } catch (supabaseError) {
                console.error('Supabase deletion error:', supabaseError);
            }

            // Mark as expired in MongoDB
            folder.isExpired = true;
            await folder.save();
            console.log(`Marked MongoDB record as expired for: ${folder.folderId}`);
        }

    } catch (error) {
        console.error('Error during cleanup:', error);
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
