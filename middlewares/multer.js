import multer from 'multer';

const storage = multer.memoryStorage();
const uploadfiles = multer({ storage }).array('files', 10);

export default uploadfiles;
