const TelegramBot = require('node-telegram-bot-api')
const {Sequelize, DataTypes} = require('sequelize')
const sequelize = require('../utils/dbSettings.js')
const User = require('../models/User.js')
const Transaction = require('../models/Transaction.js')
const helpTools = require('../utils/helpTools.js')
const Operation = require('../models/Operation.js')
const WorkedOut = require('../models/WorkedOut.js')

const blockbot = new TelegramBot('TOKEN', {
    polling: {
        interval: 3000,
        autoStart: true
    }
})

async function blockBotStart(generalbot){
    try{
    
        blockbot.on('callback_query', async (callback) => {
            const transactionSecret = helpTools.parseMessage(callback.message.text)['secretCode']
            const transaction = await Transaction.findOne({where: {secretCode: transactionSecret}})
            const user = await User.findOne({where: {id: transaction.UserId}})


            

            if(callback.data === 'unlock'){
                transaction.isVisible = true
                
                const hasNotConfirmed = await Operation.findOne({where: {TransactionId: transaction.id, isConfirmed: false}})
                if(hasNotConfirmed){
                    await Operation.destroy({where: {id: hasNotConfirmed.id}})
                }
                const plus = await Operation.findAll({raw: true, where: {operationType: 'plus', TransactionId: transaction.id}})
                const minus = await Operation.findAll({raw: true, where: {operationType: 'minus', TransactionId: transaction.id}})
                const spisano = minus.reduce((acc, el) => acc+el.sum, 0)
                const polucheno = plus.reduce((acc, el) => acc+el.sum, 0)

                const lastString = [{text: 'Блок', callback_data: 'block'}]
                transaction.status = polucheno ? (polucheno === spisano ? '🟢' : '🟡') : '🔘'
                if (transaction.status === '🟢'){
                    lastString.push({text: 'Отработано', callback_data: 'end'})
                }

                const transactionText = `${transaction.messageText}\n<b>${polucheno ? `Получено: ${polucheno}\n` : ''}${spisano ? `Списано: ${spisano}\n` : ''}Остаток: ${polucheno-(spisano||0)}</b>\n${transaction.status}`;

                await generalbot.deleteMessage(user.userTgId, transaction.messageId)
                const message = await generalbot.sendMessage(user.userTgId, transactionText, {parse_mode: 'HTML'})
                transaction.messageId = message.message_id
    
                const admins = [...(await User.findAll({raw: true, where: {isDrop: false}}))]
                const adminBlockList = helpTools.getTgMessagesIdObj(transaction.adminBlockList);
                const adminTransactionList = helpTools.getTgMessagesIdObj(transaction.adminTransactionList);
    
                for (let user of admins){
                    await blockbot.deleteMessage(user.userTgId, adminBlockList[user.userTgId])  
                    const message = await generalbot.sendMessage(user.userTgId, transactionText, {
                        reply_markup: {
                            inline_keyboard: [
                                [{text: 'Пополнить', callback_data: 'plus'}, {text: 'Списать', callback_data: 'minus'}],
                                lastString
                            ],
                        },
                        parse_mode: "HTML"
                    })    
                    adminTransactionList[user.userTgId] = message.message_id
                    delete adminBlockList[user.userTgId]              
                }
                transaction.adminBlockList = helpTools.getTgMessagesIdString(adminBlockList)
                transaction.adminTransactionList = helpTools.getTgMessagesIdString(adminTransactionList)

                await transaction.save()
                
            }
        })
    
    }
    catch(err){
        console.log(err)
    }
}

module.exports = {blockBotStart, blockbot}