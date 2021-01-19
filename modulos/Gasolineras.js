const rp = require('request-promise');

module.exports = class Gasolineras {

    constructor(kms, ciudad, veces) {
        this.kms = kms;
        this.ciudad = ciudad;
        this.veces = veces;
    }

    async getPrecios() {
        try {
            var res = await rp('https://www.benzinpreis-blitz.de/app/v5/s/?api_key=hORQGNHd3WOt0d1H&e=' + this.kms + '&s=' + this.ciudad + '&c=es&l=es&so=2&alt=1&npa=-1&np=1%0A');
            return await JSON.parse(res).a;
        } catch (err) {
            console.log(err);
        }
    }

    async get_top() {
        console.log('[i] Obteniendo precios de gasolineras'.yellow);
        var data = await this.getPrecios();
        var gasolineras = [];
        for (var i = 0; i < data.length; i++) {
            var nombre = await data[i].ti.replace(/- aktuelle Spritpreise|- Spritpreise|\([A-Z]*?\)|[0-9]{5}/gi, '');
            try {
                for (var g = 0; g < data[i].pr.length; g++) {
                    if (data[i].pr[g].s == 2) {
                        var diesel = data[i].pr[g].p;
                    } else if (data[i].pr[g].s == 11) {
                        var gasolina = data[i].pr[g].p;
                    }
                }
                var gas_info = {
                    nombre: nombre,
                    gasolina: gasolina,
                    diesel: diesel
                };
                gasolineras.push(gas_info);
            } catch (err) {
                console.log(err);
            }
        }

        gasolineras.sort((a, b) => {
            return parseFloat(a.diesel) - parseFloat(b.diesel);
        });

        gasolineras.length = this.veces;
        var texto = "*🏆 TOP " + this.veces + " GASOLINERAS 🏆*\n➖➖➖➖➖➖➖➖\n";
        for (i = 0; i < gasolineras.length; i++) {
            texto += "⛽ " + gasolineras[i].nombre + "\n🔹 Diesel " + gasolineras[i].diesel + "€\n🔸 Gasolina " + gasolineras[i].gasolina + "€ \n\n";
        }
        return texto.toString();
    }
}