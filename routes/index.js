const express = require('express');
const {findByKey, findAll, connectionFactory} = require("../services/db");
const router = express.Router();

const conn = connectionFactory();

router.get('/', findAll(conn));
router.get('/:key', findByKey(conn));

module.exports = router;
