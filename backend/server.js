const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
require('dotenv').config();

const app = express(); 
const mongoURI = ' ';
app.use(cors());
app.use(express.json());

app.get('/',(req,res)=>{
    res.send("hello")
})

const PORT = 5000;
app.listen(PORT,()=>{
    console.log(`server is runnig on ${PORT}`);
})