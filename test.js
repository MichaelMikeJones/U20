var crypto = require("crypto");
var id = crypto.randomBytes(6).toString('hex');
crypto.randomFill(6)
console.log(id);