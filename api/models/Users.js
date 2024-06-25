const {Schema, SchemaTypes, model} = require("mongoose");

const userSchema = new Schema({
    _id : SchemaTypes.ObjectId,
    name: {
        type: String,
        required: true
    },
    email : {
        type : String,
        required : true,
        unique : true,
        match : /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
    },
    password : {
        type : String,
        required : true
    },
    startTime: {
        type: String, 
        default: "08:00"
    }, 
    endTime: {
        type: String, 
        default: "20:00"
    }
});

module.exports = model("Users", userSchema);