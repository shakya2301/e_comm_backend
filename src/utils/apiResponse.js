// streamlining the response format for a cleaner codebase.

class apiResponse
{
    constructor(statusCode, data, message)
    {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
    }
}

export {apiResponse} //exporting the class object to be used in other files.