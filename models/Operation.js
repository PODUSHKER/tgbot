const {Sequelize, DataTypes} = require('sequelize')
const path = require('path')
const sequelize = require('../utils/dbSettings.js')
const Transaction = require('./Transaction.js')
const User = require('./User.js')


const Operation = sequelize.define('Operation', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },

    operationType: {
        type: DataTypes.STRING,
        allowNull: false
    },

    sum: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },

    isActive: {
        type: DataTypes.BOOLEAN,
        default: true
    },
    transactionMessageId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    isConfirmed: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },

})

module.exports = Operation