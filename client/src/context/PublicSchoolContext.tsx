import React, { createContext, useContext, ReactNode, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DEMO_SCHOOL_SLUG } from '../constants/demoSchool'

type PublicSchoolContextValue = {
  slug: string
  query: { school: string }
}

const PublicSchoolContext = createContext<PublicSchoolContextValue>({
  slug: DEMO_SCHOOL_SLUG,
  query: { school: DEMO_SCHOOL_SLUG },
})

export function PublicSchoolProvider({ children }: { children: ReactNode }) {
  const [params] = useSearchParams()
  const slug = params.get('school')?.trim().toLowerCase() || DEMO_SCHOOL_SLUG
  const value = useMemo(() => ({ slug, query: { school: slug } }), [slug])

  return (
    <PublicSchoolContext.Provider value={value}>
      {children}
    </PublicSchoolContext.Provider>
  )
}

export function usePublicSchool() {
  return useContext(PublicSchoolContext)
}
