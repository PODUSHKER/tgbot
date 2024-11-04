const {Sequelize, DataTypes} = require('sequelize')
const path = require('path')
const Operation = require('./Operation.js')
const User = require('./User.js')
const sequelize = require('../utils/dbSettings.js')
const WorkedOut = require('./WorkedOut.js')


const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    messageId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    secretCode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    messageText: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isVisible: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: '🔘'
    },
    adminTransactionList: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    adminBlockList: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    adminWorkedOutList: {
        type: DataTypes.STRING,
        defaultValue: ''
    }
    

})
Transaction.hasMany(WorkedOut)
Transaction.hasMany(Operation)

module.exports = Transaction