require('dotenv').config({
	path: '.env.testing',
})
const assert = require('assert');
const {findByKey, findAll, createOrUpdate, removeByKey, removeAll, getDataRepo,} = require('../services/db');
const {MongoMemoryServer} = require('mongodb-memory-server');
const mongoose = require("mongoose");
const data_schema = require('../schemas/data_schema');

// Mock a database connection
let server;
let conn;
let repo;

// Store json response result
let result;
let status;
const res = {
	status: (st) => status = st,
	json: (data) => result = data,
}

describe('Database service', () => {
	before(async () => {
		// Create an in-memory database for testing
		server = await MongoMemoryServer.create();

		conn = await mongoose.createConnection(server.getUri());
		conn.model('Data', data_schema);

		repo = getDataRepo(conn);
	});

	beforeEach(async () => {
		result = null;
		status = null;

		// Reset database data
		await conn.models.Data.deleteMany();
		await conn.models.Data.insertMany([
			{
				key: 'key_1', value: 'value_1',
			},
		]);
	});

	after(async () => {
		// Close db
		if (conn) {
			await conn.close();
		}

		if (server) {
			await server.stop();
		}
	});

	it('should find all', async () => {
		await findAll(repo)(null, res);

		assert.ok(Array.isArray(result));
		assert.equal(result.length, 1);

		const data = await repo.find();
		assert.strictEqual(result[0].key, data[0].key);
		assert.strictEqual(result[0].value, data[0].value);
	});

	it('should find one by key', async () => {
		const req = {
			params: {key: 'key_1'},
		};

		await findByKey(repo)(req, res);

		assert.ok(result);
		const data = await repo.findOne();
		assert.strictEqual(result.key, data.key);
		assert.strictEqual(result.value, data.value);
	});

	it('should try to get a missing key and create one', async () => {
		const req = {
			params: {key: 'missing'},
		};

		await findByKey(repo)(req, res);

		assert.ok(result);
		assert.equal(result.key, 'missing');
		assert.ok(typeof result.value === 'string');
		assert.equal(result.value.length, 10); // random string length is 10 for now
	});

	it('should fail validation when getting a key value pair', async () => {
		const req = {
			params: {},
		};

		await findByKey(repo)(req, res);

		assert.ok(result);
		assert.equal(status, 400);
		assert.equal(result.message, "invalid request");
	});

	it('should handle max data limit when creating a key value pair', async () => {
		const req = {
			params: {key: 'test'},
		};

		await findByKey(repo)(req, res);

		const count = await repo.count();

		assert.equal(count, process.env.MAX_DATA_COUNT);
	});

	it('should update existing key value pair', async () => {
		const req = {
			body: {key: "key_1", value: "value_2"},
		};

		await createOrUpdate(repo)(req, res);

		const data = await repo.findOne({key: 'key_1'});

		assert.ok(data);
		assert.equal(data.key, req.body.key);
		assert.equal(data.value, req.body.value);
	});

	it('should create a new key value pair', async () => {
		const req = {
			body: {key: "Missing_key", value: "Missing_value"},
		};

		await createOrUpdate(repo)(req, res);

		const data = await repo.findOne({key: req.body.key});

		assert.ok(data);
		assert.equal(data.key, req.body.key);
		assert.equal(data.value, req.body.value);
	});

	it('should fail validation when creating/updating a key value pair', async () => {
		const req = {
			params: {},
			body: {},
		};

		await createOrUpdate(repo)(req, res);

		assert.ok(result);
		assert.equal(status, 400);
		assert.equal(result.message, "invalid request");
	});

	it('should remove one by key', async () => {
		const req = {
			params: {key: 'key_1'},
		};

		await removeByKey(repo)(req, res);

		const count = await repo.count();

		assert.equal(count, 0);
	});

	it('should fail validation when removing a key value pair', async () => {
		const req = {
			params: {},
		};

		await removeByKey(repo)(req, res);

		assert.ok(result);
		assert.equal(status, 400);
		assert.equal(result.message, "invalid request");
	});

	it('should remove all key value pairs', async () => {
		await removeAll(repo)(null, res);

		const count = await repo.count();

		assert.equal(count, 0);
	});
});
