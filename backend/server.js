const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express(); 

app.use(cors());
app.use(express.json());

app.get('/',(req,res)=>{
    res.send("hello")
})

const PORT = 5000;
app.listen(PORT,()=>{
    console.log(`server is runnig on ${PORT}`);
})