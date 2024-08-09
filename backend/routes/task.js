import dotenv from "dotenv";
import { createWriteStream } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import crypto from "crypto-js";
import chalk from "chalk";
import express from "express";
import axios from "axios";
import pg from "pg";
import dayjs from "dayjs";
import multer from "multer";

const taskRouter = express.Router();
dotenv.config();

const api = axios.create({
  baseURL: "http://localhost:8080",
  timeout: 15000,
});

const { Client } = pg;

const dbConfig = {
  user: "postgres",
  password: "123",
  database: "postgres",
  host: "localhost",
  port: "5432",
};

async function connectToDB(query = "") {
  const client = new Client(dbConfig);

  try {

    await client.connect();
    console.log("Connected to the Tasks DB");
    const result = await client.query(query);

    return result.rows;

  } catch (error) {

    console.error("Error connecting to the database", error);

  } finally {
    await client.end();
  }

}


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

taskRouter.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  res.send(
    `Image uploaded successfully! File is available at <a href="/uploads/${req.file.filename}">/uploads/${req.file.filename}</a>`
  );
});

taskRouter.get("/", (req, res) => {
  res.send("D-KUB");
});

taskRouter.get("/tasks", async (req, res) => {
  let query = `SELECT * FROM tasks ORDER BY row_id DESC`;


  try {
    const result = await connectToDB(query);
    console.log(result);
    res.status(200).json({ success: "Add Task", data: result });
  } catch (error) {
    res.status(500).json({ error: "Error on add task " + error });
  }
});

taskRouter.post("/task", async (req, res) => {
  console.log(req.body);
  const taskData = req.body;

  let query = `INSERT INTO public.tasks
  (title, detail, startdate, enddate)
  VALUES('${taskData.title}', '${taskData.detail}', '${taskData.startDate}', '${taskData.endDate}');`;
  console.log(query);
  try {
    await connectToDB(query);
    res.status(200).json({ success: "Add Task" });
  } catch (error) {
    res.status(500).json({ error: "Error on add task " + error });
  }
});

taskRouter.get("/tasks/:id", (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const task = tasks.find((t) => t.id === taskId);

  if (!task) {
    return res.status(404).send("Task not found");
  }

  res.json(task);
});

taskRouter.put("/tasks/detail/:id", async (req, res) => {

  const taskId = req.params.id;
  const taskData = req.body;

  if (!taskId) {
    return res.status(404).send( { error: "Task not found" + error } );
  }

    const query = `UPDATE public.tasks
    SET title='${taskData.title}', detail='${taskData.detail}', startdate='${taskData.startDate}', enddate='${taskData.endDate}'
    WHERE row_id=${taskId}`;

  try {
    await connectToDB(query);
    res.status(200).json({ success: "Update Task" });
  } catch (error) {
    res.status(500).json({ error: "Error on add task " + error });
  }

});

taskRouter.delete("/tasks/:id", async (req, res) => {
  const taskID = req.params.id;
  console.log(taskID);
  let query = `DELETE FROM public.tasks
  WHERE row_id=${taskID};`;

  try {
    await connectToDB(query);
    res.status(200).json({ success: "Delete Task", data: { id: taskID } });
  } catch (error) {
    res.status(500).json({ error: "Error on add task " + error });
  }
});

export default taskRouter;
