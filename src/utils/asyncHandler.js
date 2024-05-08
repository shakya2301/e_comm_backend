//this is an alternative to try catch block in all the db interacting functions.

const asyncHandler = (fn) => async(req,res,err,next) => {
    try {
        await fn(req,res,err,next);
    } catch (error) {
        res.status(error.code||500).json({
            success: false,
            message: error.message
        })
    }
}

export default asyncHandler; //exporting the function to be used in other files.