import express, {Request, Response, NextFunction} from 'express';
import globalErrorHandler from "./middleware/globalErrorHandler";
import userRouter from './users/userRouter';
import cors from 'cors';
import { HttpError } from 'http-errors';
import bookRouter from './books/bookRouter';
import { config } from './config/config';

const app = express();

app.use(cors({
  origin : config.frontendDomain
}));

app.use(express.json());

// HTTP method: GET, POST, PUT, DELETE, PATCH
app.get('/', (req, res, next) => {
  res.json({ message: "Welcome to REST APIs" });
});

// Use userRouter for user-related routes
app.use('/api/users', userRouter);
//router for book 
app.use('/api/books', bookRouter);

// Global Error Handler
app.use((err: HttpError, req : Request, res: Response, next: NextFunction) => {
  globalErrorHandler(err, req, res, next);
});


export default app;