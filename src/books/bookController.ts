import path from "node:path";
import fs from "node:fs";
import { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import { AuthRequest } from "../middleware/authenticate";
//import userModel from "../user/userModel";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre, description } = req.body;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  // 'application/pdf'
  const coverImageMimeType = files.coverImage[0].mimetype.split("/").at(-1);
  const fileName = files.coverImage[0].filename;
  const filePath = path.resolve(
    __dirname,
    "../../public/data/uploads",
    fileName
  );

  try {
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      filename_override: fileName,
      folder: "book-covers",
      format: coverImageMimeType,
    });

    const bookFileName = files.file[0].filename;
    const bookFilePath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      bookFileName
    );

    const bookFileUploadResult = await cloudinary.uploader.upload(
      bookFilePath,
      {
        resource_type: "raw",
        filename_override: bookFileName,
        folder: "book-pdfs",
        format: "pdf",
      }
    );
    const _req = req as AuthRequest;

    const newBook = await bookModel.create({
      title,
      description,
      genre,
      author: _req.userId,
      coverImage: uploadResult.secure_url,
      file: bookFileUploadResult.secure_url,
    });

    // Delete temp.files
    // todo: wrap in try catch...
    await fs.promises.unlink(filePath);
    await fs.promises.unlink(bookFilePath);

    res.status(201).json({ id: newBook._id });
  } catch (err) {
    console.log(err);
    return next(createHttpError(500, "Error while uploading the files."));
  }
};

//controller for UpdateBook
const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, description, genre } = req.body;
  const bookId = req.params.bookId;
  const book = await bookModel.findOne({ _id: bookId });

  if (!book) {
    return next(createHttpError(404, "Book not found"));
  }
  const _req = req as AuthRequest;
  if (book.author.toString() !== _req.userId) {
    return next(createHttpError(403, "You cant update other books"));
  }

  //check if image field is exists
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const coverFileSplits = book.coverImage.split("/");
  const coverImagePublicId = coverFileSplits.at(-2) + "/" + coverFileSplits.at(-1)?.split(".").at(-2);
  let completeCoverImage = "";
  if (files.coverImage) {
    const filename = files.coverImage[0].filename;
    const converMimeType = files.coverImage[0].mimetype.split("/").at(-1);

    //send files to cloudinary
    const filePath = path.resolve(
      __dirname,
      "../../public/data/uploads/" + filename
    );
    completeCoverImage = filename;
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      filename_override: completeCoverImage,
      folder: "book-covers",
      format: converMimeType,
    });

    completeCoverImage = uploadResult.secure_url;
    await fs.promises.unlink(filePath);
    //deleting old one
    await cloudinary.uploader.destroy(coverImagePublicId);
  }

  //check if file is exists
  let completeFileName = "";
  const bookFileSplits = book.file.split("/");
  const bookFilePublicId = bookFileSplits.at(-2) + "/" + bookFileSplits.at(-1);
  if (files.file) {
    const bookFilePath = path.resolve(
      __dirname,
      "../../public/data/uploads/" + files.file[0].filename
    );

    const bookFileName = files.file[0].filename;
    completeFileName = bookFileName;

    const uploadResultPdf = await cloudinary.uploader.upload(bookFilePath, {
      resource_type: "raw",
      filename_override: completeFileName,
      folder: "book-pdf",
      format: "pdf",
    });

    completeFileName = uploadResultPdf.secure_url;
    await fs.promises.unlink(bookFilePath);
    //deleting old one
    await cloudinary.uploader.destroy(bookFilePublicId, {
      resource_type: "raw",
    });
  }

  const updatedBook = await bookModel.findByIdAndUpdate(
    {
      _id: bookId,
    },
    {
      title: title,
      description: description,
      genre: genre,
      coverImage: completeCoverImage ? completeCoverImage : book.coverImage,
      file: completeFileName ? completeFileName : book.file,
    },
    { new: true }
  );

  res.json(updatedBook);
};

//controller for getting the list of all books
const listBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //in production we do Pagination
    const book = await bookModel.find().populate("author", "name");
    res.json(book);
  } catch (err) {
    console.log(err);
    return next(createHttpError(500, "Not able to fetch books"));
  }
};

//controller for single book
// Controller for fetching a single book
const singleBook = async (req: Request, res: Response, next: NextFunction) => {
  const bookId = req.params.bookId;
  try {
    // Use findById instead of find to fetch a single book
    const book = await bookModel.findOne({_id : bookId}).populate("author", "name"); 
    if (!book) {
      return next(createHttpError(404, "Book Not Found"));
    }
    res.json(book);
  } catch (err) {
    console.log(err);
    return next(createHttpError(500, "Error while fetching the book"));
  }
};

//controller for Deleting the book
const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
  const bookId = req.params.bookId;
  try{
    const book = await bookModel.findOne({_id : bookId});
    if(!book){
      return next(createHttpError(404, "Book Not Found"));
    }

    //check the access
    const _req = req as AuthRequest;
    if(book.author.toString() !== _req.userId){
      return next(createHttpError(403, "You cant delete the books"));
    }

    //now we need to delete from cloudinary
    //for deleting we need cloudinary that file public id, and then get the url from DB coverUrl 
    //we need something like this // book-covers/dkzujeho0txi0yrfqjsm

    const coverFileSplits = book.coverImage.split("/");
    const coverImagePublicId = coverFileSplits.at(-2) + "/" + coverFileSplits.at(-1)?.split(".").at(-2);

    const bookFileSplits = book.file.split("/");
    const bookFilePublicId = bookFileSplits.at(-2) + "/" + bookFileSplits.at(-1);

    //now delete it from cloudinary
    await cloudinary.uploader.destroy(coverImagePublicId);
    await cloudinary.uploader.destroy(bookFilePublicId, {
      resource_type: "raw",
    });

    //now need to delete it from DB
    await bookModel.deleteOne({_id : bookId});

    res.sendStatus(204);
  }catch(err){
    console.log(err);
    return next(createHttpError(500, "Not able to Fetch the book"));
  }
}

export { createBook, updateBook, listBook, singleBook, deleteBook };
