"use client"

import * as React from "react"

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

export function Switch({ checked, onCheckedChange, className = "", ...props }: SwitchProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCheckedChange?.(e.target.checked)
  }

  return (
    <label className="flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked as boolean}
        onChange={handleChange}
        className="sr-only"
        {...props}
      />
      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-blue-500" : "bg-gray-300"
      }`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-1"
        }`} />
      </div>
    </label>
  )
}
