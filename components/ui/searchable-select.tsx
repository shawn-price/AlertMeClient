"use client"

import React, { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { X } from "@/components/ui/iconify-compat"

export interface SearchableSelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  searchPlaceholder?: string
  maxHeight?: string
  disabled?: boolean
}

/**
 * Searchable Select Component with type-to-filter capability
 * Users can type letters to filter options and select with enter/click
 */
export const SearchableSelect = React.forwardRef<HTMLButtonElement, SearchableSelectProps>(
  (
    {
      options,
      value,
      onValueChange,
      placeholder = "Select option",
      className,
      searchPlaceholder = "Search...",
      maxHeight = "max-h-60",
      disabled = false,
    },
    ref
  ) => {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [filteredOptions, setFilteredOptions] = useState(options)
    const [highlightedIndex, setHighlightedIndex] = useState(0)
    const searchInputRef = useRef<HTMLInputElement>(null)

    // Filter options based on search input
    useEffect(() => {
      if (!search) {
        setFilteredOptions(options)
        setHighlightedIndex(0)
      } else {
        const filtered = options.filter((opt) =>
          opt.label.toLowerCase().includes(search.toLowerCase()) ||
          opt.value.toLowerCase().includes(search.toLowerCase())
        )
        setFilteredOptions(filtered)
        setHighlightedIndex(0)
      }
    }, [search, options])

    // Auto-focus search input when dropdown opens
    useEffect(() => {
      if (open) {
        setTimeout(() => searchInputRef.current?.focus(), 0)
      }
    }, [open])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          )
          break
        case "ArrowUp":
          e.preventDefault()
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
          break
        case "Enter":
          e.preventDefault()
          if (filteredOptions[highlightedIndex]) {
            handleSelectOption(filteredOptions[highlightedIndex].value)
          }
          break
        case "Escape":
          e.preventDefault()
          setOpen(false)
          break
      }
    }

    const handleSelectOption = (selectedValue: string) => {
      onValueChange(selectedValue)
      setSearch("")
      setOpen(false)
    }

    const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder

    return (
      <div className="relative">
        <div className="relative">
          <Select value={value} onValueChange={handleSelectOption} open={open} onOpenChange={setOpen}>
            <SelectTrigger
              ref={ref}
              className={cn(
                "bg-white cursor-pointer",
                disabled && "opacity-50 cursor-not-allowed",
                className
              )}
              disabled={disabled}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>

            <SelectContent className={cn("p-0", maxHeight)}>
              {/* Search Input */}
              <div className="sticky top-0 z-10 bg-white border-b p-2">
                <Input
                  ref={searchInputRef}
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-9 text-sm"
                  autoComplete="off"
                />
                {search && (
                  <div className="text-xs text-gray-500 mt-1">
                    Found {filteredOptions.length} of {options.length}
                  </div>
                )}
              </div>

              {/* Options List */}
              {filteredOptions.length > 0 ? (
                <div className="overflow-y-auto">
                  {filteredOptions.map((option, index) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className={cn(
                        "cursor-pointer",
                        index === highlightedIndex && "bg-blue-50"
                      )}
                      onClick={() => handleSelectOption(option.value)}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-gray-500">
                  No options found
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }
)

SearchableSelect.displayName = "SearchableSelect"
