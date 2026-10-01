const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    console.log('MongoDB Connected to:', mongoose.connection.name);
  } catch (err) {
    console.error('DB Error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;