import { connectToDatabase, initDatabase } from '../../../../lib/mongodb'
import bcrypt from 'bcryptjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { username, email, password, profile, name, grade, studentId } = req.body

  try {
    // Initialize database
    await initDatabase()
    const { db } = await connectToDatabase()

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({
      $or: [
        { username: username },
        { email: email }
      ]
    })

    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.username === username 
          ? 'Username already exists' 
          : 'Email already registered'
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user object
    const user = {
      username,
      email,
      password: hashedPassword,
      profile,
      name,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Add profile-specific fields
    if (profile === 'student') {
      user.grade = grade
      user.studentId = studentId || `S${Date.now().toString().slice(-4)}`
      
      // Also create a student record
      const studentRecord = {
        name,
        email,
        studentId: user.studentId,
        grade: grade || 'Not specified',
        progress: 0,
        status: 'active',
        lastActivity: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await db.collection('students').insertOne(studentRecord)
    }

    // Insert user into database
    await db.collection('users').insertOne(user)

    res.status(201).json({ 
      success: true,
      message: 'Registration successful! You can now login.'
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
