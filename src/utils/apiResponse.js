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

export default apiResponse //exporting the class to be used in other files.