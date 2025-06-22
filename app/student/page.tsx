"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, TrendingUp, CheckCircle, XCircle, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { AttendanceChart } from "@/components/charts/attendance-chart"
import { getCurrentUser } from "@/lib/auth"

interface Class {
  id: string
  name: string
  description: string
  teacher_name: string
}

interface AttendanceRecord {
  id: string
  date: string
  status: string
  class_name: string
  teacher_name: string
}

interface AttendanceStats {
  totalClasses: number
  presentCount: number
  absentCount: number
  lateCount: number
  attendanceRate: number
}

export default function StudentDashboard() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<AttendanceStats>({
    totalClasses: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    attendanceRate: 0,
  })
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    getCurrentUser().then((user) => {
      setCurrentUser(user)
      if (user) {
        fetchStudentClasses(user.id)
        fetchAttendanceRecords(user.id)
      }
    })
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchAttendanceRecords(currentUser.id, selectedClass === "all" ? undefined : selectedClass)
    }
  }, [selectedClass, currentUser])

  const fetchStudentClasses = async (studentId: string) => {
    try {
      const { data } = await supabase
        .from("student_classes")
        .select(`
          class_id,
          classes!student_classes_class_id_fkey(
            id,
            name,
            description,
            users!classes_teacher_id_fkey(name)
          )
        `)
        .eq("student_id", studentId)

      if (data) {
        const formattedClasses = data.map((sc) => ({
          id: sc.classes.id,
          name: sc.classes.name,
          description: sc.classes.description,
          teacher_name: sc.classes.users?.name || "Unknown",
        }))
        setClasses(formattedClasses)
      }
    } catch (error) {
      console.error("Error fetching classes:", error)
    }
  }

  const fetchAttendanceRecords = async (studentId: string, classId?: string) => {
    try {
      let query = supabase
        .from("attendance")
        .select(`
          id,
          date,
          status,
          classes!attendance_class_id_fkey(
            name,
            users!classes_teacher_id_fkey(name)
          )
        `)
        .eq("student_id", studentId)
        .order("date", { ascending: false })

      if (classId) {
        query = query.eq("class_id", classId)
      }

      const { data } = await query

      if (data) {
        const formattedRecords = data.map((a) => ({
          id: a.id,
          date: a.date,
          status: a.status,
          class_name: a.classes.name,
          teacher_name: a.classes.users?.name || "Unknown",
        }))
        setAttendanceRecords(formattedRecords)
        calculateStats(formattedRecords)
      }
    } catch (error) {
      console.error("Error fetching attendance records:", error)
    }
  }

  const calculateStats = (records: AttendanceRecord[]) => {
    const totalClasses = records.length
    const presentCount = records.filter((r) => r.status === "present").length
    const absentCount = records.filter((r) => r.status === "absent").length
    const lateCount = records.filter((r) => r.status === "late").length
    const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0

    setStats({
      totalClasses,
      presentCount,
      absentCount,
      lateCount,
      attendanceRate,
    })
  }

  const getStatusIcon = (status: string) => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-100 text-green-800">Present</Badge>
      case "absent":
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>
      case "late":
        return <Badge className="bg-yellow-100 text-yellow-800">Late</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  // Generate chart data from attendance records
  const generateChartData = () => {
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      const dayRecords = attendanceRecords.filter((r) => r.date === dateStr)
      const present = dayRecords.filter((r) => r.status === "present").length
      const absent = dayRecords.filter((r) => r.status === "absent").length
      const late = dayRecords.filter((r) => r.status === "late").length

      last7Days.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        present,
        absent,
        late,
      })
    }
    return last7Days
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600">View your attendance records and statistics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.presentCount} of {stats.totalClasses} classes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.presentCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.absentCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.lateCount}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <AttendanceChart data={generateChartData()} title="My Attendance Trends" />

          <Card>
            <CardHeader>
              <CardTitle>My Classes</CardTitle>
              <CardDescription>Classes you are enrolled in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classes.map((classItem) => (
                  <div key={classItem.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{classItem.name}</div>
                      <div className="text-sm text-muted-foreground">Teacher: {classItem.teacher_name}</div>
                    </div>
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
            <CardDescription>Your complete attendance record</CardDescription>
            <div className="flex items-center space-x-2">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {new Date(record.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="font-medium">{record.class_name}</TableCell>
                    <TableCell>{record.teacher_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getStatusIcon(record.status)}
                        <span className="ml-2">{getStatusBadge(record.status)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {attendanceRecords.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No attendance records found</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
