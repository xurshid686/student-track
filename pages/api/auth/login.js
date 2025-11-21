import { connectToDatabase, initDatabase } from '../../../../lib/mongodb'
import { generateToken, setTokenCookie } from '../../../../lib/auth'
import bcrypt from 'bcryptjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { username, password, profile } = req.body

  try {
    // Initialize database
    await initDatabase()
    const { db } = await connectToDatabase()

    // Find user by username or email
    const user = await db.collection('users').findOne({
      $or: [
        { username: username },
        { email: username }
      ],
      profile: profile
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate JWT token
    const token = generateToken(user)
    
    // Set HTTP-only cookie
    setTokenCookie(res, token)

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user
    
    res.status(200).json({ 
      success: true, 
      user: userWithoutPassword,
      message: 'Login successful'
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
