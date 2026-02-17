import { Router } from "express"
import { create, getAllChat, getStudentsWhoMessaged } from "../controllers/chat.controller.js"
import authMiddleware from "../middlewares/auth.middleware.js"
const chatRouter = Router()
chatRouter.route("/create/:receiverId").post(authMiddleware, create)
chatRouter.route("/get-all-chats/:offerId").get(authMiddleware, getAllChat)
chatRouter.route("/students-who-messaged").get(authMiddleware, getStudentsWhoMessaged)
export default chatRouter