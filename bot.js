const colors = require('colors');
const Telegraf = require('telegraf');
const session = require('telegraf/session');

const Gasolineras = require('./modulos/Gasolineras');
const Socialdrive = require('./modulos/Socialdrive');
const Waze = require('./modulos/Waze');

const BOT_TOKEN = "TOKEN_HERE";
const bot = new Telegraf(BOT_TOKEN);

// Register session middleware
bot.use(session());

// Register logger middleware
bot.use((ctx, next) => {
    const start = new Date()
    return next().then(() => {
        const ms = new Date() - start
            //console.log('response %sms', ms)
    })
});

// Launch bot
bot.launch();

// CRONJOBS //
var minutes = 1,
    the_interval = minutes * 60 * 1000;
setInterval(async function() {
    // SocialDrive
    const social_drive = new Socialdrive('7275369', '0,75', '-1001201171538');
    await social_drive.send_avisos(bot);
    // Waze
    const waze = new Waze('36.647375', '-3.036617', '-1.835332', '37.007244', '-1001201171538');
    await waze.send_avisos(bot);
}, the_interval);

// COMANDOS //
bot.hears(/!help/, (ctx) => {
    ctx.telegram.deleteMessage(ctx.message.chat.id, ctx.message.message_id);
    return ctx.replyWithMarkdown(
        '``` !gas``` _mostrar gasolineras más baratas_\n\n' +
        '``` !help``` _mostrar comandos disponibles_\n\n'
    );
});

bot.hears(/!gas/, async(ctx) => {
    borrar_comando(ctx);
    if (ctx.message.from.username == 'yourusername') {
        const gasolineras = new Gasolineras(20, 'Almeria', 10);
        return ctx.replyWithMarkdown(await gasolineras.get_top());
    }
});

bot.hears(/!test/, async(ctx) => {
    borrar_comando(ctx);
    if (ctx.message.from.username == 'yourusername') {
        const social_drive = new Socialdrive('7275369', '0,75', '-1001201171538');
        await social_drive.send_avisos(bot);
        // Waze
        const waze = new Waze('36.647375', '-3.036617', '-1.835332', '37.007244', '-1001201171538');
        await waze.send_avisos(bot);
    }
});

// FUNCIONES MISC
function borrar_comando(ctx) {
    try {
        ctx.telegram.deleteMessage(ctx.message.chat.id, ctx.message.message_id);
    } catch (e) {
        console.log('[!] Error al borrar mensaje'.red)
    }
}