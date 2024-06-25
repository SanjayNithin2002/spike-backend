const {Schema, SchemaTypes, model} = require("mongoose");
const getIST = require('../middlewares/getIST');

const spikeSchema = new Schema({
    _id: SchemaTypes.ObjectId,
    userId: {
        type: SchemaTypes.ObjectId,
        ref: 'Users',
        required: true
    },
    metric: SchemaTypes.Mixed,
    punishment: SchemaTypes.Mixed, 
    createdAt: {
        type: String, 
        default: getIST()
    }
});

module.exports = model("Spikes", spikeSchema);