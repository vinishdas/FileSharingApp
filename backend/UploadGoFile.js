const axios = require('axios');
require('dotenv').config();

async function createFolder(folderName, parentFolderId) {
    const API_KEY = process.env.GOFILE_API;
    console.log('API Key:', API_KEY);


    const response = await axios.post('https://api.gofile.io/contents/createFolder', {
        parentFolderId: parentFolderId,
        folderName: folderName
    }, {
        headers: {
            Authorization: `Bearer ${API_KEY}`, 
            'Content-Type': 'application/json'
        }
    });

    return response.data.data.id; // Returns the folder ID
}

module.exports = createFolder;
