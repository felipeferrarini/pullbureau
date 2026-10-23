'use client'

import { createContext, useContext } from 'react'
import type { Rect } from '@/types/outside'
import { DEFAULT_FOOTPRINT } from '../walkRoute'

const GroundContext = createContext<Rect>(DEFAULT_FOOTPRINT)

export const GroundProvider = GroundContext.Provider
export const useFootprint = () => useContext(GroundContext)
