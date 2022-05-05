const express = require('express');
const {findByKey} = require("../services/db");
const router = express.Router();

router.get('/', function(req, res, next) {
  res.json('Index');
});

router.get('/:key', async (req, res, next) => {
  // const conn = connectionFactory();

  const result = await findByKey('test');

  res.json(result);
});

module.exports = router;
