import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';


cloudinary.config({ 
  cloud_name: `${process.env.CLOUDINARY_CLOUD_NAME}`, 
  api_key: `${process.env.CLOUDINARY_KEY}`, 
  api_secret: `${process.env.CLOUDINARY_SECRET}` 
});

const uploadOnCloudinary = async(file) => {
    try {
        if(!file) {
            console.log('No file found');
            throw new Error('No file found');
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
    }
}

export {uploadOnCloudinary}