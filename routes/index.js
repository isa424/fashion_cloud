const express = require('express');
const {
	findByKey, findAll, createOrUpdate, connectionFactory, removeByKey, getDataRepo, removeAll,
} = require("../services/db");
const router = express.Router();

// Keep the code loosely coupled
const conn = connectionFactory();
const repo = getDataRepo(conn);
const logger = console.log; // Can swap with a file logger function, or an external logger tool

router.get('/', findAll(repo, logger));
router.get('/:key', findByKey(repo, logger));
router.post('/', createOrUpdate(repo, logger));
router.delete('/', removeAll(repo, logger));
router.delete('/:key', removeByKey(repo, logger));

module.exports = router;
