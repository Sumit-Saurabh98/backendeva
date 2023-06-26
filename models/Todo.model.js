const mongoose = require('mongoose');

const todoSchema = mongoose.Schema({
 taskname: {type: String, required: true},
 status: {type: String, enum:["pending", "done"], default: "pending"},
 tag: {type: String, enum:["personal", "official", "family"], default: "personal"},
 user: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true}
})

const Todo = mongoose.model("Todo", todoSchema)

module.exports =Todo