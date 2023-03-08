#!/usr/bin/env node

import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import update from "./routes/update/index.js";
import { AddressInfo } from "net";

const port = parseInt(process.argv.pop()!) || 0;

const app = express();
app.use(bodyParser.json());
app.get("/update", update);
const server = app.listen(port);

console.info(
  `Server is listening on port ${(server.address() as AddressInfo).port}`
);
