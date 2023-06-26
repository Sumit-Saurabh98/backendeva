const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
 email: {type: String, required: true, unique: true},
 password: {type: String, required: true},
 ipAddress: {type: String, required: true}
})

const User = mongoose.model("users", userSchema)

module.exports = User