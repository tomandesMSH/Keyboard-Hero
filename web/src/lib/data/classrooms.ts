import { supabase } from '../supabase'
import type { Assignment, Classroom } from './types'

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars (0/O, 1/I)

function generateCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  return code
}

export async function createClassroom(teacherId: string, name: string): Promise<Classroom> {
  const joinCode = generateCode()
  const { data, error } = await supabase
    .from('classrooms')
    .insert([{ teacher_id: teacherId, name, join_code: joinCode }])
    .select()
    .single()
  if (error) throw error
  return data as Classroom
}

export async function fetchTeacherClassrooms(teacherId: string): Promise<Classroom[]> {
  const { data, error } = await supabase
    .from('classrooms')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Classroom[]
}

export async function deleteClassroom(classroomId: string): Promise<void> {
  const { error } = await supabase.from('classrooms').delete().eq('id', classroomId)
  if (error) throw error
}

export async function fetchClassroomMemberIds(classroomId: string): Promise<string[]> {
  const { data, error } = await supabase.from('classroom_members').select('student_id').eq('classroom_id', classroomId)
  if (error) throw error
  return (data ?? []).map((row) => row.student_id as string)
}

// Which of this teacher's own classrooms a given student is a member of -
// used to scope "assign a task to this student" to a classroom they can
// actually see it in (assignments are always classroom-scoped).
export async function fetchStudentClassroomsForTeacher(teacherId: string, studentId: string): Promise<Classroom[]> {
  const teacherClassrooms = await fetchTeacherClassrooms(teacherId)
  if (teacherClassrooms.length === 0) return []
  const { data, error } = await supabase
    .from('classroom_members')
    .select('classroom_id')
    .eq('student_id', studentId)
    .in(
      'classroom_id',
      teacherClassrooms.map((c) => c.id),
    )
  if (error) throw error
  const memberOf = new Set((data ?? []).map((row) => row.classroom_id as string))
  return teacherClassrooms.filter((c) => memberOf.has(c.id))
}

export async function removeClassroomMember(classroomId: string, studentId: string): Promise<void> {
  const { error } = await supabase
    .from('classroom_members')
    .delete()
    .eq('classroom_id', classroomId)
    .eq('student_id', studentId)
  if (error) throw error
}

// A student never sees the roster (see 0009 migration) - only the
// classrooms they belong to.
export async function fetchStudentClassrooms(studentId: string): Promise<Classroom[]> {
  const { data, error } = await supabase
    .from('classrooms')
    .select('*, classroom_members!inner(student_id)')
    .eq('classroom_members.student_id', studentId)
  if (error) throw error
  return (data ?? []) as Classroom[]
}

export async function joinClassroom(code: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_classroom', { p_code: code.trim().toUpperCase() })
  if (error) throw error
  return data as string
}

export async function leaveClassroom(classroomId: string, studentId: string): Promise<void> {
  const { error } = await supabase
    .from('classroom_members')
    .delete()
    .eq('classroom_id', classroomId)
    .eq('student_id', studentId)
  if (error) throw error
}

export interface CreateAssignmentInput {
  classroomId: string
  teacherId: string
  title: string
  description: string
  // Omit or empty = whole classroom.
  recipientIds?: string[]
}

export async function createAssignment(input: CreateAssignmentInput): Promise<void> {
  const { data, error } = await supabase
    .from('assignments')
    .insert([
      {
        classroom_id: input.classroomId,
        teacher_id: input.teacherId,
        title: input.title,
        description: input.description || null,
      },
    ])
    .select()
    .single()
  if (error) throw error

  if (input.recipientIds && input.recipientIds.length > 0) {
    const { error: recipientsError } = await supabase
      .from('assignment_recipients')
      .insert(input.recipientIds.map((studentId) => ({ assignment_id: data.id, student_id: studentId })))
    if (recipientsError) throw recipientsError
  }
}

export async function fetchClassroomAssignments(classroomId: string): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('classroom_id', classroomId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Assignment[]
}

// RLS on the assignments table already only returns rows this student is
// meant to see (whole-classroom or individually targeted) - no client-side
// filtering needed here.
export async function fetchStudentAssignments(): Promise<Assignment[]> {
  const { data, error } = await supabase.from('assignments').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Assignment[]
}
