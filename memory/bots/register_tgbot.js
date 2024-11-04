const path = require('path')
const TelegramBot = require('node-telegram-bot-api')
const {Sequelize, DataTypes} = require('sequelize')
const sequelize = require('../utils/dbSettings.js')
const User = require('../models/User.js')


async function registerBotStart(){

    try{
        const bot = new TelegramBot('7343292919:AAGGzkHO7t826rj4vjtcx7OReXocLV5_GIg', {
            polling: {
                interval: 3000,
                autoStart: true
            }
        })

        bot.on('text', async (msg) => {
            console.log(msg.from.first_name, msg.text)
            if (msg.text === '/start'){
                await bot.sendMessage(msg.chat.id, 'Добро пожаловать в бота для регистрации', {
                    reply_markup: {
                        keyboard: [
                            [{text: 'Старт', request_contact: true}]
                        ],
                        resize_keyboard: true
                    }
                })
            }
        })

        bot.on('contact', async (contact) => {
            let user = await User.findOne({ where: {
                userTgId: contact.contact.user_id,
                phone: contact.contact.phone_number
            }})
            if (user){
                console.log(user)
                if (user.isAccept){
                    await bot.sendMessage(contact.chat.id, '@General_cool_bot')
                }
                else{
                    await bot.sendMessage(contact.chat.id, 'Вашу регистрацию ещё не одобрили')
                }
            }
            else{
                user = await new User({
                    userTgId: contact.contact.user_id,
                    phone: contact.contact.phone_number,
                    firstName: contact.contact.first_name,
                }).save()
                await bot.sendMessage(contact.chat.id, `Отправлен запрос на регистрацию:\nИмя: ${user.firstName}\nНомер: ${user.phone}\nID: ${user.userTgId}`)
            }
        })
    }
    catch(err){
        console.log(err)
    }
}

module.exports = registerBotStart