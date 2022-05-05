const assert = require('assert');
const {findByKey, findAll,} = require('../services/db');

// Store data here
let storage;

// Mock a database connection
let conn;

// Store req params
let params;

// Store json response result
let result;
const res = {
	json: (data) => result = data,
}

describe('Database service', () => {
	beforeEach(() => {
		params = null;
		result = null;

		storage = [
			{
				key: 'KEY', value: 'VALUE',
			},
		];

		conn = {
			models: {
				Data: {
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
				},
			},
		};
	});

	it('should find all', async () => {
		await findAll(conn)(null, res);

		assert.ok(Array.isArray(result));
		assert.equal(result.length, 1);
		assert.strictEqual(result[0], storage[0]);
	});

	it('should find one by key', async () => {
		const req = {
			params: {key: 'KEY'},
		};

		await findByKey(conn)(req, res);

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
		conn.models.Data.findOne = (par) => {
			params = par;
			return ({
				exec: () => null,
			});
		}
		await findByKey(conn)(req, res);

		// Check correct params are being used
		assert.equal(params.key, req.params.key);
		assert.ok(result);
		assert.equal(result.key, 'missing');
		assert.ok(typeof result.value === 'string');
		assert.equal(result.value.length, 10); // random string length is 10 for now
	});
});
