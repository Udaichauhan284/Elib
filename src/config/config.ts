import {config as conf} from 'dotenv';
conf();

const _config = {
  port : process.env.PORT,
  databaseURL : process.env.MONGO_CONNECTION_STRING,
  env: process.env.NODE_ENV,
  jwt_secret : process.env.JWT_SECRET,
  cloudinaryName : process.env.CLOUDINARY_CLOUD,
  cloudinaryAPIKEY : process.env.CLOUDINARY_API_KEY,
  cloudinarySECRET : process.env.CLOUDINARY_API_SECRET,
  frontendDomain : process.env.FRONTEND_DOMAIN,
}

export const config = Object.freeze(_config);