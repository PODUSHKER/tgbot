const TelegramBot = require('node-telegram-bot-api')
const {Sequelize, DataTypes, Op} = require('sequelize')
const sequelize = require('../utils/dbSettings.js')
const User = require('../models/User.js')
const Transaction = require('../models/Transaction.js')
const helpTools = require('../utils/helpTools.js')
const Operation = require('../models/Operation.js')
const WorkedOut = require('../models/WorkedOut.js')

const generalbot = new TelegramBot('TOKEN', {
    polling: {
        interval: 3000,
        autoStart: true
    }
})

async function transactionReply(msg, generalbot, user){
    try{
        let transactionData = helpTools.parseMessage(msg.text)
    if (transactionData){
        transactionData['messageText'] += `\n@${msg.from.username}`
        const hasId = await Transaction.findOne({ where: {secretCode: transactionData['secretCode']}})
        if (!hasId){
            let adminTransactionList = '';
            const admins = [...await User.findAll({ raw: true, where: {isDrop: false}} )]
            for (let user of admins) {
                const message = await generalbot.sendMessage(user.userTgId, `Транзакция:\n${transactionData['messageText']}\n🔘`, {
                    reply_markup: {
                        inline_keyboard: [
                            [{text: 'Пополнить', callback_data: 'plus'}, {text: 'Списать', callback_data: 'minus'}],
                            [{text: 'Блок', callback_data: 'block'}]
                        ]
                    }
                
                })
                let obj = helpTools.getTgMessagesIdObj(adminTransactionList) 
                if (!adminTransactionList){
                    obj = {}
                }
                obj[user.userTgId] = message.message_id;
                adminTransactionList = helpTools.getTgMessagesIdString(obj)
            }

            const message = await generalbot.sendMessage(msg.chat.id, `Транзакция:\n${transactionData['messageText']}\n🔘`)
            await new Transaction({...transactionData, messageId: message.message_id, UserId: user.id, adminTransactionList}).save()
            await user.save()
        }
        else {
            await generalbot.sendMessage(msg.chat.id, 'Такая транзакция уже существует!')
        }
    }
    }
    catch(err){
        console.log(err)
    }
}

async function editOperation(msg, generalbot, user, rawOperation, transaction){
    try{
        rawOperation.sum += Number(msg.text)
        rawOperation.isActive = false;

        const plus = await Operation.findAll({raw: true, where: {operationType: 'plus', TransactionId: transaction.id, isConfirmed: true}})
        const minus = await Operation.findAll({raw: true, where: {operationType: 'minus', TransactionId: transaction.id, isConfirmed: true}})
        const rspisano = minus.reduce((acc, el) => acc+el.sum, 0)
        const rpolucheno = plus.reduce((acc, el) => acc+el.sum, 0)

        const uslovie = rawOperation.operationType === 'minus' ? rspisano+rawOperation.sum <=rpolucheno : rspisano <= rpolucheno+rawOperation.sum

        if (uslovie){

            const notConfirmed = await Operation.findAll({where: {TransactionId: transaction.id, isConfirmed: false}})
            for (let operation of notConfirmed){
                console.log('im here', operation)
                await Operation.destroy({where: {id: operation.id}})

            }
            console.log(notConfirmed)
            

            const {sum, operationType, isActive, transactionMessageId, isConfirmed, UserId, TransactionId} = rawOperation
            const operation = await new Operation({sum, operationType, isActive, transactionMessageId, isConfirmed, UserId, TransactionId}).save()

            const spisano = minus.reduce((acc, el) => acc+el.sum, 0) + (operation.operationType === 'minus' ? operation.sum : 0)
            const polucheno = plus.reduce((acc, el) => acc+el.sum, 0) + (operation.operationType === 'plus' ? operation.sum : 0)

            console.log('first im here')
            transaction.status = operation.operationType === 'plus' ? '🔵' : '🟡'
            const lastString = [{text: 'Блок', callback_data: 'block'}]

            if (polucheno && spisano === polucheno){
                transaction.status = '🟢'
                lastString.push({text: 'Отработано', callback_data: 'end'})
            }
            const transactionText = `${transaction.messageText}\n<b>${polucheno ? `Получено: ${polucheno}\n` : ''}${spisano ? `Списано: ${spisano}\n` : ''}Остаток: ${polucheno-(spisano||0)}</b>\n${transaction.status}`
            const userDrop = await User.findOne({ where: {id: transaction.UserId} })
            await transaction.save()

            let message;
            await generalbot.deleteMessage(userDrop.userTgId, transaction.messageId)
            if (operation.operationType === 'plus' && transaction.status === '🔵'){
                message = await generalbot.sendMessage(userDrop.userTgId, transactionText, {parse_mode: "HTML", reply_markup:{
                    inline_keyboard: [
                            [{text: 'Подтвердить получение', callback_data: 'confirm'}]
                        ]
                }}) 
            }
            else{
                message = await generalbot.sendMessage(userDrop.userTgId, transactionText, {parse_mode: "HTML"})
            }
            
            transaction.messageId = message.message_id

            
            const admins = [...(await User.findAll({raw: true, where: {isDrop: false}}))]
            const adminTransactionList = helpTools.getTgMessagesIdObj(transaction.adminTransactionList);

            for (let user of admins){
                await generalbot.deleteMessage(user.userTgId, adminTransactionList[user.userTgId])

                const message = await generalbot.sendMessage(user.userTgId, transactionText, {
                    reply_markup: {
                        inline_keyboard: [
                            [{text: 'Пополнить', callback_data: 'plus'}, {text: 'Списать', callback_data: 'minus'}],
                            lastString
                        ]
        
                    },
                    parse_mode: "HTML"
                })
                operation.whoEditedUserId = msg.from.id
                operation.whoEditedTransactionMessageId = message.message_id
                await operation.save()
                
                
                adminTransactionList[user.userTgId] = message.message_id
            }
            transaction.adminTransactionList = helpTools.getTgMessagesIdString(adminTransactionList)
            await transaction.save()


            
        }
        else{
            await Operation.destroy({ where: {id: rawOperation.id}})
        }
    }
    catch(err){
        console.log(err)
    }
    
}

async function startHandler(msg, generalbot, user){
    try{
        await generalbot.sendMessage(msg.chat.id, 'Жду транзакцию')
    }
    catch(err){
        console.log(err)
    }
}


const generalBotStart = async (blockbot, workedOutBot) => {
    try {

        generalbot.on('text', async (msg) => {
            console.log(`\nПользователь - ${msg.from.username}\nСообщение: ${msg.text}\n\n`)
            const user = await User.findOne({where: {userTgId: msg.from.id, isAccept: true}})

            if (user){
                if (user.isDrop){

                    if (msg.text === '/start'){
                        startHandler(msg, generalbot, user)
                    }
                    else if (helpTools.isTransaction(msg.text)) {
                        transactionReply(msg, generalbot, user)
                    }
                }
                else{
                    const operation = await Operation.findOne({where: {isActive: true}})
                    if (msg.text === '/start'){
                        generalbot.sendMessage(msg.chat.id, 'Добро пожаловать в админ панель! Ожидайте транзакции!')
                    }
                    
                    else if(operation){
                        if(msg.text.replace(/[1-9][0-9]*/g, '') === ''){
                            const transaction = await Transaction.findOne({where: {id: operation.TransactionId}})
                            if (transaction.isVisible){
                                await editOperation(msg, generalbot, user, operation, transaction)
                            }
                        }
                        else{
                            await Operation.destroy({ where: {id: operation.id}})
                        }
                        await generalbot.deleteMessage(msg.chat.id, (Number(msg.message_id)-1).toString())
                    }
                }
                await generalbot.deleteMessage(msg.chat.id, msg.message_id)

            }
            else{
                await generalbot.sendMessage(msg.chat.id, 'Пошёл нахуй')
            }
    
        })
    
        generalbot.on('callback_query', async (callback) => {
            const transactionSecret = helpTools.parseMessage(callback.message.text)['secretCode']
            console.log('transactionSecret', transactionSecret)
            const transaction = await Transaction.findOne({where: {secretCode: transactionSecret}})
            console.log('transaction', transaction)
            const user = await User.findOne({where: {id: transaction.UserId}})
            console.log('user', user)
            if(callback.data === 'plus' || callback.data === 'minus'){
                const hasActiveOperation = await Operation.findOne({where: {UserId: user.id, isActive: true}})
                const isConfirmed = callback.data === 'minus'
                
                if (hasActiveOperation){
                    await Operation.destroy({where: {id: hasActiveOperation.id}})
                }

                await new Operation({operationType: callback.data, TransactionId: transaction.id, isActive: true, UserId: user.id, transactionMessageId: callback.message.message_id, isConfirmed}).save()
                await generalbot.sendMessage(callback.message.chat.id, 'Введите сумму')



            }
            
            if(callback.data === 'block'){
                transaction.isVisible = false
                transaction.status = '🚫'

                const plus = await Operation.findAll({raw: true, where: {operationType: 'plus', TransactionId: transaction.id}})
                const minus = await Operation.findAll({raw: true, where: {operationType: 'minus', TransactionId: transaction.id}})
                const spisano = minus.reduce((acc, el) => acc+el.sum, 0)
                const polucheno = plus.reduce((acc, el) => acc+el.sum, 0)

                const transactionText = `${transaction.messageText}\n<b>${polucheno ? `Получено: ${polucheno}\n` : ''}${spisano ? `Списано: ${spisano}\n` : ''}${polucheno ? `Остаток: ${polucheno-(spisano||0)}` : ''}</b>\n${transaction.status}`;

                await generalbot.deleteMessage(user.userTgId, transaction.messageId)
                const message = await generalbot.sendMessage(user.userTgId, transactionText, {parse_mode: "HTML"})
                transaction.messageId = message.message_id

                const admins = [...(await User.findAll({raw: true, where: {isDrop: false}}))]
                const adminBlockList = helpTools.getTgMessagesIdObj(transaction.adminBlockList);
                const adminTransactionList = helpTools.getTgMessagesIdObj(transaction.adminTransactionList);

                console.log('penisss', admins)

                for (let user of admins){
                    await generalbot.deleteMessage(user.userTgId, adminTransactionList[user.userTgId])  
                    const message = await blockbot.sendMessage(user.userTgId, transactionText, {
                        reply_markup: {
                            inline_keyboard: [
                                [{text: 'Разблокировать', callback_data: 'unlock'}]
                            ]
                        },
                        parse_mode: "HTML"
                    })   
                    adminBlockList[user.userTgId] = message.message_id          
                }
                transaction.adminBlockList = helpTools.getTgMessagesIdString(adminBlockList)
                await transaction.save()
            }
            if(callback.data === 'end'){
                const cashIn = [...(await Operation.findAll({where: {TransactionId: transaction.id, operationType: 'plus'}}))].reduce((acc, el) => acc+=el.sum, 0)
                const cashOut = [...(await Operation.findAll({where: {TransactionId: transaction.id, operationType: 'minus'}}))].reduce((acc, el) => acc+=el.sum, 0)
                const workedOut = await new WorkedOut({cashIn, cashOut, UserId: transaction.UserId, TransactionId: transaction.id, messageText: transaction.messageText}).save()
                const workedOutText = `${workedOut.messageText}\n<b>Получено: ${cashIn}\nСписано: ${cashOut}</b>`
                
                const admins = [...(await User.findAll({where: {isDrop: false}}))]
                const adminTransactionList = helpTools.getTgMessagesIdObj(transaction.adminTransactionList)
                const adminWorkedOutList = helpTools.getTgMessagesIdObj(transaction.adminWorkedOutList)
                for (let admin of admins){
                    await generalbot.deleteMessage(admin.userTgId, adminTransactionList[admin.userTgId])
                    delete adminTransactionList[admin.userTgId]
                    const message = await workedOutBot.sendMessage(admin.userTgId, workedOutText, {reply_markup: {
                        inline_keyboard: [
                            [{text: 'В работу', callback_data: 'workedIn'}]
                        ]
                    },
                    parse_mode: 'HTML'})
                    adminWorkedOutList[admin.userTgId] = message.message_id

                }
                transaction.adminTransactionList = helpTools.getTgMessagesIdString(adminTransactionList)
                transaction.adminWorkedOutList = helpTools.getTgMessagesIdString(adminWorkedOutList)
                await transaction.save()
                await generalbot.sendMessage(callback.from.id, 'Отработка сохранена\n@TransInfo_cool_bot')
            }
            
            if(callback.data === 'confirm'){
                const operation = await Operation.findOne({where: {TransactionId: transaction.id, UserId: user.id, isConfirmed: false}})
                transaction.status = '🟡'
                const messageText = callback.message.text.split('\n').slice(0, -1).join('\n').replace(/(Списано||Получено||Остаток):.+/g, (result) => `<b>${result}</b>`)+`\n${transaction.status}`
                const message = await generalbot.sendMessage(callback.message.chat.id, messageText, {parse_mode: "HTML"});
                await generalbot.deleteMessage(callback.message.chat.id, transaction.messageId);

                const adminTransactionList = helpTools.getTgMessagesIdObj(transaction.adminTransactionList);
                const admins = [...(await User.findAll({raw: true, where: {isDrop: false}}))]

                for (let user of admins){
                    const message = await generalbot.sendMessage(user.userTgId, messageText, {
                        reply_markup: {
                            inline_keyboard: [
                                [{text: 'Пополнить', callback_data: 'plus'}, {text: 'Списать', callback_data: 'minus'}],
                                [{text: 'Блок', callback_data: 'block'}]
                            ]
            
                        },
                        parse_mode: "HTML"
                    })
                    await generalbot.deleteMessage(user.userTgId, adminTransactionList[user.userTgId])
                    adminTransactionList[user.userTgId] = message.message_id
                }
                transaction.adminTransactionList = helpTools.getTgMessagesIdString(adminTransactionList)

                operation.isConfirmed = true;
                await operation.save()
                transaction.messageId = message.message_id
                
            }
            await transaction.save()
    })
        
        generalbot.setMyCommands([{command: 'start', description:'Запускает бота'}])

    }
    catch(err){
        console.log(err)
    }
    
}

module.exports = {generalBotStart, generalbot};