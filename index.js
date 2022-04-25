 import express from "express";
 import dotenv from "dotenv";
 import cors from "cors";
 import jwt from "jsonwebtoken";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";

const app = express();

dotenv.config();
app.use(cors());

app.use(express.json());
const auth = (req, res, next) => {
    try {
      const token = req.header("x-auth-token");
      jwt.verify(token, process.env.SECRET_KEY);
      next();
    } catch (err) {
      res.status(401).send({ error: err.message });
    }
  };
const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGO_URL;

async function createConnection() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  console.log("Mongo is connected ✌️😊");
  return client;
}
export const client = await createConnection();

app.get("/", auth, function (req, res) {
  res.send("Hello Everyone 4000😄");
});

 async function genPassword(password) {
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    return hashPassword;
  }
  
  app.post("/signup", async function (req, res) {
    const { username, password } = req.body;
    const hashedPassword = await genPassword(password);
    const newUser = {
      username: username,
      password: hashedPassword,
    };
    const result = await client.db("pizza-app").collection("users").insertOne(newUser) ;
    res.send(result);
  });
  
  app.post("/login", async function (req, res) {
    const { username, password } =  req.body; 
    
    const matchedUser = await client
    .db("pizza-app")
    .collection("users")
    .findOne({ username: username }); 
    if (matchedUser) {
      const isPasswordMatch = await bcrypt.compare(
        password,
        matchedUser.password
      );
      if (isPasswordMatch) {
        const token = jwt.sign({ id: matchedUser._id }, process.env.SECRET_KEY);
        res.send({ messagge: "Logged in sussfully", token: token });
      } else {
        res.status(401).send("Invalid credentials");
      }
    } else {
      res.status(401).send("Invalid credentials");
    }
  });

app.listen(PORT, () => console.log("sever started"));