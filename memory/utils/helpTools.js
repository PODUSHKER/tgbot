
exports.stringToArray = (string) => {
    return string.split(';')
}


exports.arrayToString = (array) => {
    return array.join(';')
}


exports.parseMessage = (msgText) => {
    const regText = `;${msgText.split(/\n\s?/).join(';')};`

    let secretCode = regText.match(/;UA\d+?;/)[0].slice(1, -1)
    let phone = regText.match(/;\+?\d+?;/)[0].slice(1, -1)
    let username = regText.match(/;@[a-zA-Z0-9\_]+?;/)[0].slice(2, -1)
    let bankName = regText.match(/;[a-zA-Zа-яА-Я\s]+;/)[0].slice(1, -1)

    return {secretCode, phone, username, bankName}
}

exports.isTransaction = (msgText) => {
    const msgStrokes = msgText.split(/\n\s?/)
    if (msgStrokes.length === 4){
        const regText = `;${msgText.split(/\n\s?/).join(';')};`

        let secretCode = regText.match(/;UA\d+?;/)
        let phone = regText.match(/;\+?\d+?;/)
        let username = regText.match(/;@[a-zA-Z0-9\_]+?;/)
        let bankName = regText.match(/;[a-zA-Zа-яА-Я\s]+;/)

        const isSuccessfulData = [secretCode, phone, username, bankName].every(el => !!el)
        return isSuccessfulData
    }
    return false
}

