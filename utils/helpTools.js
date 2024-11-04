

exports.parseMessage = (messageText) => {
    let secretCode = messageText.match(/UA[\s\d]+/i)[0].replace(/\s/g, '').trim().toUpperCase()
    return {secretCode, messageText}
}

exports.isTransaction = (msgText) => {
    return msgText.match(/UA[\s\d]+/i)
}

exports.getTgMessagesIdObj = (messagesId) => {
    const obj = {}
    messagesId.split(';').forEach((el) => {
        const keyValue = el.split(':')
        obj[keyValue[0]] = keyValue[1]
    })
    return messagesId ? obj : {};
} 

exports.getTgMessagesIdString = (obj) => {
    const formatedIds = []    
    Object.keys(obj).forEach((key) => {
        formatedIds.push(`${key}:${obj[key]}`)
    })
    return formatedIds.join(';')
}