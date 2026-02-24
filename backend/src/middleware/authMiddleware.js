import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set. Define it in your environment before starting the server.");
}

/**
 * Verify JWT and attach user to request
 */
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;

  if (!token) {
    return res.status(401).json({ 
      message: "Authorization token missing",
      code: "TOKEN_MISSING"
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { 
      id: decoded.id, 
      role: decoded.role,
      tokenVersion: decoded.tokenVersion 
    };
    return next();
  } catch (error) {
    // Handle expired vs invalid tokens differently
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ 
        message: "Access token expired",
        code: "TOKEN_EXPIRED"
      });
    }
    return res.status(401).json({ 
      message: "Invalid token",
      code: "TOKEN_INVALID"
    });
  }
};

/**
 * Require specific role(s) - use after protect()
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ 
      message: "Forbidden - insufficient permissions",
      code: "FORBIDDEN"
    });
  }
  return next();
};

/**
 * Optional auth - continues even if token missing/invalid
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { 
      id: decoded.id, 
      role: decoded.role,
      tokenVersion: decoded.tokenVersion 
    };
  } catch (error) {
    // Invalid token - continue without user
  }
  
  return next();
};
