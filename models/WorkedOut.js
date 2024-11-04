const {Sequelize, DataTypes} = require('sequelize')
const sequelize = require('../utils/dbSettings.js')
const User = require('../models/User.js')
const Transaction =  require('../models/Transaction.js')

const WorkedOut = sequelize.define('WorkedOut', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    cashIn: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    cashOut: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    messageText: {
        type: DataTypes.STRING,
        allowNull: false
    },

})

module.exports = WorkedOut