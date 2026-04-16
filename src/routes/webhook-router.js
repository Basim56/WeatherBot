import { Router } from "express";
import { handleWebhook } from "../controller/weather-controller.js";

const webhookRouter = Router();
webhookRouter.route("/").post(handleWebhook);

export { webhookRouter };
