import path from 'node:path';
import  express  from "express";
import { createBook, deleteBook, listBook, singleBook, updateBook } from "./bookController";
import multer from "multer";
import authenticate from '../middleware/authenticate';

const bookRouter = express.Router();

//Multer, it take file store local then to cloud space
//middleware
const upload = multer({
  dest: path.resolve(__dirname, '../../public/data/uploads'),  // Destination directory for file uploads
  limits: { fileSize: 3e7 }  // 30 MB file size limit (3e7 is scientific notation for 30,000,000 bytes)
});

bookRouter.post("/", 
  authenticate,
  upload.fields([
  {name: 'coverImage', maxCount:1},
  {name: 'file', maxCount : 1}
]), createBook);

//update books
bookRouter.patch("/:bookId", 
  authenticate,
  upload.fields([
    {name : 'coverImage', maxCount:1},
    {name: 'file', maxCount:1}
  ]),
  updateBook
);

//get the list of books
bookRouter.get("/", listBook);

//get route for getting single book
bookRouter.get("/:bookId", singleBook);

//delete route
bookRouter.delete("/:bookId", authenticate, deleteBook)

export default bookRouter;