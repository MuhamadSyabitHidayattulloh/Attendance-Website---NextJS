"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, BookOpen, Users, CheckCircle, XCircle, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { AttendanceChart } from "@/components/charts/attendance-chart"
import { getCurrentUser } from "@/lib/auth"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface Class {
  id: string
  name: string
  description: string
  student_count: number
}

interface Student {
  id: string
  name: string
  email: string
  status?: "present" | "absent" | "late"
}

interface AttendanceRecord {
  student_id: string
  student_name: string
  date: string
  status: string
}

export default function TeacherDashboard() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [students, setStudents] = useState<Student[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    getCurrentUser().then((user) => {
      setCurrentUser(user)
      if (user) {
        fetchTeacherClasses(user.id)
      }
    })
  }, [])

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents(selectedClass)
      fetchAttendanceForDate(selectedClass, selectedDate)
    }
  }, [selectedClass, selectedDate])

  const fetchTeacherClasses = async (teacherId: string) => {
    try {
      const { data } = await supabase
        .from("classes")
        .select(`
          *,
          student_classes(count)
        `)
        .eq("teacher_id", teacherId)

      if (data) {
        const formattedClasses = data.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          student_count: c.student_classes?.length || 0,
        }))
        setClasses(formattedClasses)
        if (formattedClasses.length > 0) {
          setSelectedClass(formattedClasses[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching classes:", error)
    }
  }

  const fetchClassStudents = async (classId: string) => {
    try {
      const { data } = await supabase
        .from("student_classes")
        .select(`
          student_id,
          users!student_classes_student_id_fkey(id, name, email)
        `)
        .eq("class_id", classId)

      if (data) {
        const formattedStudents = data.map((sc) => ({
          id: sc.users.id,
          name: sc.users.name,
          email: sc.users.email,
        }))
        setStudents(formattedStudents)
      }
    } catch (error) {
      console.error("Error fetching students:", error)
    }
  }

  const fetchAttendanceForDate = async (classId: string, date: Date) => {
    try {
      const dateStr = format(date, "yyyy-MM-dd")
      const { data } = await supabase
        .from("attendance")
        .select(`
          student_id,
          status,
          users!attendance_student_id_fkey(name)
        `)
        .eq("class_id", classId)
        .eq("date", dateStr)

      if (data) {
        const records = data.map((a) => ({
          student_id: a.student_id,
          student_name: a.users.name,
          date: dateStr,
          status: a.status,
        }))
        setAttendanceRecords(records)

        // Update students with their attendance status
        setStudents((prev) =>
          prev.map((student) => {
            const record = records.find((r) => r.student_id === student.id)
            return {
              ...student,
              status: record?.status as "present" | "absent" | "late" | undefined,
            }
          }),
        )
      } else {
        // No attendance records for this date, reset status
        setStudents((prev) => prev.map((student) => ({ ...student, status: undefined })))
      }
    } catch (error) {
      console.error("Error fetching attendance:", error)
    }
  }

  const markAttendance = async (studentId: string, status: "present" | "absent" | "late") => {
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd")

      const { error } = await supabase.from("attendance").upsert({
        student_id: studentId,
        class_id: selectedClass,
        date: dateStr,
        status: status,
        recorded_by: currentUser?.id,
      })

      if (error) throw error

      // Update local state
      setStudents((prev) => prev.map((student) => (student.id === studentId ? { ...student, status } : student)))

      toast({
        title: "Success",
        description: "Attendance marked successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "absent":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "late":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-100 text-green-800">Present</Badge>
      case "absent":
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>
      case "late":
        return <Badge className="bg-yellow-100 text-yellow-800">Late</Badge>
      default:
        return <Badge variant="outline">Not Marked</Badge>
    }
  }

  const mockAttendanceData = [
    { date: "2024-01-15", present: 28, absent: 3, late: 2 },
    { date: "2024-01-16", present: 30, absent: 2, late: 1 },
    { date: "2024-01-17", present: 27, absent: 4, late: 2 },
    { date: "2024-01-18", present: 31, absent: 1, late: 1 },
    { date: "2024-01-19", present: 29, absent: 2, late: 2 },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600">Manage attendance for your classes</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classes.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classes.reduce((sum, c) => sum + c.student_count, 0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {students.filter((s) => s.status === "present").length}/{students.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <AttendanceChart data={mockAttendanceData} title="Class Attendance Trends" />

          <Card>
            <CardHeader>
              <CardTitle>Attendance Controls</CardTitle>
              <CardDescription>Select class and date to mark attendance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select Class</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Select Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Table */}
        {selectedClass && (
          <Card>
            <CardHeader>
              <CardTitle>Mark Attendance</CardTitle>
              <CardDescription>
                {classes.find((c) => c.id === selectedClass)?.name} - {format(selectedDate, "PPP")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {getStatusIcon(student.status)}
                          <span className="ml-2">{student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{getStatusBadge(student.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant={student.status === "present" ? "default" : "outline"}
                            onClick={() => markAttendance(student.id, "present")}
                          >
                            Present
                          </Button>
                          <Button
                            size="sm"
                            variant={student.status === "absent" ? "destructive" : "outline"}
                            onClick={() => markAttendance(student.id, "absent")}
                          >
                            Absent
                          </Button>
                          <Button
                            size="sm"
                            variant={student.status === "late" ? "secondary" : "outline"}
                            onClick={() => markAttendance(student.id, "late")}
                          >
                            Late
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
