"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AttendanceData {
  date: string
  present: number
  absent: number
  late: number
}

interface AttendanceChartProps {
  data: AttendanceData[]
  title?: string
}

export function AttendanceChart({ data, title = "Attendance Overview" }: AttendanceChartProps) {
  const maxValue = Math.max(...data.map((d) => d.present + d.absent + d.late))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Daily attendance statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => {
            const total = item.present + item.absent + item.late
            const presentPercent = total > 0 ? (item.present / total) * 100 : 0
            const absentPercent = total > 0 ? (item.absent / total) * 100 : 0
            const latePercent = total > 0 ? (item.late / total) * 100 : 0

            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.date}</span>
                  <span className="text-muted-foreground">
                    {item.present}P / {item.absent}A / {item.late}L
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 flex overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: `${presentPercent}%` }} />
                  <div className="bg-red-500 h-full" style={{ width: `${absentPercent}%` }} />
                  <div className="bg-yellow-500 h-full" style={{ width: `${latePercent}%` }} />
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex justify-center space-x-6 mt-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
            Present
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
            Absent
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2" />
            Late
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
