import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Login } from './screens/Login'
import { StudentDashboard } from './screens/student/Dashboard'
import { Lessons } from './screens/student/Lessons'
import { Recording } from './screens/student/Recording'
import { Profile } from './screens/student/Profile'
import { TeacherDashboard } from './screens/teacher/Dashboard'
import { Students } from './screens/teacher/Students'
import { LessonLibrary } from './screens/teacher/LessonLibrary'
import { Grading } from './screens/teacher/Grading'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <Login /> },
  { path: '/student', element: <StudentDashboard /> },
  { path: '/student/lessons', element: <Lessons /> },
  { path: '/student/recording', element: <Recording /> },
  { path: '/student/profile', element: <Profile /> },
  { path: '/teacher', element: <TeacherDashboard /> },
  { path: '/teacher/students', element: <Students /> },
  { path: '/teacher/library', element: <LessonLibrary /> },
  { path: '/teacher/grading', element: <Grading /> },
])
