const assert = require('assert');
const {findByKey, findAll, createOrUpdate, removeByKey,} = require('../services/db');

// Store data here
let storage;

// Mock a database connection
let repo;

// Store req params
let params;

// Store json response result
let result;
let status;
const res = {
	status: (st) => status = st,
	json: (data) => result = data,
}

describe('Database service', () => {
	beforeEach(() => {
		params = null;
		result = null;
		status = null;

		storage = [
			{
				key: 'KEY', value: 'VALUE',
			},
		];

		repo = {
			create: (data) => (data),
			find: () => ({
				exec: () => (storage),
			}),
			findOne: (par) => {
				params = par;
				return ({
					exec: () => (storage[0]),
				})
			},
			updateOne: (_, body) => {
				storage[0] = body;

				return {
					exec: () => ({
						upsertedId: "1",
					}),
				};
			},
			deleteOne: (par) => {
				params = par;
				storage = [];
				return {
					exec: () => ({}),
				};
			},
		};
	});

	it('should find all', async () => {
		await findAll(repo)(null, res);

		assert.ok(Array.isArray(result));
		assert.equal(result.length, 1);
		assert.strictEqual(result[0], storage[0]);
	});

	it('should find one by key', async () => {
		const req = {
			params: {key: 'KEY'},
		};

		await findByKey(repo)(req, res);

		// Check correct params are being used
		assert.strictEqual(params.key, req.params.key);
		assert.ok(result);
		assert.strictEqual(result, storage[0]);
	});

	it('should get a missing key and create one', async () => {
		const req = {
			params: {key: 'missing'},
		};

		// Override default method behaviour for this test
		repo.findOne = (par) => {
			params = par;
			return ({
				exec: () => null,
			});
		}
		await findByKey(repo)(req, res);

		// Check correct params are being used
		assert.equal(params.key, req.params.key);
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

	it('should update existing key value pair', async () => {
		const req = {
			params: {key: "Other_key"},
			body: {value: "Other_value"},
		};

		await createOrUpdate(repo)(req, res);

		assert.ok(storage[0]);
		assert.equal(storage[0].key, req.params.key);
		assert.equal(storage[0].value, req.body.value);
	});

	it('should create a new key value pair', async () => {
		const req = {
			params: {key: "Missing_key"},
			body: {value: "Missing_value"},
		};

		// Override default method behaviour for this test
		repo.updateOne = (_, body) => {
			storage.push(body);
			return {
				exec: () => {
				},
			};
		};

		await createOrUpdate(repo)(req, res);

		assert.ok(storage[1]);
		assert.equal(storage[1].key, req.params.key);
		assert.equal(storage[1].value, req.body.value);
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
			params: {key: storage[0].key},
		};

		await removeByKey(repo)(req, res);

		assert.equal(params.key, req.params.key);
		assert.equal(storage.length, 0);
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
});
