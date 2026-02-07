import cloudinary from "../config/cloudinary";

export const uploadToCloudinary = async (file: Express.Multer.File) => {
  return new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: "mentor_profiles",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) reject(error);
        else resolve(result);
      }
    ).end(file.buffer);
  });
};
