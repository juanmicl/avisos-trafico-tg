const request = require("request-promise");
const NodeCache = require( "node-cache" );
const cache = new NodeCache();

module.exports = class Socialdrive {
    constructor(uid, comarcas, group_id) {
        this.uid = uid;
        this.comarcas = comarcas;
        this.group_id = group_id;
        this.avisos = [];
    }

    async parse_avisos() {

        var options = {
            method: 'POST',
            url: 'http://www.socialdrive.es/app/api.php',
            headers: {
                Host: 'www.socialdrive.es',
                'User-Agent': 'Dalvik/1.6.0 (Linux; U; Android 4.4.2; 6 Build/NRD90M)',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: {
                action: 'avisos',
                api: '22',
                so: '1',
                horas: '3',
                usuario: this.uid,
                comarcas: this.comarcas,
                vista: '0'
            }
        };

        var body = await request(options);
        this.avisos = await JSON.parse(body).avisos;
        this.avisos = await this.avisos.sort((a, b) => a.id - b.id);
    }

    async send_avisos(bot) {
        console.log('[i] Obteniendo avisos de SocialDrive'.yellow);
        await this.parse_avisos();

        this.avisos.forEach(aviso => {
            if (!cache.has(aviso.id)) {
                if (!cache.set(aviso.id, {}, 604800)) {
                    console.log('[!] Error al insertar aviso en caché'.red);
                } else {
                    console.log('[+] Aviso '.green + aviso.id + ' agregado en caché'.green);
                    this.mandar_aviso(bot, aviso);
                }
            }
        });
    }

    async mandar_aviso(bot, aviso) {
        var coordenadas = await aviso.coordenadas.replace(/\//, ',');
        bot.telegram.sendMessage(
            this.group_id,
            await this.get_header(aviso.subtipo) + '\n\n' + aviso.texto + '.\n\n```\n' + new Date(aviso.hora).toLocaleString() + '```', {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "📍 Localización", url: "https://www.google.com/maps/place/" + coordenadas }]
                    ]
                }
            }
        );
    }

    async get_header(subtipo) {
        switch (subtipo) {
            case '100':
                return "📸 *Radar* 📸";
            case '200':
                return "👮 *Control* 👮";
            case '301':
                return "🚗 *Retención* 🚗";
            case '302':
                return "⚠ *Accidente* ⚠";
            case '303':
                return "🐶 *Animal* 🐶";
            case '304':
                return "⁉ *Obstáculo* ⁉";
            case '306':
                return "🔧 *Averiado* 🔧";
            case '308':
                return "‼ *Incidentes* ‼";
            case '400':
                return "🚁 *Pegasus* 🚁";
            default:
                return "❓ *Desconocido* ❓";
        }
    }

}