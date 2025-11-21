import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI
const MONGODB_DB = process.env.MONGODB_DB || 'student-tracker'

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  )
}

let cached = global.mongo

if (!cached) {
  cached = global.mongo = { conn: null, promise: null }
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }

    cached.promise = MongoClient.connect(MONGODB_URI, opts).then((client) => {
      return {
        client,
        db: client.db(MONGODB_DB),
      }
    })
  }
  cached.conn = await cached.promise
  return cached.conn
}

// Initialize database with sample data
export async function initDatabase() {
  try {
    const { db } = await connectToDatabase()
    
    // Create collections if they don't exist
    const collections = ['users', 'students', 'tasks', 'resources']
    
    for (const collectionName of collections) {
      const collectionExists = await db.listCollections({ name: collectionName }).hasNext()
      if (!collectionExists) {
        await db.createCollection(collectionName)
        console.log(`Created collection: ${collectionName}`)
      }
    }

    // Create indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true })
    await db.collection('users').createIndex({ username: 1 }, { unique: true })
    await db.collection('students').createIndex({ studentId: 1 }, { unique: true })
    await db.collection('tasks').createIndex({ assignedTo: 1 })

    // Check if we need to insert sample data
    const userCount = await db.collection('users').countDocuments()
    
    if (userCount === 0) {
      console.log('Inserting sample data...')
      
      // Insert sample teacher
      const bcrypt = await import('bcryptjs')
      const hashedTeacherPassword = await bcrypt.hash('teacher123', 12)
      
      await db.collection('users').insertOne({
        username: 'teacher',
        email: 'teacher@school.edu',
        password: hashedTeacherPassword,
        profile: 'teacher',
        name: 'John Doe',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Insert sample student
      const hashedStudentPassword = await bcrypt.hash('student123', 12)
      await db.collection('users').insertOne({
        username: 'student',
        email: 'student@school.edu',
        password: hashedStudentPassword,
        profile: 'student',
        name: 'Emma Johnson',
        studentId: 'S001',
        grade: '10th Grade',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Insert sample students
      await db.collection('students').insertMany([
        {
          name: 'Emma Johnson',
          email: 'emma.johnson@school.edu',
          studentId: 'S001',
          grade: '10th Grade',
          progress: 92,
          status: 'active',
          lastActivity: new Date('2023-11-15'),
          parentEmail: 'parent.johnson@email.com',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Michael Brown',
          email: 'michael.brown@school.edu',
          studentId: 'S002',
          grade: '9th Grade',
          progress: 78,
          status: 'active',
          lastActivity: new Date('2023-11-14'),
          parentEmail: 'parent.brown@email.com',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Sophia Williams',
          email: 'sophia.williams@school.edu',
          studentId: 'S003',
          grade: '10th Grade',
          progress: 85,
          status: 'active',
          lastActivity: new Date('2023-11-13'),
          parentEmail: 'parent.williams@email.com',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ])

      // Insert sample tasks
      await db.collection('tasks').insertMany([
        {
          title: 'Algebra Homework',
          subject: 'Mathematics',
          description: 'Complete exercises 1-10 from chapter 5',
          dueDate: new Date('2023-11-20'),
          assignedTo: ['S001', 'S002', 'S003'],
          status: 'active',
          createdAt: new Date(),
          createdBy: 'teacher'
        },
        {
          title: 'Science Experiment Report',
          subject: 'Science',
          description: 'Write a report on the chemistry lab experiment',
          dueDate: new Date('2023-11-25'),
          assignedTo: ['S001', 'S003'],
          status: 'active',
          createdAt: new Date(),
          createdBy: 'teacher'
        }
      ])

      console.log('Sample data inserted successfully!')
    }

    return db
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
}
