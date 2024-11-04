const {Sequelize, DataTypes} = require('sequelize')
const path = require('path')
const sequelize = require('../utils/dbSettings.js')
const Transaction = require('./Transaction.js')
const Operation = require('./Operation.js')
const WorkedOut = require('./WorkedOut.js')

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    userTgId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isAccept: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isDrop: {
        type: DataTypes.INTEGER,
        defaultValue: true
    },
    isSuperAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
})

User.hasMany(Operation)
User.hasMany(Transaction)
User.hasMany(WorkedOut)

module.exports = User;