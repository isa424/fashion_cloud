const mongoose = require('mongoose');

/**
 * updatedAt will be used for TTL
 */
const data_schema = new mongoose.Schema({
	key: String,
	value: String,
}, {
	timestamps: true,
});

module.exports = data_schema;
