import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import dishRoutes from "./routes/dishes.js";
import tableRoutes from "./routes/tables.js";
import orderRoutes from "./routes/orders.js";
import adminRoutes from "./routes/admin.js";
import contactRoutes from "./routes/contactRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import paymentRoutes from "./routes/payments.js";

import "./cron/attendanceCron.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(
  cors({
    origin: ["http://localhost:4004", "https://restaurantsystem-six.vercel.app"],
    credentials: true,
  })
);

app.use(express.json());

app.use(morgan("dev"));

app.use((req, res, next) => {
  console.log(`\x1b[36m ${req.method} ${req.url}\x1b[0m`);

  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/dishes", dishRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/", (req, res) => {
  res.send("Restaurant API is running...");
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch((err) => console.error("MongoDB error ❌", err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
