const path = require('path')
const TelegramBot = require('node-telegram-bot-api')
const {Sequelize, DataTypes} = require('sequelize')
const sequelize = require('./utils/dbSettings.js')
const User = require('./models/User.js')
const registerBotStart = require('./bots/register_tgbot.js')
const {generalBotStart, generalbot} = require('./bots/general_tgbot.js')
const {blockBotStart, blockbot} = require('./bots/block_tgbot.js')
const {workedOutStart, workedOutBot} = require('./bots/workedOut_tgbot.js')

async function main(){
    try{
        await sequelize.sync()
        registerBotStart()
        generalBotStart(blockbot, workedOutBot)
        blockBotStart(generalbot)
        workedOutStart(generalbot)
    }
    catch(err){
        console.log(err)
    }
}

main()

process.on('SIGINT', async () => {
    await sequelize.close()
    process.exit()
})

process.on('uncaughtException', async (err) => {
    console.log(err)
})