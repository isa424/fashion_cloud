const mongoose = require('mongoose');

const data_schema = new mongoose.Schema({
	key: String,
	value: String,
}, {
	timestamps: true,
});

module.exports = data_schema;
