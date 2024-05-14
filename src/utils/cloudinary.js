import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
import apiError from './apiError.js';


// console.log(process.env.CLOUDINARY_NAME);
// console.log(process.env.CLOUDINARY_KEY);
// console.log(process.env.CLOUDINARY_SECRET);
cloudinary.config({ 
  cloud_name: 'ecomm2301', 
  api_key: '593868343538587', 
  api_secret: 'tmwCi0oanT34Munjgj9boHTC1rc' 
});

const uploadOnCloudinary = async(file) => {
    try {
        if(!file) {
            console.log('No file found');
            return null
        }
        //uploading file on cloudinary...
        const result = await cloudinary.uploader.upload(file, {
            resource_type: 'auto',
        })
        console.log("File uploaded successfully to cloudinary");
        console.log(result.url);
        fs.unlinkSync(file); //deleting the file from the local storage after uploading to cloudinary.
        return result.url;
    } catch (error) {
        //keeping the file intact in case of any error.
        console.log(error.message); 
        console.log("Error uploading file to cloudinary");
        return null;
    }
}

const deleteFromCloudinary = async (publicID) => {
    console.log("Deleting file from cloudinary : ", publicID);
  
    try {
      if (!publicID) return null;
  
      //delete file from cloudinary
      const response = await cloudinary.uploader.destroy(publicID);
  
      console.log("File deleted successfully : ", response.result);
      return response;
    } catch (error) {
      console.log("Error in deleting file from cloudinary : ", error);
      return null;
    }
};

export {uploadOnCloudinary, deleteFromCloudinary}