import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';


const app = express();

app.use(cors({origin: `${process.env.CORS_ORIGIN}`, optionSuccessStatus: 200})); //configuring cors {read documentation}

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
