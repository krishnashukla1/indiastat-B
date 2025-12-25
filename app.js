// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const morgan = require('morgan');
// const path = require('path');

// const authRoutes = require('./routes/auth');
// const datasetRoutes = require('./routes/datasets');
// const errorHandler = require('./middlewares/errorHandler');

// const app = express();

// app.use(helmet());
// app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
// app.use(express.json({ limit: '10mb' })); // allow JSON bodies
// app.use(express.urlencoded({ extended: true }));
// app.use(morgan('dev'));

// // expose uploads folder statically (but only serve file when authorized via a controller)
// // app.use('/uploads', express.static('uploads'));

// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // routes
// app.use('/api/auth', authRoutes);
// app.use('/api/datasets', datasetRoutes);

// // generic error handler
// app.use(errorHandler);

// module.exports = app;
