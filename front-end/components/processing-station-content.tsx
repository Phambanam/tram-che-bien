"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, Utensils, Fish, Beef, Wheat, Droplets } from "lucide-react"
import { TofuProcessing, BeanSproutsProcessing, SaltProcessing, SausageProcessing, LivestockProcessing, LttpManagement } from "@/components/processing-station"

export function ProcessingStationContent() {
  const [activeSection, setActiveSection] = useState("tofu")

  const sections = [
    { id: "tofu", name: "Chế biến đậu phụ", icon: Package, color: "bg-green-100 text-green-800" },
    { id: "sausage", name: "Làm giò chả", icon: Utensils, color: "bg-orange-100 text-orange-800" },
    { id: "sprouts", name: "Giá đỗ", icon: Wheat, color: "bg-yellow-100 text-yellow-800" },
    { id: "salt", name: "Muối nén", icon: Droplets, color: "bg-blue-100 text-blue-800" },
    { id: "livestock", name: "Giết mổ lợn", icon: Beef, color: "bg-red-100 text-red-800" },
    { id: "seafood", name: "Gia cầm, hải sản", icon: Fish, color: "bg-purple-100 text-purple-800" },
    { id: "lttp", name: "Quản lý LTTP", icon: Package, color: "bg-indigo-100 text-indigo-800" },
  ]

  const renderActiveSection = () => {
    switch (activeSection) {
      case "tofu":
        return <TofuProcessing />
      case "sprouts":
        return <BeanSproutsProcessing />
      case "salt":
        return <SaltProcessing />
      case "sausage":
        return <SausageProcessing />
      case "livestock":
        return <LivestockProcessing />
      case "lttp":
        return <LttpManagement />
      default:
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chức năng đang được phát triển
            </h3>
            <p className="text-gray-500">
              Tính năng "{sections.find(s => s.id === activeSection)?.name}" sẽ được cập nhật trong phiên bản tiếp theo.
            </p>
          </div>
        )
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h1 className="text-3xl font-bold text-center text-[#b45f06] mb-2">
            TRẠM CHẾ BIẾN
          </h1>
          <p className="text-center text-gray-600">
            Quản lý chế biến và sản xuất thực phẩm
          </p>
        </div>

        {/* Section Navigation */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              const isImplemented = ["tofu", "sprouts", "salt", "sausage", "livestock", "lttp"].includes(section.id)
              
              return (
                <Button
                  key={section.id}
                  variant={isActive ? "default" : "outline"}
                  className={`h-20 flex flex-col items-center justify-center gap-2 ${
                    !isImplemented ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={() => isImplemented && setActiveSection(section.id)}
                  disabled={!isImplemented}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs text-center">{section.name}</span>
                  {!isImplemented && (
                    <Badge variant="secondary" className="text-xs">
                      Sắp có
                    </Badge>
                  )}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  )
} 