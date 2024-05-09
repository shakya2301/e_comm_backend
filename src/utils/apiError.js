// used to handle errors in an effective and clean way.

class apiError extends Error{
    constructor(
        statusCode, // HTTP status code indicating the type of error (e.g., 404 for Not Found).
        message = "Something went wrong", // Custom error message, with a default value.
        errors = [], // Optional array of errors, useful for providing detailed error information.
        stack = "" // Optional stack trace string; if not provided, it will be captured automatically.
    ){
        super(message); // Call the constructor of the parent Error class with the message.
        this.statusCode = statusCode; // Assign the provided status code to the instance.
        this.data = null; // Initialize a data property, which can be used to attach additional error data.
        this.message = message; // Assign the provided message to the instance.
        this.success = false; // A flag indicating that the API request was not successful.
        this.errors = errors; // Assign the provided array of errors to the instance.
        
        // Conditionally set the stack trace.
        if (stack) {
            // If a stack trace is provided, use it.
            this.stack = stack;
        } else {
            // If no stack trace is provided, capture it using Error.captureStackTrace.
            // This method creates a .stack property on the ApiError instance, omitting the constructor call from the stack.
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default apiError;