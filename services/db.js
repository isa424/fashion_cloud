const data_schema = require('../schemas/data_schema');
const mongoose = require("mongoose");

const connectionFactory = () => {
	const conn = mongoose.createConnection(process.env.MONGO_URI);

	conn.model('Data', data_schema);

	return conn;
};

const findByKey = (conn) => {
	return async (req, res, next) => {
		const key = req.params.key;

		const result = await conn.models.Data.findOne({
			key,
		}).exec();

		console.log('DEBUG 1', result);

		res.json(result);
	}
};

const findAll = (conn) => {
	return async (req, res, next) => {
		const result =  await conn.models.Data.find().exec();

		res.json(result);
	};
}

module.exports = {
	findByKey, findAll, connectionFactory,
};
