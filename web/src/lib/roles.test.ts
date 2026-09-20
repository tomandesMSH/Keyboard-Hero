import { describe, expect, it } from 'vitest'
import { isTeacherAdmin } from './roles'

describe('isTeacherAdmin', () => {
  it('is true for a teacher who also holds the moderator flag', () => {
    expect(isTeacherAdmin({ role: 'teacher', is_moderator: true })).toBe(true)
  })

  it('is false for a plain teacher', () => {
    expect(isTeacherAdmin({ role: 'teacher' })).toBe(false)
    expect(isTeacherAdmin({ role: 'teacher', is_moderator: false })).toBe(false)
  })

  it('is false for a dedicated admin (role moderator) and for students', () => {
    expect(isTeacherAdmin({ role: 'moderator' })).toBe(false)
    expect(isTeacherAdmin({ role: 'student', is_moderator: true })).toBe(false)
  })
})
