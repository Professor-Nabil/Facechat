import crypto from "crypto";
import { AppError } from "../../errors/app.error.js";

// 1. SIGNUP CONTROLLER (Removed 'public')
export const signup = (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Strict validation check
    if (!email || !password || !name) {
      return next(
        new AppError("Missing required fields: email, password, name", 400),
      );
    }

    // Check if the user email already exists in RAM
    const userExists = global.db.users.some((user) => user.email === email);
    if (userExists) {
      return next(
        new AppError("Conflict Error: Email already registered", 409),
      );
    }

    // Construct a new user entry
    const newUser = {
      id: crypto.randomUUID(),
      email,
      password, // Storing plain text for this simple RAM MVP prototype
      name,
      createdAt: new Date(),
    };

    // Save directly to the RAM array
    global.db.users.push(newUser);

    // Sanitize output (don't send password back down the wire)
    const { password: _, ...sanitizedUser } = newUser;

    return res.status(201).json({
      status: "success",
      message: "Account created successfully inside RAM!",
      data: { user: sanitizedUser },
    });
  } catch (err) {
    next(err);
  }
};

// 2. LOGIN CONTROLLER (Removed 'public')
export const login = (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError("Please provide email and password", 400));
    }

    // Search RAM for matching credentials
    const user = global.db.users.find(
      (u) => u.email === email && u.password === password,
    );
    if (!user) {
      return next(new AppError("Invalid email or password combination", 401));
    }

    // Simulate an authorization bearer passport token using their user ID
    const mockToken = `mock-jwt-session-token-${user.id}`;

    return res.status(200).json({
      status: "success",
      message: "Logged in perfectly!",
      data: {
        token: mockToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
