const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });

    console.log('MongoDB Connected to:', mongoose.connection.name);

    const userCount = await mongoose.connection.db
      .collection('users')
      .countDocuments();

    console.log('USERS FOUND IN RENDER DATABASE:', userCount);

  } catch (err) {
    console.error('DB Error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;