const data_schema = require('../schemas/data_schema');
const mongoose = require("mongoose");
const randomstring = require("randomstring");

const connectionFactory = () => {
	const conn = mongoose.createConnection(process.env.MONGO_URI);

	conn.model('Data', data_schema);

	return conn;
};

const findByKey = (conn) => {
	return async (req, res) => {
		const key = req.params.key;

		let result = await conn.models.Data.findOne({
			key,
		}).exec();

		// If exists return and stop
		if (result) {
			console.log('Cache hit for key: ' + key + ' with value: ' + result.value);
			res.json(result);
			return;
		}

		console.log('Cache miss for key: ' + key);

		result = await conn.models.Data.create({
			key: key,
			value: randomstring.generate(10),
		});

		res.json(result);
	}
};

const findAll = (conn) => {
	return async (req, res) => {
		const result = await conn.models.Data.find().exec();

		res.json(result);
	};
};

const createOrUpdate = (conn) => {
	return async (req, res) => {
		const key = req.params.key;
		const body = {key, ...req.body};

		if (!key || !body.value) {
			res.status(400);
			res.json({message: "invalid request"});
			return;
		}

		// Update or create
		const result = await conn.models.Data.updateOne({key}, body, {upsert: true}).exec();

		res.json(result);
	};
};

module.exports = {
	findByKey, findAll, createOrUpdate, connectionFactory,
};
