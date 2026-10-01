import jwt from "jsonwebtoken";

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return next();

  const token = header.replace(/^Bearer\s+/i, "");
  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET || "super-secret-key");
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Authentication required" });

  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET || "super-secret-key");
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireCustomer(req, res, next) {
  return requireAuth(req, res, () => {
    const customerId = Number(req.auth?.userId);
    if (!Number.isSafeInteger(customerId) || customerId < 1) {
      return res.status(401).json({ message: "A valid customer session is required" });
    }
    req.auth.userId = customerId;
    return next();
  });
}
