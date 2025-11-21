import { connectToDatabase, initDatabase } from '../../../lib/mongodb'
import { authenticateUser } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Authenticate user
    const user = await authenticateUser(req)
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // Initialize database
    await initDatabase()
    const { db } = await connectToDatabase()

    // Get dashboard data
    const students = await db.collection('students').find({}).toArray()
    const tasks = await db.collection('tasks').find({}).toArray()
    const resources = await db.collection('resources').find({}).toArray()

    const stats = {
      totalStudents: students.length,
      activeTasks: tasks.filter(t => t.status === 'active').length,
      totalResources: resources.length,
      averageProgress: students.length > 0 
        ? Math.round(students.reduce((acc, student) => acc + (student.progress || 0), 0) / students.length)
        : 0
    }

    // Get recent activity (last 5 tasks)
    const recentActivity = tasks.slice(0, 5).map(task => {
      const assignedStudents = students.filter(s => task.assignedTo.includes(s.studentId))
      return {
        studentName: assignedStudents.length > 0 
          ? assignedStudents.map(s => s.name).join(', ')
          : 'No students assigned',
        taskName: task.title,
        status: task.status,
        dueDate: task.dueDate
      }
    })

    res.status(200).json({ stats, recentActivity })

  } catch (error) {
    console.error('Dashboard API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
