import express, {Response, NextFunction} from "express";
import {auth, db} from "../admin/admin";
interface IUserRequest extends express.Request {
  user?: any;
}

// Checks wether user is logged in and valid for making request
export const middleWare = async (
  req: IUserRequest,
  res: Response,
  next: NextFunction
) => {
  const {authorization} = req.headers;
  try {
    const token = authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(400).json({message: "Invalid Token"});
    }
    const decodedToken = await auth.verifyIdToken(token);
    // attaches decodedToken on req
    req.user = decodedToken;
    return next();
  } catch {
    return res.status(401).json({message: "You are not authorized"});
  }
};

// Checks wether user is admin. Will be used on  Content Management
export const adminMiddleWare = async (
  req: IUserRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  // Query to Check wether user is admin
  // Not final, might switch to custom claims in the future
  const userSnapShot = (
    await db.collection("Users").doc(user?.uid).get()
  ).data();

  try {
    if (userSnapShot?.isAdmin === true) {
      return next();
    }
    return res.status(403).json({message: "Admins only"});
  } catch (error) {
    return res.status(500).json({message: error});
  }
};
