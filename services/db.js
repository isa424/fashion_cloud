const data_schema = require('../schemas/data_schema');
const mongoose = require("mongoose");
const randomstring = require("randomstring");
const differenceInSeconds = require('date-fns/differenceInSeconds');

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

	model.findOne = async (...params) => {
		return conn.models.Data.findOne(...params).exec();
	};

	model.find = async (...params) => {
		return conn.models.Data.find(...params).exec();
	};

	// Create does not require .exec() in our case
	model.create = async (...params) => {
		return conn.models.Data.create(...params);
	};

	model.updateOne = async (...params) => {
		return conn.models.Data.updateOne(...params).exec();
	};

	model.deleteOne = async (...params) => {
		return conn.models.Data.deleteOne(...params).exec();
	};

	model.deleteMany = async (...params) => {
		return conn.models.Data.deleteMany(...params).exec();
	};

	model.count = async (...params) => {
		return conn.models.Data.count(...params).exec();
	};

	return model;
};

const findByKey = (repo, logger) => {
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
			if (logger) {
				logger('Cache hit for key: ' + key + ' with value: ' + result.value);
			}

			const now = new Date();
			const then = new Date(result.updatedAt);
			const diff = differenceInSeconds(now, then);

			// Check if cache is old
			if (diff < process.env.TIME_TO_LIVE) {
				// touch updatedAt field to renew it
				await repo.updateOne({key}, {value: result.value});
				result = await repo.findOne({key});
				res.json(result);
				return;
			}

			// If cache is too old update it with new value and return
			const value = randomstring.generate(10);
			await repo.updateOne({key}, {value: value});
			result = await repo.findOne({key});

			res.json(result);
			return;
		}

		const count = await repo.count();
		if (logger) {
			logger('Cache miss for key: ' + key);
		}

		// If max count is reached just update the oldest data by checking 'updatedAt'
		if (count >= process.env.MAX_DATA_COUNT) {
			const value = randomstring.generate(10);
			result = await updatedOldest(repo, key, value);

			res.json(result);
			return;
		}

		// Otherwise, just add new data
		result = await repo.create({
			key: key,
			value: randomstring.generate(10),
		});

		res.json(result);
	}
};

const findAll = (repo) => {
	return async (req, res) => {
		const result = await repo.find({}, {}, {lean: true});

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

		const count = await repo.count();
		const exists = await repo.findOne({key: body.key});

		// If max count is reached just update the oldest data by checking 'updatedAt'
		if (count >= process.env.MAX_DATA_COUNT && !exists) {
			const result = await updatedOldest(repo, body.key, body.value);

			res.json(result);
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

const updatedOldest = async (repo, key, value) => {
	// Sort by updatedAt asc and find first to get the oldest key value pair
	const oldest = await repo.findOne(null, null, {sort: {'updatedAt': 1}});

	// Update key and value with new ones
	await repo.updateOne({key: oldest.key}, {key, value});

	return await repo.findOne({key});
};

module.exports = {
	findByKey, findAll, createOrUpdate, removeByKey, removeAll, getDataRepo, connectionFactory,
};
