"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  {
    name: "T1",
    Rau: 400,
    "Gia súc": 240,
    "Gia cầm": 180,
    "Hải sản": 100,
  },
  {
    name: "T2",
    Rau: 420,
    "Gia súc": 250,
    "Gia cầm": 190,
    "Hải sản": 120,
  },
  {
    name: "T3",
    Rau: 450,
    "Gia súc": 260,
    "Gia cầm": 200,
    "Hải sản": 130,
  },
  {
    name: "T4",
    Rau: 480,
    "Gia súc": 280,
    "Gia cầm": 210,
    "Hải sản": 140,
  },
  {
    name: "T5",
    Rau: 520,
    "Gia súc": 290,
    "Gia cầm": 220,
    "Hải sản": 150,
  },
  {
    name: "T6",
    Rau: 550,
    "Gia súc": 300,
    "Gia cầm": 230,
    "Hải sản": 160,
  },
]

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}kg`}
        />
        <Tooltip />
        <Bar dataKey="Rau" fill="#4ade80" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Gia súc" fill="#f97316" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Gia cầm" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Hải sản" fill="#ec4899" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
