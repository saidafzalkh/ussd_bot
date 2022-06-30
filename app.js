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
    if (message.includes(db.micro_services.uz[1])) openMinutes(message, chatID)
})

bot.on("callback_query", (query)=>{
    const operator = query.data.split("_")[0]
    const data = query.data.split("_")[1]
    const operation = query.data.split("_")[2]
    const id = query.id
    const chatID = query.message.chat.id
    let infoText = "Texnik nosozlik"

    if (operation === "traffic"){
        const a = db.internet_packages[operator]
        const t = a.filter(e => e.name === data)[0]
        const ref = conf[operator] === null ? '' : '*'+conf[operator]
        const hash = operator === "Perfectum" || operator === "Humans" ? '' : '#'
        infoText = `
        ${t.name}

        💲 Narxi: <b> ${t.price} so'm </b> \n
        📈 Traffik miqdori: <b> ${t.current_traffic} </b> \n
        🕔 Amal qilish muddati: <b> ${t.period} </b> \n
        ${operator === "Humans" ? "🖇 <a href='https://humans.uz/en/calculator/'> Batafsil </a> " : `🔢 USSD kod: <code> ${t.ussd_code+ref+hash} </code>`}
        \n\n
        `   
    }

    if (operation === "rate"){
        const a = db.rate[operator]
        const t = a.filter(e => e.name === data)[0]
        infoText = `
        ${t.name}

💲 ${t.price} so'm/oy \n
ℹ️  ${t.more} \n
🌐 ${t.traffic} \n
📞 ${t.min} daqiqa/oy \n
✉️ ${t.sms} SMS/oy \n
🔢 Ulanish kodi: <code> ${t.ussd} </code> 
    `   
    }
    if (operation === "sms"){
        const a = db.SMS[operator]
        const t = a.filter(e => e.name === data)[0]
        infoText = `
        ${t.name}
        
        💲 Narxi: <b> ${t.price}</b> \n
        🕔 Amal qilish muddati: <b> ${t.period} </b> \n
        ${operator === "Humans" ? "🖇 <a href='https://humans.uz/en/calculator/'> Batafsil </a> " : `🔢 USSD kod: <code> ${t.ussd} </code>`}
        \n\n
        `  
    }
    if (operation === "min"){
        const a = db.minutes[operator]
        const t = a.filter(e => e.name === data)[0]
        infoText = `
        ${t.name}
        
        💲 Narxi: <b> ${t.price}</b> \n
        🕔 Amal qilish muddati: <b> ${t.period} </b> \n
        ${operator === "Humans" ? "🖇 <a href='https://humans.uz/en/calculator/'> Batafsil </a> " : `🔢 USSD kod: <code> ${t.ussd} </code>`}
        \n\n
        `  
    }
    bot.answerCallbackQuery(id, {text : ""})
    bot.sendMessage(chatID, infoText, {parse_mode: "HTML"})
})

function openMicroServices(msg){
    const chatID = msg.chat.id
    const message = msg.text.split(" ")[0]
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
function createOptions(keyboard, parse_mode = "HTML", resize = true) {
    return { parse_mode: parse_mode, reply_markup: JSON.stringify({keyboard: keyboard, resize_keyboard: resize}) }
}

// Main menu Buttons
function mainMenu() {
    const menu = splitArray(db.mobile_operators, 2)
    return createOptions(menu, "HTML", false)
}

// Go to main menu
function goToHome(chatID) {
    bot.sendMessage(chatID, text.home_text, mainMenu())
}

function openServices(msg) {
    const chatID = msg.chat.id
    const message = msg.text.split(" ")[1]
    const menu = splitArray(
        db.services.uz.map(e => message + " " + e), 
        2,
        text.home)
    bot.sendMessage(chatID, text.services_text, createOptions(menu))
}

function openPackages(message, chatID) {
    let option
    switch (message.split(" ")[0]) {
        case "🟣":
            option = "Ucell"
            break;
        case "🐝":
            option = "Beeline"
            break;
        case "🇺🇿":
            option = "Uzmobile"
            break;
        case "🔻":
            option = "Mobiuz"
            break;
        case "🟠":
            option = "Perfectum"
            break;
        case "🟡":
            option = "Humans"
            break;
        default:
            break;
    }
    const menu = splitArray(db.internet_packages[option].map(
        e => { return {text: e.name, callback_data: option + "_" + e.name + "_" + "traffic"}}
    ), 3)
    bot.sendMessage(chatID, option + " " + "Internet Paketlari", {
        reply_markup: {inline_keyboard: menu}
    })
}

function openSMSpackages(message, chatID) {
    let option
    switch (message.split(" ")[0]) {
        case "🟣":
            option = "Ucell"
            break;
        case "🐝":
            option = "Beeline"
            break;
        case "🇺🇿":
            option = "Uzmobile"
            break;
        case "🔻":
            option = "Mobiuz"
            break;
        case "🟠":
            option = "Perfectum"
            break;
        case "🟡":
            option = "Humans"
            break;
        default:
            break;
    }
    if (option === "Humans"){
        bot.sendMessage(chatID, option + " " + "SMS to'plamlari", {
            reply_markup: {inline_keyboard: [[{text: "Konstruktor", url: "https://humans.uz/uz/calculator/"}]]}
        })
        return
    }
    const menu = splitArray(db.SMS[option].map(
        e => { return {text: e.name, callback_data: option + "_" + e.name + "_" + "sms"}}
    ), 2)
    bot.sendMessage(chatID, option + " " + "SMS to'plamlari", {
        reply_markup: {inline_keyboard: menu}
    })
}

function openMinutes(message, chatID) {
    let option
    switch (message.split(" ")[0]) {
        case "🟣":
            option = "Ucell"
            break;
        case "🐝":
            option = "Beeline"
            break;
        case "🇺🇿":
            option = "Uzmobile"
            break;
        case "🔻":
            option = "Mobiuz"
            break;
        case "🟠":
            option = "Perfectum"
            break;
        case "🟡":
            option = "Humans"
            break;
        default:
            break;
    }
    if (option === "Humans"){
        bot.sendMessage(chatID, option + " " + "Daqiqalari", {
            reply_markup: {inline_keyboard: [[{text: "Konstruktor", url: "https://humans.uz/uz/calculator/"}]]}
        })
        return
    }
    const menu = splitArray(db.minutes[option].map(
        e => { return {text: e.name, callback_data: option + "_" + e.name + "_" + "min"}}
    ), 2)
    bot.sendMessage(chatID, option + " " + "Daqiqalari", {
        reply_markup: {inline_keyboard: menu}
    })
}

function openRate(message, chatID) {
    let option
    switch (message.split(" ")[0]) {
        case "🟣":
            option = "Ucell"
            break;
        case "🐝":
            option = "Beeline"
            break;
        case "🇺🇿":
            option = "Uzmobile"
            break;
        case "🔻":
            option = "Mobiuz"
            break;
        case "🟠":
            option = "Perfectum"
            break;
        case "🟡":
            option = "Humans"
            break;
        default:
            break;
    }
    if (option === "Humans"){
        bot.sendMessage(chatID, option + " " + "Tarif rejalari", {
            reply_markup: {inline_keyboard: [[{text: "Konstruktor", url: "https://humans.uz/uz/calculator/"}]]}
        })
        return
    }
    const menu = splitArray(db.rate[option].map(
        e => { return {text: e.name, callback_data: option + "_" + e.name + "_" + "rate"}}
    ), 1)
    bot.sendMessage(chatID, option + " " + "Tarif rejalari", {
        reply_markup: {inline_keyboard: menu}
    })
}


function openUSSD(message, chatID) {
    let option
    switch (message.split(" ")[0]) {
        case "🟣":
            option = "Ucell"
            break;
        case "🐝":
            option = "Beeline"
            break;
        case "🇺🇿":
            option = "Uzmobile"
            break;
        case "🔻":
            option = "Mobiuz"
            break;
        case "🟠":
            option = "Perfectum"
            break;
        case "🟡":
            option = "Humans"
            break;
        default:
            break;
    }
    customMarkUp(db.ussd_codes[option])
    bot.sendMessage(chatID, "USSD kodlar royxati: \n\n" + customMarkUp(db.ussd_codes[option]), {parse_mode: "HTML"})
}

function customMarkUp(text){
    let arr = text.split(/\r?\n/)
    let i = 1
    arr = arr.map(e => e.replaceAll(/\s/g, ' '))
    arr = arr.map(e => e.split("-"))
    arr = arr.map(e => `<code>${e[0]}</code> - ${e[1]}\n`)
    arr = arr.sort((a, b) => a.length - b.length)
    return arr.map(e => `${i++}. ${e}`).join('\r\n')
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