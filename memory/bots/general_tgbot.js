const TelegramBot = require('node-telegram-bot-api')
const {Sequelize, DataTypes} = require('sequelize')
const sequelize = require('../utils/dbSettings.js')
const User = require('../models/User.js')
const Transaction = require('../models/Transaction.js')
const helpTools = require('../utils/helpTools.js')
const Operation = require('../models/Operation.js')


async function transactionReply(msg, bot, user){
    const transactionData = helpTools.parseMessage(msg.text)
    if (transactionData){
        const hasId = await Transaction.findOne({ where: {secretCode: transactionData['secretCode']}})
        if (!hasId){
            const message = await bot.sendMessage(msg.chat.id, msg.text, {
                reply_markup: {
                    inline_keyboard: [
                        [{text: 'Пополнить', callback_data: 'plus'}, {text: 'Списать', callback_data: 'minus'}],
                        [{text: 'Бан', callback_data: 'ban'}]
                    ]
                }
            })
            
            const transaction = await new Transaction({...transactionData, messageId: message.message_id, UserId: user.id}).save()
            user.transactions = helpTools.arrayToString([...helpTools.stringToArray(user.transactions), transaction.id])
            await user.save()
        }
        else {
            await bot.sendMessage(msg.chat.id, 'Такая транзакция уже существует!')
        }
    }
}

async function editOperation(msg, bot, user, operation){
    console.log(operation)
    operation.sum = Number(msg.text)
    operation.isActive = false;
    const transaction = await Transaction.findOne({raw: true, where: {id: operation.TransactionId}})
    await operation.save()
    console.log(operation)

    const plus = await Operation.findAll({raw: true, where: {operationType: 'plus', TransactionId: transaction.id}})
    const minus = await Operation.findAll({raw: true, where: {operationType: 'minus', TransactionId: transaction.id}})
    console.log(plus)
    const transactionText = `Доменное имя: ${transaction.username}\nТелефон: ${transaction.phone}\nКод: ${transaction.secretCode}\nБанк: ${transaction.bankName}\n${plus.length ? `Получено: ${plus.reduce((acc, el) => console.log(acc)||acc+el.sum, 0)}\n` : ''}${minus.length ? `Списано: ${minus.reduce((acc, el) => acc+el.sum, 0)}\n` : ''}
    `

    await bot.editMessageText(transactionText, {
        chat_id: msg.chat.id,
        message_id: transaction.messageId,
        reply_markup: {
            inline_keyboard: [
                [{text: 'Пополнить', callback_data: 'plus'}, {text: 'Списать', callback_data: 'minus'}],
                [{text: 'Бан', callback_data: 'ban'}]
            ]
        }
    })
}

async function startHandler(msg, bot, user){
    await bot.sendMessage(msg.chat.id, 'Жду транзакцию')
}

const generalBotStart = async () => {
    try {
        const bot = new TelegramBot('7498302450:AAFWnYUTVx6dWryRxUobOOfSsLvW9Bc5Vf0', {
            polling: {
                interval: 3000,
                autoStart: true
            }
        })
    
        bot.on('text', async (msg) => {
            console.log(`Пользователь - ${msg.from.username}\nСообщение: ${msg.text}\n\n`)
            const user = await User.findOne({where: {userTgId: msg.from.id, isAccept: true}})

            if (user){
                const operation = await Operation.findOne({ where: {UserId: user.id, isActive: true}})
                console.log(operation)

                if (msg.text === '/start'){
                    startHandler(msg, bot, user)
                }
                
                else if(operation){
                    if(msg.text.replace(/[1-9][0-9]*/g, '') === ''){
                        const transaction = await Transaction.findOne({where: {id: operation.TransactionId}})
                        if (transaction.isVisible){
                            await editOperation(msg, bot, user, operation)
                        }
                    }
                    else{
                        await Operation.destroy({ where: {id: operation.id}})
                    }
                    await bot.deleteMessage(msg.chat.id, (Number(msg.message_id)-1).toString())
                }
                
                else if (helpTools.isTransaction(msg.text)) {
                    transactionReply(msg, bot, user)
                }
                await bot.deleteMessage(msg.chat.id, msg.message_id)
            }

            else{
                await bot.sendMessage(msg.chat.id, 'Пошёл нахуй')
            }
    
        })
    
    
        bot.on('callback_query', async (callback) => {
            const user = await User.findOne({where: {userTgId: callback.from.id, isAccept: true}})
            if (user){
                const transaction = await Transaction.findOne({ where: {messageId: callback.message.message_id}})
                if(callback.data === 'plus' || callback.data === 'minus'){
                    const operation = await new Operation({operationType: callback.data, TransactionId: transaction.id, isActive: true, UserId: user.id}).save()
                    transaction.operations = helpTools.arrayToString([...helpTools.stringToArray(transaction.operations), operation.id])
                    await bot.sendMessage(callback.message.chat.id, 'Введите сумму')
                }
                if(callback.data === 'ban'){
                    transaction.isVisible = false
                    await bot.deleteMessage(callback.message.chat.id, callback.message.message_id)
                }
                await transaction.save()
            }

    
        })
        
        bot.setMyCommands([{command: 'start', description:'Запускает бота'}])
    }
    catch(err){
        console.log(err)
    }
    
}

module.exports = generalBotStart;