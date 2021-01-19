const request = require("request-promise");
const NodeCache = require("node-cache");
const cache = new NodeCache();

module.exports = class Waze {
    constructor(bottom, left, right, top, group_id) {
        this.bottom = bottom;
        this.left = left;
        this.right = right;
        this.top = top;
        this.group_id = group_id;
        this.avisos = [];
    }

    async parse_avisos() {
        var options = {
            method: 'GET',
            url: 'https://www.waze.com/row-rtserver/web/TGeoRSS',
            qs:
            {
                bottom: this.bottom,
                left: this.left,
                ma: '200',
                mj: '100',
                mu: '20',
                right: this.right,
                top: this.top,
                types: 'alerts'
            },
            headers:
            {
                Connection: 'keep-alive',
                Host: 'www.waze.com',
                Accept: '*/*',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                Referer: 'https://www.waze.com/es/livemap',
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36'
            }
        };

        var body = await request(options);
        this.avisos = await JSON.parse(body).alerts;
        this.avisos = await this.avisos.sort((a, b) => a.pubMillis - b.pubMillis);
    }

    async send_avisos(bot) {
        console.log('[i] Obteniendo avisos de Waze'.yellow);
        await this.parse_avisos();

        this.avisos.forEach(aviso => {
            if (!cache.has(aviso.uuid)) {
                if (!cache.set(aviso.uuid, {}, 604800)) {
                    console.log('[!] Error al insertar aviso en caché'.red);
                    console.log(err);
                } else {
                    console.log('[+] Aviso '.green + aviso.uuid + ' agregado en caché'.green);
                    // construimos mensaje
                    this.mandar_aviso(bot, aviso);
                }
            }
        });
    }

    async mandar_aviso(bot, aviso) {
        if (aviso.type == 'ROAD_CLOSED' || aviso.type == 'CONSTRUCTION' || aviso.type == 'HAZARD_ON_ROAD_CONSTRUCTION') {
            return;
        } else {
            var header = await this.get_header(aviso.type, aviso.subtype);
            if (aviso.nearBy) {
                var body = '\n\n📍 ' + aviso.street + ', cerca de ' + aviso.nearBy + '\n';
            } else {
                var body = '\n\n📍 ' + aviso.street + ', en ' + aviso.city + '\n';
            }
            if (aviso.reportBy) {
                var reportBy = '👤 ' + aviso.reportBy;
            } else {
                var reportBy = '👤 Anónimo';
            }

            var mensaje = header + body + reportBy + '\n\n';
            bot.telegram.sendMessage(
                this.group_id,
                mensaje + '```\n' + new Date(aviso.pubMillis).toLocaleString() + '```',
                {
                    parse_mode: "Markdown",
                    reply_markup: {
                        inline_keyboard: [[{ text: "📍 Localización", url: "https://www.google.com/maps/place/" + aviso.location.y + "," + aviso.location.x }]]
                    }
                }
            );
        }
    }

    async get_header(tipo, subtipo) {
        tipo = tipo.toLowerCase();
        subtipo = subtipo.toLowerCase();
        switch (tipo) {
            case 'accident':
                switch (subtipo) {
                    case 'accident_major':
                        return "⚠ *Accidente Grave* ⚠";
                    case 'accident_minor':
                        return "⚠ *Accidente Leve* ⚠";
                    default:
                        return "⚠ *Accidente* ⚠";
                }

            case 'chit_chat':
                return "❓ *Conversación* ❓";
            case 'construction':
                return "🚧 *Obras* 🚧";
            case 'hazard':
                switch (subtipo) {
                    case 'hazard_on_road':
                        return "⚠ *Peligro en la Vía* ⚠";
                    case 'hazard_on_road_car_stopped':
                        return "⚠ *Automóvil detenido sobre el camino* ⚠";
                    case 'hazard_on_road_construction':
                        return "🚧 *Obras en la Vía* 🚧";
                    case 'hazard_on_road_ice':
                        return "❄ *Hielo Formado Recientemente* ❄";
                    case 'hazard_on_road_lane_closed':
                        return "🚫 *Carril Cerrado* 🚫";
                    case 'hazard_on_road_object':
                        return "⚠ *Peligro en la Vía* ⚠";
                    case 'hazard_on_road_oil':
                        return "⚠ *Derrame de Combustible o Aceite* ⚠";
                    case 'hazard_on_road_pot_hole':
                        return "⚠ *Bache* ⚠";
                    case 'hazard_on_road_road_kill':
                        return "🐶 *Peligro Animal Muerto* 🐶";
                    case 'hazard_on_shoulder':
                        return "⚠ *Peligro en el lado de la vía* ⚠";
                    case 'hazard_on_shoulder_animals':
                        return "🐶 *Animales a un lado de la Vía* 🐶";
                    case 'hazard_on_shoulder_car_stopped':
                        return "🚗 *Vehículo detenido a un lado de la vía* 🚗";
                    case 'hazard_on_shoulder_missing_sign':
                        return "⚠ *Falta Señal* ⚠";
                    case 'hazard_weather':
                        return "⚠ *Peligro Meteorológico* ⚠";
                    case 'hazard_weather_flood':
                        return "💧 *Inundación* 💧";
                    case 'hazard_weather_fog':
                        return "🌫 *Niebla* 🌫";
                    case ' hazard_weather_freezing_rain':
                        return "❄ *Nieve* ❄";
                    case 'hazard_weather_hail':
                        return "❄ *Granizo* ❄";
                    case 'hazard_weather_heat_wave':
                        return "🔥 *Ola de calor* 🔥";
                    case 'hazard_weather_heavy_rain':
                        return "⛈ *Lluvia Intensa* ⛈";
                    case 'hazard_weather_heavy_snow':
                        return "❄ *Nieve Intensa* ❄";
                    default:
                        return "⚠ *Peligro Vial* ⚠";
                }

            case 'jam':
                switch (subtipo) {
                    case 'jam_heavy_traffic':
                        return "🛑 *Embotellamiento Grave* 🛑";
                    case 'jam_light_traffic':
                        return "🛑 *Embotellamiento Ligero* 🛑";
                    case 'jam_heavy_traffic':
                        return "🛑 *Embotellamiento Moderado* 🛑";
                    case 'jam_heavy_traffic':
                        return "🛑 *Embotellamiento Total* 🛑";
                    default:
                        return "🛑 *Embotellamiento* 🛑";
                }

            case 'misc':
                return "❓ *Desconocido* ❓";
            case 'other':
                return "❓ *Otro* ❓";
            case 'police':
                switch (subtipo) {
                    case 'police_hiding':
                        return "👮 *Control Policial Visible* 👮";
                    case 'police_hiding':
                        return "👮 *Control Policial Oculto* 👮";
                    default:
                        return "👮 *Control Policial* 👮";
                }
            case 'road_closed':
                return "⛔ *Vía cerrada* ⛔";
            default:
                return "❓ *Desconocido* ❓";
        }
    }
}