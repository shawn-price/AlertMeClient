"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
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
 * 
 * Mobile improvements:
 * - Detects mobile devices and adjusts dropdown positioning
 * - Handles keyboard viewport changes
 * - Uses pointer events for better touch support
 * - Portal-based rendering to prevent clipping
 * - Larger touch targets on mobile (44x44px minimum)
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
    const [isMobile, setIsMobile] = useState(false)
    const [keyboardOpen, setKeyboardOpen] = useState(false)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    // Detect mobile device and setup keyboard listeners
    useEffect(() => {
      const checkMobile = () => {
        const isMobileDevice = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
        const isTouchDevice = window.matchMedia("(hover: none) and (pointer: coarse)").matches
        setIsMobile(isMobileDevice || isTouchDevice)
      }

      checkMobile()
      window.addEventListener("resize", checkMobile)

      return () => window.removeEventListener("resize", checkMobile)
    }, [])

    // Detect keyboard visibility changes on mobile
    useEffect(() => {
      if (!isMobile) return

      const handleVisualViewportChange = () => {
        if (!window.visualViewport) return
        
        const windowHeight = window.innerHeight
        const viewportHeight = window.visualViewport.height
        const keyboardHeight = windowHeight - viewportHeight

        // Keyboard is open if viewport height is significantly smaller than window height
        setKeyboardOpen(keyboardHeight > 100)
      }

      window.visualViewport?.addEventListener("resize", handleVisualViewportChange)

      return () => {
        window.visualViewport?.removeEventListener("resize", handleVisualViewportChange)
      }
    }, [isMobile])

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

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
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
    }, [filteredOptions, highlightedIndex])

    const handleSelectOption = useCallback((selectedValue: string) => {
      onValueChange(selectedValue)
      setSearch("")
      setOpen(false)
    }, [onValueChange])

    // Handle touch events for better mobile UX
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
      // Prevent default touch behavior that might interfere with scrolling
      if (contentRef.current && contentRef.current.contains(e.currentTarget)) {
        e.preventDefault()
      }
    }, [])

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
      // Ensure pointer events work correctly after touch
      if (contentRef.current && contentRef.current.contains(e.currentTarget)) {
        e.preventDefault()
      }
    }, [])

    const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder

    return (
      <div className="relative">
        <div className="relative">
          <Select value={value} onValueChange={handleSelectOption} open={open} onOpenChange={setOpen}>
            <SelectTrigger
              ref={(element) => {
                if (element) {
                  triggerRef.current = element
                  if (typeof ref === "function") ref(element)
                  else if (ref) ref.current = element
                }
              }}
              className={cn(
                "bg-white cursor-pointer",
                // Mobile touch target optimization
                isMobile && "h-11 sm:h-10",
                disabled && "opacity-50 cursor-not-allowed",
                className
              )}
              disabled={disabled}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>

            <SelectContent 
              className={cn(
                "p-0",
                maxHeight,
                // Mobile optimizations
                isMobile && "max-h-64",
                // Add extra bottom padding on mobile when keyboard is open to prevent cutoff
                isMobile && keyboardOpen && "mb-4"
              )}
            >
              {/* Search Input - Mobile optimized */}
              <div className="sticky top-0 z-10 bg-white border-b p-2">
                <Input
                  ref={searchInputRef}
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  className={cn(
                    "text-sm",
                    // Mobile optimized input height and font size
                    isMobile ? "h-11 text-base" : "h-9"
                  )}
                  autoComplete="off"
                />
                {search && (
                  <div className="text-xs text-gray-500 mt-1">
                    Found {filteredOptions.length} of {options.length}
                  </div>
                )}
              </div>

              {/* Options List - Mobile optimized */}
              {filteredOptions.length > 0 ? (
                <div 
                  ref={contentRef}
                  className="overflow-y-auto"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  {filteredOptions.map((option, index) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className={cn(
                        "cursor-pointer transition-colors",
                        // Mobile touch target optimization (44x44px minimum recommended)
                        isMobile && "py-3 pl-3 pr-2",
                        index === highlightedIndex && "bg-blue-50"
                      )}
                      onClick={() => handleSelectOption(option.value)}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </div>
              ) : (
                <div className={cn(
                  "text-center text-sm text-gray-500",
                  isMobile ? "py-12" : "py-8"
                )}>
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
