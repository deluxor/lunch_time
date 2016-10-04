const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const app = express();
const redis = require('redis');
const redisClient = redis.createClient();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const almoco = require('./routes/almoco')(io, redisClient);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
    res.io = io;
    next();
});

app.use('/almoco', almoco);

module.exports = {
    app: app,
    server: server
};
