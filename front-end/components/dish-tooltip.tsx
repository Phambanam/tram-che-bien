"use client"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Ingredient {
  lttpId: string
  lttpName: string
  quantity: number
  unit: string
  category?: string
  notes?: string
}

interface Dish {
  _id: string
  name: string
  description?: string
  mainLTTP?: {
    lttpId: string
    lttpName: string
    category: string
  }
  ingredients: Ingredient[] | string
  servings: number
  preparationTime?: number
  difficulty?: string
  category?: string
}

interface DishTooltipProps {
  dish: Dish
  children: React.ReactNode
  disabled?: boolean
}

export function DishTooltip({ dish, children, disabled = false }: DishTooltipProps) {
  if (disabled) {
    return <>{children}</>
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-4" side="top">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-base">{dish.name}</h4>
              {dish.description && (
                <p className="text-sm text-gray-600 mt-1">{dish.description}</p>
              )}
            </div>
            
            {dish.mainLTTP && (
              <div>
                <p className="text-sm font-medium text-blue-600">
                  🥘 Nguyên liệu chính: {dish.mainLTTP.lttpName}
                </p>
                {dish.mainLTTP.category && (
                  <p className="text-xs text-gray-500">Loại: {dish.mainLTTP.category}</p>
                )}
              </div>
            )}

            {dish.ingredients && (
              <div>
                <p className="text-sm font-medium mb-2">🧄 Nguyên liệu:</p>
                <div className="text-xs text-gray-600">
                  {typeof dish.ingredients === 'string' ? (
                    // Handle string ingredients (from seed data)
                    <p>{dish.ingredients}</p>
                  ) : Array.isArray(dish.ingredients) && dish.ingredients.length > 0 ? (
                    // Handle array ingredients (structured data)
                    <ul className="space-y-1">
                      {dish.ingredients.slice(0, 5).map((ingredient, index) => (
                        <li key={index} className="flex justify-between">
                          <span>{ingredient.lttpName}</span>
                          <span className="text-gray-500">
                            {ingredient.quantity} {ingredient.unit}
                          </span>
                        </li>
                      ))}
                      {dish.ingredients.length > 5 && (
                        <li className="text-gray-500 italic">
                          ... và {dish.ingredients.length - 5} nguyên liệu khác
                        </li>
                      )}
                    </ul>
                  ) : null}
                </div>
              </div>
            )}

            <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
              <span>👥 {dish.servings} suất</span>
              {dish.preparationTime && (
                <span>⏱️ {dish.preparationTime} phút</span>
              )}
              {dish.difficulty && (
                <span>📊 {dish.difficulty}</span>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 