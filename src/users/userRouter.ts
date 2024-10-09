import express from 'express';
import { createUser, loginUser } from './userController';

const userRouter = express.Router();

//routes
userRouter.post("/register", createUser);
//here user creating function i have write in controller, and call that controller in routes

userRouter.post("/login", loginUser);

export default userRouter;