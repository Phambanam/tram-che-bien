import bcrypt from "bcryptjs"
import jwt, { SignOptions } from "jsonwebtoken"

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

// Compare password
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

// Generate JWT token
export const generateToken = (id: string): string => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET is not defined")
  }
  
  const options: SignOptions = {
    expiresIn: process.env.JWT_EXPIRE || "1d",
  }
  
  return jwt.sign({ id }, secret, options)
}
