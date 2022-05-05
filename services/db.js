const Data = require('../models/data');

const findByKey = async (key) => {
	const res = await Data.findOne({
		key: key,
	}).exec();

	console.log('DEBUG', res);

	return res;
};

module.exports = {
	findByKey,
};
