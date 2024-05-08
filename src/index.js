import { connectDB } from "./db/index.js";
import express from 'express';
import dotenv from 'dotenv';

dotenv.config({
    path: '.env',
});

connectDB();
