import { connectDB } from "./db/index.js";
import dotenv from 'dotenv';
import {app} from './app.js';

dotenv.config({
    path: './.env',
});

connectDB()
.then(()=>{
    app.listen(8000, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log(`Error connecting to the database!! : ${error.message}`);
    process.exit(1);
})