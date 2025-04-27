const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
    folderId: String,
    folderName: String,
    uploadDate: Date,
    expireAt: Date,
    downloadUrl: String,
    token: String,
    isExpired: { type: Boolean, default: false }
});

module.exports = mongoose.model('Folder', folderSchema);
