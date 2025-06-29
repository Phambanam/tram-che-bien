"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, Utensils, Fish, Beef, Wheat, Droplets, Sprout, Ham, Bird, Calculator } from "lucide-react"
import { TofuProcessing, BeanSproutsProcessing, SaltProcessing, SausageProcessing, LivestockProcessing, PoultryProcessing, LttpManagement, RevenuePlanning } from "@/components/processing-station"

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
    { id: "revenue-planning", name: "Hoạch toán thu chi", icon: Calculator, color: "bg-purple-100 text-purple-800" },
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
      case "seafood":
        return <PoultryProcessing />
      case "lttp":
        return <LttpManagement />
      case "revenue-planning":
        return <RevenuePlanning />
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

        {/* Section Navigation */}
        <div className="p-4 border-b bg-gradient-to-r from-slate-50 to-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              const isImplemented = ["tofu", "sprouts", "salt", "sausage", "livestock", "seafood", "lttp", "revenue-planning"].includes(section.id)
              
              return (
                <button
                  key={section.id}
                  className={`
                    relative group p-3 rounded-lg transition-all duration-300 ease-in-out
                    flex flex-col items-center justify-center gap-1.5
                    text-sm font-medium border border-transparent
                    ${isActive 
                      ? 'bg-gradient-to-b from-slate-700 to-slate-800 text-white shadow-lg transform scale-105' 
                      : 'bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-200 hover:shadow-md hover:scale-102'
                    }
                    ${!isImplemented ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  `}
                  onClick={() => isImplemented && setActiveSection(section.id)}
                  disabled={!isImplemented}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`} />
                  <span className={`text-xs text-center leading-tight ${isActive ? 'text-white font-semibold' : 'text-slate-600 group-hover:text-slate-800'}`}>
                    {section.name}
                  </span>
                  {!isImplemented && (
                    <div className="absolute -top-1 -right-1 bg-orange-400 text-white text-[10px] px-1 py-0.5 rounded-full">
                      ⏳
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-white rounded-full"></div>
                  )}
                </button>
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