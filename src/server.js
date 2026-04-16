import "dotenv/config";
import express from "express";
import { webhookRouter } from "./routes/webhook-router.js";
const app = express();
app.use(express.json());
app.use("/api/webhook", webhookRouter);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || "error";
  res.status(statusCode).json({ status, message: err.message });
});
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
