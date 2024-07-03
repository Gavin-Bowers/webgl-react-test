import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || "3001";

app.use(cors());

app.get("/hello", async (req, res) => {
	res.json({status:"okay", message:"hello"});
});

// Start server
app.listen(port, () => {
  console.log("Server is running on port " + port);
});

export default app;