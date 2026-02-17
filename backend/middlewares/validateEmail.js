// middlewares/validateEmail.js
import { ApiError } from "../utility/ApiError.js";

const validateGmail = (req, res, next) => {
  const { email } = req.body;
  if (!email || !/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
    throw new ApiError(400, "Only Gmail accounts are allowed");
  }
  next();
};

export default validateGmail;
