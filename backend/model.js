const schema = new mongoose.Schema({
    folderId: { type: String, required: true, unique: true },
    folderName:{type:String,required: true,unique:true},
    uploadDate: { type: Date, default: Date.now },
    expireAt: { type: Date, required: true },
    downloadUrl: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    isExpired: { type: Boolean, default: false }

})

const Folder = mongoose.model("Folder", schema);
module.exports = Folder;