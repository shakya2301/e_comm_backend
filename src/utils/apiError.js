// used to handle errors in an effective and clean way.

class ApiError extends Error{
    constructor(
        errors = [],
        statusCode,
        message = "Something went wrong!",
        stack = ""
    )
    {
        this.message= message;
        this.statusCode = statusCode;
        // this.stack= stack;
        this.data= null;
        this.success= false;
        this.errors = errors

        if(stack)
        {
            this.stack = stack;
        }
        else{
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default ApiError;