const data_schema = require('../schemas/data_schema');
const mongoose = require("mongoose");
const randomstring = require("randomstring");

const connectionFactory = () => {
	const conn = mongoose.createConnection(process.env.MONGO_URI);

	conn.model('Data', data_schema);

	return conn;
};

/**
 * Return repository methods to abstract away mongo implementation. Can create a similar method for other databases.
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

	// Create does not require .exec() in our case
	model.create = async (params) => {
		return conn.models.Data.create(params);
	};

	model.updateOne = async (...params) => {
		return conn.models.Data.updateOne(...params).exec();
	};

	model.deleteOne = async (params) => {
		return conn.models.Data.deleteOne(params).exec();
	};

	model.deleteMany = async (params) => {
		return conn.models.Data.deleteMany(params).exec();
	}

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

		let result = await repo.findOne({key});

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
		const result = await repo.find();

		res.json(result);
	};
};

const createOrUpdate = (repo) => {
	return async (req, res) => {
		const body = req.body;

		if (!body.key || !body.value) {
			res.status(400);
			res.json({message: "invalid request"});
			return;
		}

		// Update or create
		const result = await repo.updateOne({key: body.key}, body, {upsert: true});

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
		const result = await repo.deleteOne({key});

		res.json(result);
	};
};

const removeAll = (repo) => {
	return async (req, res) => {
		const result = await repo.deleteMany();

		res.json(result);
	};
};

module.exports = {
	findByKey, findAll, createOrUpdate, removeByKey, removeAll, getDataRepo, connectionFactory,
};
