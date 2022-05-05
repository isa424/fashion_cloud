const assert = require('assert');
const {findByKey, findAll,} = require('../services/db');

const example = {
	key: 'KEY', value: 'VALUE',
};

const conn = {
	models: {
		Data: {
			find: () => ({
				exec: () => ([example]),
			}),
			findOne: () => ({
				exec: () => (example),
			}),
		},
	},
};

const res = {
	json: (data) => result = data,
}

let result;

describe('Database service', function () {
	beforeEach(() => {
		result = null;
	});

	afterEach(() => {
	});

	it('should find all', async () => {
		await findAll(conn)(null, res);

		assert.ok(Array.isArray(result));
		assert.equal(result.length, 1);
		assert.strictEqual(result[0], example);
	});

	it('should find one by key', async () => {
		const req = {
			params: {key: 'KEY'},
		};

		await findByKey(conn)(req, res);

		assert.ok(result);
		assert.strictEqual(result, example);
	});
});
