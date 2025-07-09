require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { User, Lobby } = require('./models');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Example endpoint
app.get('/', (req, res) => {
  res.send('Yegna Bingo backend is running!');
});

// Add your other endpoints here...

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Yegna Bingo backend listening on port ${PORT}`);
});// touch to force git add
                                                                                                                                              so