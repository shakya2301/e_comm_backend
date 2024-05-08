import mongoose from 'mongoose';

export const connectDB = async() => {
    try {
        console.log(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`);
        const conn = await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`);
        console.log(`MongoDB Connected Successfully: ${conn.connection.host}`); //conn is a connection instance object, we can learn about the connection once it is established via this object.
    } catch (error) {
        console.log(`MongoDB connection Error: ${error.message}`);
        // throw new Error(`Error: ${error.message}`);
        process.exit(1); //we can learn more about these exit codes in the future
    }
}