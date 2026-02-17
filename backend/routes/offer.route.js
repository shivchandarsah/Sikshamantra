import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  acceptOffer,
  createOffer,
  fetchOfferByReqId,
  fetchOffers,
  fetchOffersByReqId,
  rejectOffer,
} from "../controllers/offer.controller.js";

const offerRouter = Router();
offerRouter.route("/create").post(authMiddleware, createOffer);
offerRouter.route("/acceptOffer").post(authMiddleware, acceptOffer);
offerRouter.route("/rejectOffer").post(authMiddleware, rejectOffer);
offerRouter.route("/fetchOffers").get(authMiddleware, fetchOffers);
offerRouter.route("/fetchOffers-by-reqId").get(authMiddleware, fetchOffersByReqId);
offerRouter.route("/fetchOffer-reqId").get(authMiddleware, fetchOfferByReqId);

export default offerRouter;
