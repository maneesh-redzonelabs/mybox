const express = require('express');
const cors = require('cors');

const authRoutes = require('./modules/auth/routes');
const profileRoutes = require('./modules/profile/routes');
const familyRoutes = require('./modules/family/routes');
const policiesRoutes = require('./modules/policies/routes');
const vehiclesRoutes = require('./modules/vehicles/routes');
const dashboardRoutes = require('./modules/dashboard/routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ data: { status: 'ok', timestamp: new Date().toISOString() } });
});

const v1 = express.Router();
v1.use(authRoutes);
v1.use(profileRoutes);
v1.use(familyRoutes);
v1.use(policiesRoutes);
v1.use(vehiclesRoutes);
v1.use(dashboardRoutes);

app.use('/api/v1', v1);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
