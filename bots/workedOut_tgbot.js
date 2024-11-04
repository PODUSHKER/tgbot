const TelegramBot = require('node-telegram-bot-api')
const {Sequelize, DataTypes} = require('sequelize')
const sequelize = require('../utils/dbSettings.js')
const User = require('../models/User.js')
const Transaction = require('../models/Transaction.js')
const helpTools = require('../utils/helpTools.js')
const Operation = require('../models/Operation.js')
const WorkedOut = require('../models/WorkedOut.js')


const workedOutBot = new TelegramBot('TOKEN', {
    polling: {
        interval: 3000,
        autoStart: true
    }
})

const daySec = 86400000;
const hoursSec = 3600000;


const workedOutStart = (generalbot) => {
    try{
        workedOutBot.on('text', async (msg) => {
            if (msg.text === '/start'){
                await workedOutBot.sendMessage(msg.chat.id, 'Выберите промежуток необходимый промежуток времени', {
                    reply_markup: {
                        keyboard: [
                            ['День', 'Неделя', 'Месяц'],
                            ['Полгода', 'Год']
                        ],
                        resize_keyboard: true
                    }
                })
            }
            if (msg.text === 'День'){
                const timeToday = Math.floor(new Date().getTime() / hoursSec)
                const workedOuts = [...(await WorkedOut.findAll({}))].filter((obj) => {
                    const workedOutTime = Math.floor(obj.createdAt.getTime() / hoursSec)
                    return (timeToday - workedOutTime) <= 24;
                })
                if(workedOuts.length){
                    const cashIn = workedOuts.reduce((acc, el) => acc+=el.cashIn, 0)
                    const cashOut = workedOuts.reduce((acc, el) => acc+=el.cashOut, 0)
                    await workedOutBot.sendMessage(msg.chat.id, `Отработано за день\nПришло - ${cashIn}\nУшло - ${cashOut}`, {
                        reply_markup: {
                            keyboard: [
                                ['День', 'Неделя', 'Месяц'],
                                ['Полгода', 'Год']
                            ],
                            resize_keyboard: true
                        }
                    })
                }
                else{
                    await workedOutBot.sendMessage(msg.chat.id, 'Ничего не найдено')
                }
            }
            if (msg.text === 'Неделя'){
                const timeToday = Math.floor(new Date().getTime() / daySec)
                const workedOuts = [...(await WorkedOut.findAll({}))].filter((obj) => {
                    const workedOutTime = Math.floor(obj.createdAt.getTime() / daySec)
                    return timeToday - workedOutTime < 7;
                })
                if(workedOuts.length){
                    const cashIn = workedOuts.reduce((acc, el) => acc+=el.cashIn, 0)
                    const cashOut = workedOuts.reduce((acc, el) => acc+=el.cashOut, 0)
                    await workedOutBot.sendMessage(msg.chat.id, `Отработано за неделю\nПришло - ${cashIn}\nУшло - ${cashOut}`, {
                        reply_markup: {
                            keyboard: [
                                ['День', 'Неделя', 'Месяц'],
                                ['Полгода', 'Год']
                            ],
                            resize_keyboard: true
                        }
                    })
                }
                else{
                    await workedOutBot.sendMessage(msg.chat.id, 'Ничего не найдено')
                }
            }
            if (msg.text === 'Месяц'){
                const timeToday = Math.floor(new Date().getTime() / daySec)
                const workedOuts = [...(await WorkedOut.findAll({}))].filter((obj) => {
                    const workedOutTime = Math.floor(obj.createdAt.getTime() / daySec)
                    return timeToday - workedOutTime < 30;
                })
                if(workedOuts.length){
                    const cashIn = workedOuts.reduce((acc, el) => acc+=el.cashIn, 0)
                    const cashOut = workedOuts.reduce((acc, el) => acc+=el.cashOut, 0)
                    await workedOutBot.sendMessage(msg.chat.id, `Отработано за месяц\nПришло - ${cashIn}\nУшло - ${cashOut}`, {
                        reply_markup: {
                            keyboard: [
                                ['День', 'Неделя', 'Месяц'],
                                ['Полгода', 'Год']
                            ],
                            resize_keyboard: true
                        }
                    })
                }
                else{
                    await workedOutBot.sendMessage(msg.chat.id, 'Ничего не найдено')
                }
            }
            if (msg.text === 'Полгода'){
                const timeToday = Math.floor(new Date().getTime() / daySec)
                const workedOuts = [...(await WorkedOut.findAll({}))].filter((obj) => {
                    const workedOutTime = Math.floor(obj.createdAt.getTime() / daySec)
                    return timeToday - workedOutTime < 182;
                })
                if(workedOuts.length){
                    const cashIn = workedOuts.reduce((acc, el) => acc+=el.cashIn, 0)
                    const cashOut = workedOuts.reduce((acc, el) => acc+=el.cashOut, 0)
                    await workedOutBot.sendMessage(msg.chat.id, `Отработано за полгода\nПришло - ${cashIn}\nУшло - ${cashOut}`, {
                        reply_markup: {
                            keyboard: [
                                ['День', 'Неделя', 'Месяц'],
                                ['Полгода', 'Год']
                            ],
                            resize_keyboard: true
                        }
                    })
                }
                else{
                    await workedOutBot.sendMessage(msg.chat.id, 'Ничего не найдено')
                }
            }
            if (msg.text === 'Год'){
                const timeToday = Math.floor(new Date().getTime() / daySec)
                const workedOuts = [...(await WorkedOut.findAll({}))].filter((obj) => {
                    const workedOutTime = Math.floor(obj.createdAt.getTime() / daySec)
                    return timeToday - workedOutTime < 365;
                })
                if(workedOuts.length){
                    const cashIn = workedOuts.reduce((acc, el) => acc+=el.cashIn, 0)
                    const cashOut = workedOuts.reduce((acc, el) => acc+=el.cashOut, 0)
                    await workedOutBot.sendMessage(msg.chat.id, `Отработано за год\nПришло - ${cashIn}\nУшло - ${cashOut}`, {
                        reply_markup: {
                            keyboard: [
                                ['День', 'Неделя', 'Месяц'],
                                ['Полгода', 'Год']
                            ],
                            resize_keyboard: true
                        }
                    })
                }
                else{
                    await workedOutBot.sendMessage(msg.chat.id, 'Ничего не найдено')
                }
            }
            await workedOutBot.deleteMessage(msg.chat.id, msg.message_id)
        })
        workedOutBot.on('callback_query', async (callback) => {
            if (callback.data === 'workedIn'){
                const transactionSecret = helpTools.parseMessage(callback.message.text)['secretCode']
                const transaction = await Transaction.findOne({where: {secretCode: transactionSecret}})

                const admins = [...(await User.findAll({where: {isDrop: false}}))]
                const adminTransactionList = helpTools.getTgMessagesIdObj(transaction.adminTransactionList)
                const adminWorkedOutList = helpTools.getTgMessagesIdObj(transaction.adminWorkedOutList)

                const plus = await Operation.findAll({raw: true, where: {operationType: 'plus', TransactionId: transaction.id, isConfirmed: true}})
                const minus = await Operation.findAll({raw: true, where: {operationType: 'minus', TransactionId: transaction.id, isConfirmed: true}})
                const spisano = minus.reduce((acc, el) => acc+el.sum, 0)
                const polucheno = plus.reduce((acc, el) => acc+el.sum, 0)

                const transactionText = `${transaction.messageText}\n<b>${polucheno ? `Получено: ${polucheno}\n` : ''}${spisano ? `Списано: ${spisano}\n` : ''}Остаток: ${polucheno-(spisano||0)}</b>\n${transaction.status}`

                for (let admin of admins){

                    const message = await generalbot.sendMessage(admin.userTgId, transactionText, {
                        reply_markup: {
                            inline_keyboard: [
                                [{text: 'Пополнить', callback_data: 'plus'}, {text: 'Списать', callback_data: 'minus'}],
                                [{text: 'Блок', callback_data: 'block'}, {text: 'Отработано', callback_data: 'end'}]
                            ]
            
                        },
                        parse_mode: "HTML"
                    })
                    adminTransactionList[admin.userTgId] = message.message_id

                    await workedOutBot.deleteMessage(admin.userTgId, adminWorkedOutList[admin.userTgId])
                    delete adminWorkedOutList[admin.userTgId]
                }
                transaction.adminTransactionList = helpTools.getTgMessagesIdString(adminTransactionList)
                transaction.adminWorkedOutList = helpTools.getTgMessagesIdString(adminWorkedOutList)

                await transaction.save()
                await WorkedOut.destroy({where: {TransactionId: transaction.id}})

            }
        })
        workedOutBot.setMyCommands([{command: 'start', description:'Запускает бота'}])
    }
    catch(err){
        console.log(err)
    }
}

module.exports = {workedOutStart, workedOutBot}