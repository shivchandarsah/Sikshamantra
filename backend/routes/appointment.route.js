import { Router } from "express"
import { getAppointment, create } from "../controllers/appointment.controller.js"
import authMiddleware from "../middlewares/auth.middleware.js"
const appointmentRouter = Router()
appointmentRouter.route("/create/:offerId").post(authMiddleware, create)
appointmentRouter.route("/get-appointment/:offerId").get(authMiddleware, getAppointment)
export default appointmentRouter