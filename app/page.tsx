"use client"

import { useCallback, useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { getSupabaseBrowser } from "@/lib/supabaseClient"
import type { Project } from "@/lib/app"
import Landing from "./components/Landing"
import AuthScreen from "./components/AuthScreen"
import ProjectsScreen from "./components/ProjectsScreen"
import Workspace from "./components/Workspace"

export default function Home() {
  const supabase = getSupabaseBrowser()
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [activeProject, setActiveProject] = useState<Project | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecking(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (!s) {
        setActiveProject(null)
        setShowAuth(false)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [supabase])

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {})
      if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`)
      return fetch(url, { ...options, headers })
    },
    [session]
  )

  useEffect(() => {
    if (!session) {
      setCredits(null)
      return
    }
    authFetch("/api/credits")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.balance === "number") setCredits(d.balance)
      })
      .catch(() => {})
  }, [session, activeProject, authFetch])

  async function handleLogout() {
    await supabase.auth.signOut()
    setActiveProject(null)
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <span className="h-8 w-8 rounded-full border-2 border-neutral-700 border-t-white animate-spin" />
      </div>
    )
  }

  if (!session) {
    if (showAuth) return <AuthScreen onBack={() => setShowAuth(false)} />
    return <Landing onStart={() => setShowAuth(true)} />
  }

  if (!activeProject) {
    return (
      <ProjectsScreen
        session={session}
        credits={credits}
        authFetch={authFetch}
        onOpenProject={setActiveProject}
        onLogout={handleLogout}
      />
    )
  }

  return (
    <Workspace
      session={session}
      project={activeProject}
      onBackToProjects={() => setActiveProject(null)}
      onLogout={handleLogout}
    />
  )
}
