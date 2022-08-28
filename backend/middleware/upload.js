const multer = require('multer');
const csvFilter = (req, file, cb) => {
  if (file.mimetype.includes("csv")) {
    cb(null, true);
  } else {
    cb("Please upload only csv file.", false);
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

const uploadFile = multer({ storage: storage, fileFilter: csvFilter });
module.exports = uploadFile;