import multer from 'multer';
import HttpException from '../utils/http-exception';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter to allow only CSV and Excel files for user uploads
const csvFileFilter = (
  _req: any, // Using any here as the Request type is complex with user extensions
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (
    file.mimetype === 'text/csv' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    cb(null, true);
  } else {
    cb(new HttpException(400, 'Only CSV and Excel files are allowed'));
  }
};

// File filter for content uploads (images, videos, PDFs, etc.)
const contentFileFilter = (
  _req: any, // Using any here as the Request type is complex with user extensions
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const originalName = file.originalname?.toLowerCase() || '';
  const isPdfByExtension = originalName.endsWith('.pdf');

  // Allow images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  }
  // Allow videos
  else if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  }
  // Allow PDFs
  else if (
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/x-pdf' ||
    ((file.mimetype === 'application/octet-stream' || file.mimetype === '') && isPdfByExtension)
  ) {
    cb(null, true);
  }
  // Allow PowerPoint files (.pptx and .ppt)
  else if (
    file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    file.mimetype === 'application/vnd.ms-powerpoint'
  ) {
    cb(null, true);
  }
  // Allow text files and Word documents
  else if (
    file.mimetype === 'text/plain' ||
    file.mimetype === 'text/markdown' ||
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    cb(null, true);
  }
  // Allow Excel and CSV files
  else if (
    file.mimetype === 'text/csv' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    cb(null, true);
  } else {
    cb(
      new HttpException(
        400,
        'Only images, videos, PDFs, PowerPoint presentations, Word documents, Excel files, and CSV files are allowed',
      ),
    );
  }
};

// File filter specifically for quiz question images
const quizImageFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  // Allow only images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new HttpException(400, 'Only image files are allowed for quiz questions'));
  }
};

// File filter for assignment submissions (PDF/DOC/DOCX only)
const assignmentSubmissionFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const originalName = file.originalname?.toLowerCase() || '';
  const ext = originalName.split('.').pop() || '';
  const allowedExt = ['pdf', 'doc', 'docx'];

  const validMime =
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/x-pdf' ||
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.mimetype === 'application/octet-stream';

  if (!allowedExt.includes(ext) || !validMime) {
    cb(new HttpException(400, 'Only PDF, DOC, and DOCX files are allowed for assignments'));
    return;
  }

  cb(null, true);
};

// Create multer instance for CSV uploads
export const upload = multer({
  storage,
  fileFilter: csvFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Create multer instance for content uploads
export const contentUpload = multer({
  storage,
  fileFilter: contentFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // Increased to 100MB limit for content files
    fieldSize: 25 * 1024 * 1024, // 25MB for form fields
  },
});

// Create a special uploader for very large files (videos, large documents)
export const largeContentUpload = multer({
  storage,
  fileFilter: contentFileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for very large files
    fieldSize: 25 * 1024 * 1024,
  },
});

// Create multer instance specifically for quiz question images
export const quizImageUpload = multer({
  storage,
  fileFilter: quizImageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for images
  },
});

// Create multer instance specifically for quiz creation with multiple images
export const quizWithImagesUpload = multer({
  storage,
  fileFilter: quizImageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per image
    files: 20, // Maximum 20 images
  },
});

// Create multer instance for assignment submission uploads
export const assignmentSubmissionUpload = multer({
  storage,
  fileFilter: assignmentSubmissionFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // Route-level hard guard. Assignment-specific limit is validated in service.
    files: 20, // Route-level hard guard. Assignment-specific max count is validated in service.
    fieldSize: 2 * 1024 * 1024,
  },
});
