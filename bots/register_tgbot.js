const path = require('path')
const TelegramBot = require('node-telegram-bot-api')
const {Sequelize, DataTypes} = require('sequelize')
const sequelize = require('../utils/dbSettings.js')
const User = require('../models/User.js')


async function registerBotStart(){

    try{
        const bot = new TelegramBot('TOKEN', {
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
                userTgId: contact.contact.user_id
            }})
            console.log('useruseruseruseruseruseruseruseruseruseruseruseruseruseruseruseruserv ', user, contact.contact.user_id)
            let users = await User.findAll({})
            console.log(users)
            if (user){
                console.log(user)
                if (user.isAccept){
                    if(user.isDrop){
                        await bot.sendMessage(contact.chat.id, 'Ваш запрос одобрен!\nСсылка на бота - @General_cool_bot')
                    }
                    else{
                        await bot.sendMessage(contact.chat.id, `Вы назначены админом, вот необходимые боты:\n@General_cool_bot - Основной бот для работы\n@Block_cool_bot - Бот с заблокированными транзакциями\n@TransInfo_cool_bot - Бот со статистикой`)
                    }
                }
                else{
                    await bot.sendMessage(contact.chat.id, 'Вашу регистрацию ещё не одобрили')
                }
            }
            else{
                user = await new User({
                    userTgId: contact.contact.user_id.toFixed(0),
                    phone: contact.contact.phone_number,
                    firstName: contact.contact.first_name,
                }).save()
                const superAdmin = await User.findOne({where: {isSuperAdmin: true}})
                const registerRequest = `Запрос на регистрацию:\nИмя: ${user.firstName}\nНомер: ${user.phone}\nID: ${user.userTgId}`
                if (superAdmin){
                    await bot.sendMessage(superAdmin.userTgId, registerRequest, {
                        reply_markup: {
                            inline_keyboard: [
                                [{text: 'Админ', callback_data: 'adminreg'}],
                                [{text: 'Дроп', callback_data: 'dropreg'}],
                                [{text: 'Отклонить', callback_data: 'cancelreg'}],
                            ]
                        }
                    })
                }
                await bot.sendMessage(contact.chat.id, `Отправлен запрос на регистрацию:\nИмя: ${user.firstName}\nНомер: ${user.phone}\nID: ${user.userTgId}\nОжидайте получение разрешения!`)
            }
        })


        bot.on('callback_query', async (callback) => {
            const userTgId = callback.message.text.match(/ID: (\d+)/)[1]
            const user = await User.findOne({where: {userTgId: userTgId}})
            if (callback.data === 'dropreg'){
                user.isAccept = true
                await bot.sendMessage(userTgId, `Ваш запрос одобрен!\nСсылка на бота - @General_cool_bot`)
            }
            if (callback.data === 'adminreg'){
                user.isAccept = true
                user.isDrop = false
                await bot.sendMessage(userTgId, `Вы назначены админом, вот необходимые боты:\n@General_cool_bot - Основной бот для работы\n@Block_cool_bot - Бот с заблокированными транзакциями\n@TransInfo_cool_bot - Бот со статистикой`)
            }
            await user.save()

            if (callback.data === 'cancelreg'){
                await User.destroy({where: {userTgId: userTgId}})
                await bot.sendMessage(userTgId, `Запрос на регистрацию отклонён!`)
            }
            await bot.deleteMessage(callback.from.id, callback.message.message_id)
        })
    }
    catch(err){
        console.log(err)
    }
}

module.exports = registerBotStart