const express = require("express");

//cookie-parser import
const cookieParser = require("cookie-parser");

//jwt import
const jwt = require("jsonwebtoken");

const app = express();

const secretText = "superSecret";
const refreshSecretText = "superSuperSecret";

app.use(express.json()); //req.body 안의 내용을 받아올 수 있게함.

//cookie parser
app.use(cookieParser());

const port = 3000;
app.listen(port, () => {
    console.log("연결 성공!")
});

const posts = [
    {
        username: "john",
        title: "Post 1"
    },
    {
        username: "han",
        title: "Post 2"
    }
]

app.get("/", (req, res) => {
    res.send("hi");
})

app.get("/posts", authMiddleware, (req, res) => {
    res.json(posts);
})

//refreshToken , DB의 역할을 해줌.
let refreshTokens = [];

app.post("/login", (req, res) => {
    const username = req.body.username;
    const user = { name: username };

    // jwt이용 토큰 생성하기 payload + secret text, 유효기간 추가
    const accessToken = jwt.sign(user, secretText, { expiresIn: "30s" });

    // jwt를 이용하여 refreshToken 생성, 유효기간 추가
    const refreshToken = jwt.sign(user, refreshSecretText, { expiresIn: "1d" })

    // refreshToken 저장
    refreshTokens.push(refreshToken);

    // 쿠키에 refreshToken 저장
    res.cookie("jwt", refreshToken, {
        httpOnly: true, // 해커가 cookie부분을 탈취하는 것을 막아줌 (쿠키에 표현안됨.)
        maxAge: 24 * 60 * 60 * 1000
    });

    // 토큰 client에 보내기
    res.json({ accessToken: accessToken })
})

function authMiddleware(req, res, next) {
    //토큰을 request header에서 가져오기
    const authHeader = req.headers["authorization"];

    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) {
        return res.sendStatus(401);
    }
    // 토큰이 있으니 유효한 토큰인지 확인
    jwt.verify(token, secretText, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user; // A미들웨어에서 B미들웨어로 넘어갈때도 user정보를 사용하기 위해서
        next();
    })
}

app.get("/refresh", (req, res) => {

    const cookies = req.cookies;
    if (!cookies?.jwt) { // cookies의 jwt가 있으면 이라는 문법 근데 !가 붙었으니까 cookies가있고, 거기에 jwt가 없으면
        return res.sendStatus(403);
    }
    const refreshToken = cookies.jwt;

    // refreshToken이 DB에 있는 token인지 확인
    if (!refreshToken.includes(refreshTokens)) {
        return res.sendStatus(403);
    }

    // token이 유효한지 확인
    jwt.verify(refreshToken, refreshSecretText, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        // 유효하면 accessToken 생성하기
        const accessToken = jwt.sign({ name: user.name }, secretText, { expiresIn: "30s" });
        res.json({ accessToken: accessToken });
    })
})