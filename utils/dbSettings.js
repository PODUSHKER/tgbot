const {Sequelize, DataTypes} = require('sequelize')
const path = require('path')

const srcDirname = __dirname.replace(/[\/\\][a-zа-я0-9]+$/i, '');
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(srcDirname, 'transdb.db')
})

module.exports = sequelize