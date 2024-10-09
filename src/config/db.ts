import mongoose from "mongoose";
import { config } from "./config";

const connectDB = async () => {
  try {
    //messgae for later, if something error occur and succefully connected. These are the Listener, make it on top of code
    mongoose.connection.on("connected", () => {
      console.log("Database is connected successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.log("Some error occurred", err);
    });

    await mongoose.connect(config.databaseURL as string);
  } catch (error) {
    //This error will show in the first time, when connection will not able to connect
    console.log("Failed to connect the DB");
    console.error(error);
    //if db is not able to connect, exit it the server also
    process.exit(1); //1 is status code
  }
};

export default connectDB;
