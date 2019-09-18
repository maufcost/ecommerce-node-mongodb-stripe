const mongoose = require("mongoose");
const bcrypt = require("bcrypt-nodejs");

var UserSchema = mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true }
});

// encryptPassword can be any name.
UserSchema.methods.encryptPassword = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(5), null);
};

// DO NOT use arrow function when using the '.this' keyword.
UserSchema.methods.isValidPassword = function(password) {
    // 'this.password', of course is the password of the user that this method
    // is applied to.
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model("User", UserSchema);
