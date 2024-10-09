import { v2 as cloudinary } from "cloudinary";
import { config } from "./config";


  // Configuration
  cloudinary.config({
    cloud_name: config.cloudinaryName,
    api_key: config.cloudinaryAPIKEY,
    api_secret: config.cloudinarySECRET
  });

  export default cloudinary;
  