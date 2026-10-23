'use client'

import { useEffect, useState } from 'react'
import { sceneNow } from '@/scene/sceneClock'
import { isCoffeeBreak, isFridayNoDeploy } from './clock'
import { useEggStore } from './eggStore'

const TICK_MS = 20_000

export const noDeployNow = () => useEggStore.getState().forcedFriday || isFridayNoDeploy(sceneNow())
export const coffeeBreakNow = () => useEggStore.getState().forcedCoffee || isCoffeeBreak(sceneNow())

function useTicking(read: () => boolean): boolean {
  const forced = useEggStore(state => state.forcedFriday || state.forcedCoffee)
  const [value, setValue] = useState(read)
  useEffect(() => {
    const timer = setInterval(() => setValue(read()), TICK_MS)
    return () => clearInterval(timer)
  }, [read])
  return forced ? read() : value
}

export const useNoDeploy = () => useTicking(noDeployNow)
export const useCoffeeBreak = () => useTicking(coffeeBreakNow)
