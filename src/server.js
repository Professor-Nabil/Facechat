import express from "express";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";

const JWT_SECRET = "MySecret";
const Database = {
  Users: [],
  GlobalChat: [],
};

const app = express();

app.use(express.json());
app.use(express.static("public"));

app.post("/api/login", async (req, res) => {
  try {
    const newUser = {
      id: uuidv4(),
      userName: faker.internet.username(),
    };

    Database.Users.push(newUser);

    const token = jwt.sign({ user: newUser }, JWT_SECRET);

    res.status(201).json({
      message: "Success signup",
      data: {
        token,
        user: {
          id: newUser.id,
          userName: newUser.userName,
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error: 500" });
  }
});

const authMiddleware = async (req, res, next) => {
  try {
    req.user = jwt.verify(req.body.data.token, JWT_SECRET).user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error: 500" });
  }
};

app.post("/api/getOneUser", authMiddleware, async (req, res) => {
  res.json({
    message: "Success get one user",
    data: {
      user: req.user,
    },
  });
});

app.get("/api/getAllUsers", async (req, res) => {
  res.json({
    message: "Success get all users",
    data: Database.Users,
  });
});

app.get("/api/getAllglobalChat", async (req, res) => {
  res.json({
    message: "Success get all global chat",
    data: Database.GlobalChat,
  });
});

app.post("/api/addOneGlobalChat", authMiddleware, async (req, res) => {
  const { user } = req;
  const { userMessage } = req.body.data;

  const newMessage = {
    user,
    userMessage,
  };

  Database.GlobalChat.push(newMessage);

  res.status(201).json({
    message: "Success add one global chat",
    data: {
      userMessage,
    },
  });
});

app.listen(3000, () => {
  console.log(`Server listening on port ${3000}`);
});
