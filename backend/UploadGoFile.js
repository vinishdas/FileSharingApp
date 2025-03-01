const axios = require('axios');
require('dotenv').config(); 


async function createFolder(folderName, parentFolderId = null) {
    const API_KEY = process.env.GOFILE_API;

    
    const response = await axios.post('https://api.gofile.io/createFolder', {
        parentFolderId: parentFolderId, // Set this to null if it's a root folder
        name: folderName
    }, {
        headers: {
            Authorization: API_KEY
        }
    });

    return response.data.data.id; // Returns the folder ID
}

 module.exports = createFolder;
