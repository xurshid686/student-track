import jwt from 'jsonwebtoken'
import { serialize } from 'cookie'

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-for-development'

export function generateToken(user) {
  return jwt.sign(
    { 
      userId: user._id.toString(),
      username: user.username,
      profile: user.profile,
      name: user.name,
      ...(user.profile === 'student' && { studentId: user.studentId })
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export function setTokenCookie(res, token) {
  const cookie = serialize('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  })

  res.setHeader('Set-Cookie', cookie)
}

export function removeTokenCookie(res) {
  const cookie = serialize('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: -1,
    path: '/',
  })

  res.setHeader('Set-Cookie', cookie)
}

export async function authenticateUser(req) {
  const token = req.cookies?.token

  if (!token) {
    return null
  }

  const decoded = verifyToken(token)
  
  if (!decoded) {
    return null
  }

  // You could fetch fresh user data from database here if needed
  return decoded
}
