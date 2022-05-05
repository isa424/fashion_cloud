const express = require('express');
const {findByKey, findAll, createOrUpdate, connectionFactory, removeByKey, getDataRepo} = require("../services/db");
const router = express.Router();

// Keep the code loosely coupled
const conn = connectionFactory();
const repo = getDataRepo(conn);

// todo: Consider providing a logger to use instead of default console.log
router.get('/', findAll(repo));
router.get('/:key', findByKey(repo));
router.post('/:key', createOrUpdate(repo));
router.delete('/:key', removeByKey(repo));

module.exports = router;
