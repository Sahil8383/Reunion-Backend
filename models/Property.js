const mongoose = require("mongoose");

const PropertySchema = mongoose.Schema({
    address: {
        type: String,
        required: true
    },
    price:{
        type: Number,
        required: true
    },
    location:{
        type: String,
        required: true
    },
    img:{
        type: String,
    },
    type:{
        type: String,
        required: true
    },
    date:{
        type: String,
    }
},{
    collection: 'reunion-task-properties'
});

const Property = mongoose.model('Property', PropertySchema);

module.exports = Property;