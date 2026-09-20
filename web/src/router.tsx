import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Login } from './screens/Login'
import { ChoosePanel } from './screens/ChoosePanel'
import { StudentDashboard } from './screens/student/Dashboard'
import { Lessons } from './screens/student/Lessons'
import { Recording } from './screens/student/Recording'
import { Feedback } from './screens/student/Feedback'
import { Profile } from './screens/student/Profile'
import { TeacherDashboard } from './screens/teacher/Dashboard'
import { Students } from './screens/teacher/Students'
import { Grading } from './screens/teacher/Grading'
import { Classrooms } from './screens/teacher/Classrooms'
import { Profile as TeacherProfile } from './screens/teacher/Profile'
import { Queue } from './screens/moderator/Queue'
import { RequireRole } from './components/routing/RequireRole'
import { RequireModerator } from './components/routing/RequireModerator'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <Login /> },
  { path: '/panel', element: <ChoosePanel /> },
  {
    path: '/student',
    element: (
      <RequireRole role="student">
        <StudentDashboard />
      </RequireRole>
    ),
  },
  {
    path: '/student/lessons',
    element: (
      <RequireRole role="student">
        <Lessons />
      </RequireRole>
    ),
  },
  {
    path: '/student/recording',
    element: (
      <RequireRole role="student">
        <Recording />
      </RequireRole>
    ),
  },
  {
    path: '/student/feedback',
    element: (
      <RequireRole role="student">
        <Feedback />
      </RequireRole>
    ),
  },
  {
    path: '/student/profile',
    element: (
      <RequireRole role="student">
        <Profile />
      </RequireRole>
    ),
  },
  {
    path: '/teacher',
    element: (
      <RequireRole role="teacher">
        <TeacherDashboard />
      </RequireRole>
    ),
  },
  {
    path: '/teacher/students',
    element: (
      <RequireRole role="teacher">
        <Students />
      </RequireRole>
    ),
  },
  {
    path: '/teacher/grading',
    element: (
      <RequireRole role="teacher">
        <Grading />
      </RequireRole>
    ),
  },
  {
    path: '/teacher/classrooms',
    element: (
      <RequireRole role="teacher">
        <Classrooms />
      </RequireRole>
    ),
  },
  {
    path: '/teacher/profile',
    element: (
      <RequireRole role="teacher">
        <TeacherProfile />
      </RequireRole>
    ),
  },
  {
    path: '/moderator',
    element: (
      <RequireModerator>
        <Queue />
      </RequireModerator>
    ),
  },
])
