require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');

// const mongoose = require('mongoose');
// mongoose.connect(process.env.MONGO_URI)
// 	.catch(err => console.error(err));

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

app.use('/', indexRouter);

module.exports = app;
