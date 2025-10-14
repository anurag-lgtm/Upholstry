const express =require("express")
const { migrationController } = require("../Controller/migrationController")

const migrationRouter=express.Router()
migrationRouter.get('/triggerMigration',migrationController)

module.exports=migrationRouter