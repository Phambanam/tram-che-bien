import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

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
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  })
}
