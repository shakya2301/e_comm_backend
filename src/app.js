import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';



const app = express();

app.use(cors({origin: `*`, optionSuccessStatus: 200})); //configuring cors {read documentation}

//JSON Handled.
app.use(express.json()); // the middleware offered by express to parse incoming requests with JSON payloads...avoided the options, can be seen in documentation
//Url Handled.
app.use(express.urlencoded({extended: true})); // the middleware offered by express to parse incoming requests with urlencoded payloads...avoided the options, can be seen in documentation
//Static Files Handled.
const options = {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['htm', 'html'],
  index: false,
  maxAge: '1d',
  redirect: false,
  setHeaders (res, path, stat) {
    res.set('x-timestamp', Date.now())
  }
}
app.use(express.static('public', options)); // the middleware offered by express to serve static files...

//Cookie Handled.
app.use(cookieParser()); // the middleware offered by express to parse incoming requests with cookies...avoided the options, can be seen in documentation
//File Uploading Handling: use Multer.


import userRouter from './routes/user.routes.js'
import sellerRouter from './routes/seller.routes.js'
import categoryRouter from './routes/category.routes.js'
import brandRouter from './routes/brand.routes.js'
import productRouter from './routes/product.routes.js'

//routes declaration
app.use("/api/user", userRouter) // http://localhost:8000/api/v1/users/register
app.use("/api/seller", sellerRouter) // http://localhost:8000/api/v1/sellers/register
app.use("/api/category", categoryRouter) // http://localhost:8000/api/v1/categories/create
app.use("/api/brands", brandRouter) // http://localhost:8000/api/v1/brands/create
app.use("/api/products", productRouter) // http://localhost:8000/api/v1/products/create

export {app}; //exporting the app to be used in other files.