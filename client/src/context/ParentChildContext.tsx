import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { parentApi } from '../api/client'



const STORAGE_KEY = 'parent_selected_child'



type Child = { id: string; name: string; class_name?: string; student_number?: string }



type Ctx = {

  children: Child[]

  selectedChildId: string | null

  setSelectedChildId: (id: string) => void

  childParams: { childId?: string }

  isLoading: boolean

  isReady: boolean

}



const ParentChildContext = createContext<Ctx>({

  children: [],

  selectedChildId: null,

  setSelectedChildId: () => {},

  childParams: {},

  isLoading: true,

  isReady: false,

})



export function ParentChildProvider({ children: nodes }: { children: React.ReactNode }) {

  const qc = useQueryClient()

  const { data, isLoading } = useQuery({

    queryKey: ['parent-children'],

    queryFn: () => parentApi.children().then(r => r.data),

  })

  const list: Child[] = data?.children || []

  const [selectedChildId, setSelectedChildIdState] = useState<string | null>(

    () => localStorage.getItem(STORAGE_KEY)

  )



  const effectiveChildId = useMemo(() => {

    if (!list.length) return null

    if (selectedChildId && list.some(c => c.id === selectedChildId)) return selectedChildId

    return list[0].id

  }, [list, selectedChildId])



  useEffect(() => {

    if (!effectiveChildId) return

    if (selectedChildId !== effectiveChildId) {

      setSelectedChildIdState(effectiveChildId)

    }

    localStorage.setItem(STORAGE_KEY, effectiveChildId)

  }, [effectiveChildId, selectedChildId])



  const setSelectedChildId = (id: string) => {

    setSelectedChildIdState(id)

    localStorage.setItem(STORAGE_KEY, id)

    qc.invalidateQueries({ queryKey: ['parent-dash'] })

    qc.invalidateQueries({ predicate: q => String(q.queryKey[0] || '').startsWith('parent-') })

  }



  const childParams = useMemo(

    () => (effectiveChildId ? { childId: effectiveChildId } : {}),

    [effectiveChildId]

  )



  return (

    <ParentChildContext.Provider value={{

      children: list,

      selectedChildId: effectiveChildId,

      setSelectedChildId,

      childParams,

      isLoading,

      isReady: !isLoading && !!effectiveChildId,

    }}>

      {nodes}

    </ParentChildContext.Provider>

  )

}



export function useParentChild() {

  return useContext(ParentChildContext)

}


