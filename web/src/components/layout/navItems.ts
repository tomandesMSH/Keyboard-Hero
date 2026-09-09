export interface NavItem {
  to: string
  label: string
  icon: string
  isActive: (pathname: string, tab: string | null) => boolean
}

export const STUDENT_NAV_ITEMS: NavItem[] = [
  { to: '/student', label: 'Dashboard', icon: '🏠', isActive: (p) => p === '/student' },
  { to: '/student/lessons', label: 'Lekce', icon: '📋', isActive: (p) => p === '/student/lessons' },
  { to: '/student/feedback', label: 'Nahrávky', icon: '🎧', isActive: (p) => p === '/student/feedback' },
  { to: '/student/profile', label: 'Profil', icon: '👤', isActive: (p) => p === '/student/profile' },
]

export const TEACHER_NAV_ITEMS: NavItem[] = [
  { to: '/teacher', label: 'Dashboard', icon: '🏠', isActive: (p) => p === '/teacher' },
  { to: '/teacher/students', label: 'Žáci', icon: '👥', isActive: (p) => p === '/teacher/students' },
  { to: '/teacher/classrooms', label: 'Učebny', icon: '🏫', isActive: (p) => p === '/teacher/classrooms' },
  { to: '/teacher/profile', label: 'Profil', icon: '👤', isActive: (p) => p === '/teacher/profile' },
]

export function navItemsFor(role: 'student' | 'teacher'): NavItem[] {
  return role === 'student' ? STUDENT_NAV_ITEMS : TEACHER_NAV_ITEMS
}
