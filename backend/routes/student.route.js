import { Router } from "express"
import { register, getStudentById } from "../controllers/student.controller.js"
import authMiddleware from "../middlewares/auth.middleware.js"
const studentRouter = Router()
studentRouter.route("/register/:id").post(authMiddleware, register)
studentRouter.route("/get-student/:id").get(authMiddleware, getStudentById)
export default studentRouter