"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"

export function useTabParams(defaultTab = "overview") {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [currentTab, setCurrentTab] = useState(searchParams?.get("tab") || defaultTab)

  // Update the URL when the tab changes
  const setTab = useCallback(
    (tab: string) => {
      setCurrentTab(tab)

      if (typeof window !== "undefined") {
        const url = new URL(window.location.href)
        url.searchParams.set("tab", tab)
        window.history.replaceState({}, "", url.toString())
      }
    },
    [setCurrentTab],
  )

  // Update the tab state when the URL changes
  useEffect(() => {
    const tabFromUrl = searchParams?.get("tab")
    if (tabFromUrl && tabFromUrl !== currentTab) {
      setCurrentTab(tabFromUrl)
    }
  }, [searchParams, currentTab])

  return { currentTab, setTab }
}
