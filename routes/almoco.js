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
    });

    router.get('/', function (req, res) {
        res.render('index', {
            data: moment().format('DD/MMMM/YYYY, HH:mm')
        });
    });

    router.post('/confirmar', function (req, res) {
        let nome = req.body.nome;
        let local = req.body.local;
        let hora = req.body.hora;
        let encontro = req.body.encontro;
        let boleia = req.body.boleia;
        let data = moment().format('DD/MMMM/YYYY, HH:mm');

        if (hora >= 1200 && hora <= 1500) {

            let userObj = {
                nome: nome,
                local: local,
                hora: hora,
                data: data,
                encontro: encontro,
                boleia: boleia,
                tipo: 'almoco'
            };

            redis.set(nome, JSON.stringify(userObj), function () {
                redis.expire(nome, 43200);
            });
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
    });

    router.post('/remover', function (req, res) {
        let nome = req.body.nome;
        redis.del(nome, function () {
            res.send('OK');
        });
    });

    router.get('/listar', function (req, res) {
        redis.keys('*', function (err, keys) {
            res.json(keys);
        });
    });

    router.get('/listar/:key', function (req, res) {
        redis.get(req.params.key, function (err, result) {
            res.json(result);
        });
    });

    router.post('/tocar', function (request, res) {
        let nome = request.body.nome;

        let webhookUri = 'https://hooks.slack.com/services/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';

        let slack = new Slack();
        slack.setWebhook(webhookUri);
        slack.webhook({
            channel: '#general',
            username: 'CAMPAINHA LOQR',
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
