const mongoose = require('mongoose');
const data_schema = require('../schemas/data_schema');

const DataModel = mongoose.model('Data', data_schema);

module.exports = DataModel;
