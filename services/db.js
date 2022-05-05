const data_schema = require('../schemas/data_schema');
const mongoose = require("mongoose");
const randomstring = require("randomstring");

const connectionFactory = () => {
	const conn = mongoose.createConnection(process.env.MONGO_URI);

	conn.model('Data', data_schema);

	return conn;
};

/**
 * Return repository methods to abstract away mongo implementation
 * Certain methods require .exec() to return a promise
 * @param conn
 */
const getDataRepo = (conn) => {
	const model = {};

	model.findOne = async (params) => {
		return conn.models.Data.findOne(params).exec();
	};

	model.find = async (params) => {
		return conn.models.Data.find(params).exec();
	};

	model.create = conn.models.Data.create;

	model.updateOne = async (...params) => {
		return conn.models.Data.updateOne(...params).exec();
	};

	model.deleteOne = async (params) => {
		return conn.models.Data.deleteOne(params).exec();
	};

	return model;
};

const findByKey = (repo) => {
	return async (req, res) => {
		const key = req.params.key;

		if (!key) {
			res.status(400);
			res.json({message: "invalid request"});
			return;
		}

		let result = await repo.findOne({
			key,
		}).exec();

		// If exists return and stop
		if (result) {
			console.log('Cache hit for key: ' + key + ' with value: ' + result.value);
			res.json(result);
			return;
		}

		console.log('Cache miss for key: ' + key);

		result = await repo.create({
			key: key,
			value: randomstring.generate(10),
		});

		res.json(result);
	}
};

const findAll = (repo) => {
	return async (req, res) => {
		const result = await repo.find().exec();

		res.json(result);
	};
};

const createOrUpdate = (repo) => {
	return async (req, res) => {
		const key = req.params.key;
		const body = {key, ...req.body};

		if (!key || !body.value) {
			res.status(400);
			res.json({message: "invalid request"});
			return;
		}

		// Update or create
		const result = await repo.updateOne({key}, body, {upsert: true}).exec();

		res.json(result);
	};
};

const removeByKey = (repo) => {
	return async (req, res) => {
		const key = req.params.key;

		if (!key) {
			res.status(400);
			res.json({"message": "invalid request"});
			return;
		}

		// Do not throw error if key is missing, keep DELETE method idempotent
		const result = await repo.deleteOne({key}).exec();

		res.json(result);
	};
};

module.exports = {
	findByKey, findAll, createOrUpdate, removeByKey, getDataRepo, connectionFactory,
};
