import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';

const csvFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype?.includes("csv")) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-mvm-${file.originalname}`);
  },
})

const uploadFile = multer({ storage, fileFilter: csvFilter });
module.exports = uploadFile;