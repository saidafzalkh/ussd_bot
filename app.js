require('dotenv').config()
const Telegram = require('node-telegram-bot-api')
const db = require('./db.json')
const token = process.env.BOT_TOKEN
const bot = new Telegram(token, {polling: true})
const conf = require('./config.json')
const text = require('./text.json')

bot.onText(/\/start/, start)

bot.on("message", (msg)=>{
    let chatID = msg.chat.id
    let message = msg.text
    if (message === text.home) goToHome(chatID)
    if (db.mobile_operators.includes(message)) openServices(msg)
    if (message.includes(db.services.uz[0])) openPackages(message, chatID)
    if (message.includes(db.services.uz[1])) openUSSD(message, chatID)
    if (message.includes(db.services.uz[2])) openRate(message, chatID)
    if (message.includes(db.services.uz[3])) openMicroServices(msg)
    if (message.includes(db.micro_services.uz[0])) openSMSpackages(message, chatID)

})

bot.on("callback_query", (query)=>{
    const operator = query.data.split("_")[0]
    const data = query.data.split("_")[1]
    const operation = query.data.split("_")[2]
    const id = query.id
    let infoText = "Texnik nosozlik"

    if (operation === "traffic"){
        const a = db.internet_packages[operator]
        const t = a.filter(e => e.name === data)[0]
        const ref = conf[operator] === null ? '' : '*'+conf[operator]
        const hash = operator === "Perfectum" || operator === "Humans" ? '' : '#'
        infoText = `
        ${t.name}

        💲 Narxi: ${t.price} so'm
        📈 Traffik miqdori: ${t.current_traffic} 
        🕔 Amal qilish muddati: ${t.period}
        ${operator === "Humans" ? "🖇 Batafsil: humans.uz" : `🔢 USSD kod: ${t.ussd_code+ref+hash}`}
    `   
    }

    if (operation === "rate"){
        const a = db.rate[operator]
        const t = a.filter(e => e.name === data)[0]
        console.log(t)
        infoText = `
        ${t.name}

        💲 ${t.price} so'm/oy
        🌐 ${t.traffic}/oy
        🌒 ${t.traffic}/oy (tungi)
        📞 ${t.min} daqiqa/oy
        ✉️ ${t.sms} SMS/oy
        🔢 Ulanish kodi: ${t.ussd}
    `   
    console.log(infoText)
    }
    bot.answerCallbackQuery(id, {text : infoText, show_alert : true})
})

function openMicroServices(msg){
    const chatID = msg.chat.id
    const message = msg.text
    const menu = splitArray(
        db.micro_services.uz.map(e => message + " " + e), 
        2,
        text.home)
    bot.sendMessage(chatID, text.services_text, createOptions(menu))
}

// Bot Sending on Start
function start(msg) {
    const chatID = msg.chat.id
    bot.sendMessage(chatID, text.start_message, mainMenu())
}

// Create Message Options
function createOptions(keyboard, parse_mode = "HTML") {
    return { parse_mode: parse_mode, reply_markup: JSON.stringify({keyboard: keyboard}) }
}

// Main menu Buttons
function mainMenu() {
    const menu = splitArray(db.mobile_operators, 2)
    return createOptions(menu)
}

// Go to main menu
function goToHome(chatID) {
    bot.sendMessage(chatID, text.home_text, mainMenu())
}

function openServices(msg) {
    const chatID = msg.chat.id
    const message = msg.text
    const menu = splitArray(
        db.services.uz.map(e => message + " " + e), 
        2,
        text.home)
    bot.sendMessage(chatID, text.services_text, createOptions(menu))
}

function openPackages(message, chatID) {
    const option = message.split(" ")[0]
    const menu = splitArray(db.internet_packages[option].map(
        e => { return {text: e.name, callback_data: option + "_" + e.name + "_" + "traffic"}}
    ), 3)
    bot.sendMessage(chatID, option + " " + "Internet Paketlari", {
        reply_markup: {inline_keyboard: menu}
    })
}

function openSMSpackages(message, chatID) {
    const option = message.split(" ")[0]
    const menu = splitArray(db.internet_packages[option].map(
        e => { return {text: e.name, callback_data: option + "_" + e.name + "_" + "sms"}}
    ), 3)
    bot.sendMessage(chatID, option + " " + "Internet Paketlari", {
        reply_markup: {inline_keyboard: menu}
    })
}

function openRate(message, chatID) {
    const option = message.split(" ")[0]
    const menu = splitArray(db.rate[option].map(
        e => { return {text: e.name, callback_data: option + "_" + e.name + "_" + "rate"}}
    ), 1)
    bot.sendMessage(chatID, option + " " + "Tarif rejalari", {
        reply_markup: {inline_keyboard: menu}
    })
}


function openUSSD(message, chatID) {
    const option = message.split(" ")[0]
    customMarkUp(db.ussd_codes[option])
    bot.sendMessage(chatID, customMarkUp(db.ussd_codes[option]), {parse_mode: "HTML"})
}

function customMarkUp(text){
    let arr = text.split(/\r?\n/)
    arr = arr.map(e => e.replaceAll(/\s/g, ' '))
    arr = arr.map(e => e.split("-"))
    arr = arr.map(e => `<code>${e[0]}</code> - ${e[1]}`)
    return arr.sort((a, b) => a.length - b.length).join('\r\n')
}


// Split Array
function splitArray(arr, len, add = null) {
    var chunks = [], i = 0, n = arr.length;
    while (i < n) {
        chunks.push(arr.slice(i, i += len));
    }
    if (add !== null) chunks.push([add])
    return chunks;
}