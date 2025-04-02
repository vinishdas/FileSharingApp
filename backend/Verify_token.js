const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const File = require('./model');


router.post('/api/verify-token', async (req, res) => {
  const { token } = req.body;
  
  try {
    //finding the token
    const file = await File.findOne({ token });
    //checking for expiration of token
    if (file && new Date() < file.expiresAt) {
      return res.json({ valid: true, fileId: fileShare._id });
    } else {
      return res.json({ valid: false });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ valid: false, error: 'Server error' });
  }
});

module.exports = router;