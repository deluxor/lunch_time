var socket = io();
var cova = 0;
var bel = 0;
var cafe = 0;

function actualizaTabela() {

    cova = 1;
    bel = 1;
    cafe = 1;

    $('#cova').html(0);
    $('#bel').html(0);
    $('#cafe').html(0);

    if ($('#tBody').html != '') {
        $('#tBody').html('');
    }

    $.getJSON('almoco/listar', function (data) {
        for (var i = 0; i < data.length; i++) {
            $.getJSON('almoco/listar/' + data[i], function (dataUser) {
                var dataJson = JSON.parse(dataUser);

                if (dataJson.local === 'Cova Tropical') {
                    $('#cova').html(cova++);
                } else if (dataJson.local === 'Bel-Bel') {
                    $('#bel').html(bel++);
                } else if (dataJson.local === 'Café Café') {
                    $('#cafe').html(cafe++);
                }

                $('#tBody').append('<tr> <td> ' + dataJson.nome + '</td> <td> ' + dataJson.hora + ' </td> <td> ' + dataJson.local + ' </td> <td> ' + dataJson.encontro + ' </td> <td> ' + dataJson.boleia + ' </td> <td> ' + dataJson.data + ' </td> </tr>');
            });
        }

    });

}


$(function () {
    (function () {
        actualizaTabela();
        setTimeout(arguments.callee, 30000);
    })();
});

socket.on('confirmado', function () {
    actualizaTabela();
});
