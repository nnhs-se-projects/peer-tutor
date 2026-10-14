/**
 * The exported function establishes a connection to the specified MongoDB database via the Mongoose module.
 * It resolves to the connected mongoose instance.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const con = await mongoose.connect(process.env.MONGO_URI);

    console.info(`MongoDB connected : ${con.connection.host}`);
    return con;
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;
