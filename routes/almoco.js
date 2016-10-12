const express = require('express');
const router = express.Router();
const blinkstick = require('blinkstick');
const led = blinkstick.findFirst();
const moment = require('moment');
const Slack = require('slack-node');
moment.locale('pt');

module.exports = function (io, redis) {

    io.on('connection', function (socket) {
        socket.join('geral');
        console.log(socket);
    });

    router.get('/', function (req, res) {
        res.render('index', {
            data: moment().format('DD/MMMM/YYYY, HH:mm')
        });
    });

    router.post('/registar', function (req, res) {
        let nome = req.body.nome;
        let nonce = req.body.nonce;

        let userObj = {
            nome: nome,
            nonce: nonce
        };
        redis.select(1, function () {
            redis.get(nome, function (err, result) {
                if (!result) {
                    redis.set(nome, JSON.stringify(userObj), function () {
                        res.send('OK');
                    });
                } else {
                    res.send('EXISTE');
                }
            });
        });
    });

    router.post('/confirmar', function (req, res) {
        let nome = req.body.nome;
        let local = req.body.local;
        let hora = req.body.hora;
        let encontro = req.body.encontro;
        let boleia = req.body.boleia;
        let data = moment().format('DD/MMMM/YYYY, HH:mm');
        let nonce = req.body.nonce;
        redis.select(0, function () {
            redis.get(nome, function (err, result) {
                if (!result) {
                    redis.select(1, function () {
                        redis.get(nome, function (err, registo) {
                            if (registo) {
                                let registoObj = JSON.parse(registo);
                                if (registoObj.nonce === nonce) {
                                    if (hora >= 1200 && hora <= 1500) {

                                        let userObj = {
                                            nome: nome,
                                            local: local,
                                            hora: hora,
                                            data: data,
                                            encontro: encontro,
                                            boleia: boleia,
                                            tipo: 'almoco',
                                            nonce: nonce
                                        };
                                        redis.select(0, function () {
                                            redis.set(nome, JSON.stringify(userObj), function () {
                                                redis.expire(nome, 25200);
                                            });
                                        });

                                        let webhookUri = 'https://hooks.slack.com/services/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';

                                        let slack = new Slack();
                                        slack.setWebhook(webhookUri);
                                        slack.webhook({
                                            channel: '#lunch_time',
                                            username: 'BLUNCH',
                                            text: 'O ' + nome + ' confirmou que vem almoçar, ao restaurante ' + local + ' e vem ter ao local ' + encontro + ', pelas ' + hora,
                                            icon_emoji: ':hamburger:'
                                        }, function (err, response) {});


                                        io.to('geral').emit('confirmado');
                                        led.blink('green', {
                                            repeats: 15,
                                            index: 0,
                                            delay: 100
                                        }, function () {});
                                        led.blink('green', {
                                            repeats: 15,
                                            index: 1,
                                            delay: 100
                                        }, function () {});

                                        res.send('OK');
                                    } else {
                                        res.send('HORA_INVALIDA');
                                    }
                                } else {
                                    res.send('NONCE_INVALIDO');
                                }
                            } else {
                                res.send('NAO_EXISTE_REGISTO');
                            }
                        });
                    });


                } else {
                    res.send('EXISTE');
                }
            });
        });
    });

    router.post('/remover', function (req, res) {
        let nome = req.body.nome;
        redis.select(0, function () {
            redis.get(nome, function (err, result) {
                if (result) {
                    redis.del(nome, function () {
                        let webhookUri = 'https://hooks.slack.com/services/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';
                        let slack = new Slack();
                        slack.setWebhook(webhookUri);
                        slack.webhook({
                            channel: '#lunch_time',
                            username: 'BLUNCH',
                            text: 'O ' + nome + ' já não vem almoçar... Enfim, para a próxima vai a pé!',
                            icon_emoji: ':hamburger:'
                        }, function (err, response) {});
                        led.blink('red', {
                            repeats: 15,
                            index: 0,
                            delay: 100
                        }, function () {});
                        led.blink('red', {
                            repeats: 15,
                            index: 1,
                            delay: 100
                        }, function () {});
                        res.send('OK');
                    });
                } else {
                    res.send('NAO_EXISTE');
                }
            });
        });
    });

    router.get('/listar', function (req, res) {
        redis.select(0, function () {
            redis.keys('*', function (err, keys) {
                res.json(keys);
            });
        });
    });

    router.get('/listar/:key', function (req, res) {
        redis.select(0, function () {
            redis.get(req.params.key, function (err, result) {
                res.json(result);
            });
        });
    });

    router.post('/tocar', function (request, res) {
        let nome = request.body.nome;

        let webhookUri = 'https://hooks.slack.com/services/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';

        let slack = new Slack();
        slack.setWebhook(webhookUri);
        slack.webhook({
            channel: '#general',
            username: 'BBELLER',
            text: 'O ' + nome + ' está à porta!',
            icon_emoji: ':bell:'
        }, function (err, response) {});

        led.blink('blue', {
            repeats: 15,
            index: 0,
            delay: 100
        }, function () {});
        led.blink('blue', {
            repeats: 15,
            index: 1,
            delay: 100
        }, function () {});

        res.send('OK');
    });

    return router;

};
