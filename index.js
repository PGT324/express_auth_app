const express = require("express");

const app = express();

app.use(express.json()); //req.body 안의 내용을 받아올 수 있게함.

const port = 3000;
app.listen(port, () => {
    console.log("연결 성공!")
});