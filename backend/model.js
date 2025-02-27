const schema = new mongoose.Schema({
    folderId: { type: String, required: true, unique: true },
    uploadDate: { type: Date, default: Date.now },
    expireAt: { type: Date, required: true },
    downloadUrl: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    files: [{ type: mongoose.Schema.Types.ObjectId, ref: "File" }],
    isExpired: { type: Boolean, default: false }

})

const File = mongoose.model("File", schema);
module.exports = File;