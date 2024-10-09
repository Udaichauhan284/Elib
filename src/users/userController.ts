import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";
import bcrypt from "bcrypt";
import { config } from "../config/config";
import { sign } from "jsonwebtoken";
import { User } from "./userTypes";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;
  //Validation - of users, dont trust on client
  if (!name || !email || !password) {
    const error = createHttpError(400, "All Fields are required");
    return next(error);
  }

  //Database call, sometime, maybe this give error, so put in try and catch block
  try {
    const user = await userModel.findOne({ email });
    //suppose client give same email, so return error
    if (user) {
      const error = createHttpError(
        400,
        "User is already exist with same name"
      );
      return next(error);
    }
  } catch (err) {
    console.log(err);
    return next(
      createHttpError(500, "Error while fetching data from database")
    );
  }

  //now we nned. stroe the user detauls in DB, hashed the password
  const hashedPassword = await bcrypt.hash(password, 10);

  let newUser: User;
  try {
    newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });
  } catch (err) {
    console.log(err);
    return next(createHttpError(500, "Error while creating new user"));
  }

  //token generation
  try {
    const token = sign({ sub: newUser._id }, config.jwt_secret as string, {
      expiresIn: "7D",
    });
    //then send the response
    res.status(201).json({ accessToken: token });
    //this 201 status code is code for creation
  } catch (err) {
    console.log(err);
    return next(createHttpError(500, "error whule sign the new token"));
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  //check if email and password is given or not
  if (!email || !password) {
    return next(createHttpError(400, "All fields are required"));
  }

  let user;
  try {
    user = await userModel.findOne({ email });
    if (!user) {
      return next(createHttpError(404, "User Not Found with this email"));
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(createHttpError(400, "Username or password incorrect!"));
    }
  } catch (err) {
    console.log(err);
    return next(createHttpError(404, "Error while getting user"));
  }

  try {
    const token = sign({ sub: user._id }, config.jwt_secret as string, {
      expiresIn: "7D",
    });

    res.json({ accessTokem: token });
  } catch (err) {
    console.log(err);
    return next(createHttpError(401, "Error in token generation"));
  }
};

export { createUser, loginUser };
