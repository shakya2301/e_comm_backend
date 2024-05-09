//this is an alternative to try catch block in all the db interacting functions.

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch((error) => {
        res.status(error.code || 500).json({
          success: false,
          message: error.message,
        });
      });
  };
  

export default asyncHandler; //exporting the function to be used in other files.