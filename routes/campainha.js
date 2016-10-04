const express = require('express');
const router = express.Router();
const blinkstick = require('blinkstick');
const led = blinkstick.findFirst();

module.exports = function () {
    router.post('/tocar', function (req, res) {
        led.pulse('blue', {
            duration: 10000,
            steps: 300,
            index: 0
        }, function () {});
        led.pulse('blue', {
            duration: 10000,
            steps: 300,
            index: 1
        }, function () {});

        res.send('OK');
    });

    return router;
};
