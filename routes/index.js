const express = require('express');
const {findByKey, findAll, createOrUpdate, connectionFactory} = require("../services/db");
const router = express.Router();

const conn = connectionFactory();

// todo: Consider providing a logger to use instead of default console.log
router.get('/', findAll(conn));
router.get('/:key', findByKey(conn));
router.post('/:key', createOrUpdate(conn));

module.exports = router;
