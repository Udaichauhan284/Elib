import mongoose from "mongoose";
import { User } from "./userTypes";
const userSchema = new mongoose.Schema<User>({
  name : {
    type : String,
    required : true
  },
  email : {
    type : String,
    required : true,
    unique : true
  },
  password : {
    type : String,
    required : true
  }
}, {timestamps : true}
);

//User collection will create from userSchema
const userModel = mongoose.model<User>("User", userSchema);
export default userModel;