import { settings } from "./settings.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: settings.cloudinary.cloudName,
  api_key: settings.cloudinary.apiKey,
  api_secret: settings.cloudinary.apiPass,
  secure: settings.cloudinary.secure,
});

export { cloudinary };
