import { AppError } from "../../errors/app.error.js";

export const protect = (req, _res, next) => {
  try {
    let token;

    // 1. Snatch the token passport out of the HTTP request headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError(
          "You are not logged in. Please log in to gain access.",
          401,
        ),
      );
    }

    // 2. Parse out the embedded userId from our mock token passport format
    // Format structure: mock-jwt-session-token-[UUID]
    const tokenParts = token.split("mock-jwt-session-token-");
    const userId = tokenParts[1];

    if (!userId) {
      return next(
        new AppError(
          "Malformed or invalid authentication token passport.",
          401,
        ),
      );
    }

    // 3. Scan the global runtime memory heap array to ensure this user profile still exists
    const currentUser = global.db.users.find((user) => user.id === userId);
    if (!currentUser) {
      return next(
        new AppError(
          "The user belonging to this active token no longer exists inside RAM.",
          401,
        ),
      );
    }

    // 4. Attach the sanitized user model directly to the request engine context
    req.user = {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
    };

    return next();
  } catch (err) {
    next(err);
  }
};
