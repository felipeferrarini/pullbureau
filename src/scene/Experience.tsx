'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo, useState } from 'react'
import { useAppStore } from '@/client/store'
import { coffeeSpots } from '@/eggs/coffee'
import { useCoffeeBreak } from '@/eggs/eggClock'
import { strikeBannerText, strikeCast } from '@/eggs/strike'
import { SKELETON_MODEL_ID } from '@/shared/characters'
import type { Counter, Snapshot } from '@/types/domain'
import type { Rect } from '@/types/outside'
import { ActorsLayer } from './ActorsLayer'
import { buildActors, buildSceneIndex, customerId } from './actors'
import { Board } from './Board'
import { CameraRig } from './CameraRig'
import { CounterBooth } from './CounterBooth'
import { DirectorProvider, useDirectorClock } from './director/DirectorContext'
import { activeEffects, lampFor } from './director/plan'
import { EffectsLayer } from './effects/EffectsLayer'
import { useFilteredSnapshot } from './filterPrototype/sceneFilter'
import { Caramelo } from './eggs/Caramelo'
import { CoffeeSteam } from './eggs/CoffeeBreak'
import { DiscoMode } from './eggs/DiscoMode'
import { NoDeploySign } from './eggs/NoDeploySign'
import { useBirthdayParty } from './eggs/useBirthdayParty'
import { StrikeBannerProp } from './eggs/StrikeProps'
import { FightCloud } from './FightCloud'
import { Hall } from './Hall'
import { BACK_WALL_Z, CAMERA_FOV, FACADE_Z, overviewCamera, sceneBounds } from './layout'
import { Outside } from './outside/Outside'
import { GroundProvider } from './outside/GroundContext'
import { Lighting } from './render/Lighting'
import { PostFx } from './render/PostFx'
import { FrameDriver } from './render/FrameDriver'
import { keepsDrawingBuffer, useLiteScene, usePixelRatio } from './render/quality'
import { SkyProvider } from './render/SkyContext'
import { StaticBatch } from './render/StaticBatch'
import { SkyDome } from './render/SkyDome'
import { useReducedMotion } from './render/useReducedMotion'
import { RopeFence, Stanchions } from './Stanchions'
import { useHallLayout } from './useHallLayout'
import { laneRopes, laneTapes, occupiedPath } from './queueLanes'
import { LaneTapes } from './outside/LaneTapes'
import { useWalkIn } from './walkIn/useWalkIn'

type BoothProps = { counter: Counter; index: number; count: number; last: boolean; away: boolean }

function Booth(props: BoothProps) {
  const { plans, now } = useDirectorClock()
  const focus = useAppStore(state => state.focus)
  return <CounterBooth {...props} lamp={lampFor(activeEffects(plans, now), props.counter.repo)} onFocus={focus} />
}

export function Experience({ snapshot: raw }: { snapshot: Snapshot }) {
  const full = useFilteredSnapshot(raw)
  const layout = useHallLayout(full)
  const { snapshot, hallCount, closedCount, lanes } = layout
  const camera = overviewCamera(hallCount, window.innerWidth / window.innerHeight, closedCount)
  const actors = useMemo(() => buildActors(snapshot, SKELETON_MODEL_ID, hallCount), [snapshot, hallCount])
  const index = useMemo(() => buildSceneIndex(snapshot, actors, hallCount), [snapshot, actors, hallCount])
  const bounds = sceneBounds(hallCount, closedCount)
  const strike = useMemo(() => (snapshot.strike.active ? strikeCast(snapshot.counters, hallCount) : null), [snapshot, hallCount])
  const footprint = useMemo<Rect>(() => ({ minX: bounds.minX, maxX: bounds.maxX, minZ: BACK_WALL_Z, maxZ: FACADE_Z }), [bounds.minX, bounds.maxX])
  useWalkIn(actors, snapshot.generatedAt, footprint)
  const reduced = useReducedMotion()
  const lite = useLiteScene()
  const dpr = usePixelRatio()
  const [gl] = useState(() => ({ preserveDrawingBuffer: keepsDrawingBuffer() }))
  const birthdays = useBirthdayParty(snapshot, hallCount)
  const coffeeOn = useCoffeeBreak()
  const coffee = useMemo(() => (coffeeOn ? coffeeSpots(actors, hallCount) : null), [coffeeOn, actors, hallCount])
  const oldestSpot = useMemo(() => {
    const oldest = snapshot.oldestPr
    const actor = oldest ? actors.find(candidate => candidate.id === customerId(oldest.repo, oldest.number)) : undefined
    return actor && !actor.outside && !actor.dusty && actor.kind === 'customer' ? actor.position : null
  }, [actors, snapshot.oldestPr])
  const queueLines = useMemo(() => lanes.map((lane, i) => occupiedPath(lane, snapshot.counters[i]?.queue.length ?? 0)), [lanes, snapshot])
  const tapes = useMemo(() => laneTapes(lanes, snapshot.counters.map(counter => counter.queue.length)), [lanes, snapshot])
  const ropes = useMemo(() => laneRopes(lanes, snapshot.counters.map(counter => counter.queue.length)), [lanes, snapshot])
  const repos = useMemo(() => snapshot.counters.map(counter => counter.repo), [snapshot])
  const paused = useAppStore(state => state.duel !== null)
  const boothsVersion = `${hallCount}|${coffeeOn}|${snapshot.counters.map(counter => `${counter.repo}:${counter.queue.length}`).join()}`
  return (
    <Canvas shadows={!lite} frameloop="never" dpr={dpr} gl={gl} camera={{ position: camera.position, fov: CAMERA_FOV, near: 0.1, far: 500 }}>
      <FrameDriver paused={paused} />
      <SkyProvider>
        <GroundProvider value={footprint}>
          <SkyDome />
          <Suspense fallback={null}>
            <Lighting minX={bounds.minX} maxX={bounds.maxX} />
          </Suspense>
          {!lite && <PostFx />}
          <DirectorProvider index={index}>
            <Suspense fallback={null}>
              <Hall counterCount={hallCount} closedCount={closedCount} stale={snapshot.stale} />
              <Outside count={hallCount} footprint={footprint} lite={lite} />
              <Board board={snapshot.board} generatedAt={snapshot.generatedAt} />
              <StaticBatch version={boothsVersion}>
                {snapshot.counters.map((counter, i) => (
                  <group key={counter.repo}>
                    <Booth counter={counter} index={i} count={hallCount} last={i === hallCount - 1 || i === snapshot.counters.length - 1} away={coffeeOn} />
                    <Stanchions index={i} count={hallCount} length={counter.queue.length} />
                  </group>
                ))}
                <RopeFence rails={ropes} />
                <LaneTapes tapes={tapes} repos={repos} />
              </StaticBatch>
              {snapshot.counters.map((counter, i) => (
                <FightCloud key={counter.repo} counter={counter} index={i} count={hallCount} />
              ))}
              <ActorsLayer actors={actors} strike={strike} oldestPr={snapshot.oldestPr} birthdays={birthdays} coffee={coffee} />
              {coffeeOn && <CoffeeSteam hallCount={hallCount} />}
              {strike?.banner && <StrikeBannerProp banner={strike.banner} text={strikeBannerText(snapshot.strike.since, new Date(snapshot.generatedAt))} />}
              <EffectsLayer hallCount={hallCount} />
              <NoDeploySign />
              <DiscoMode />
              {!lite && <Caramelo hallCount={hallCount} lines={queueLines} oldest={oldestSpot} reduced={reduced} />}
            </Suspense>
          </DirectorProvider>
          <CameraRig counters={snapshot.counters} hallCount={hallCount} closedCount={closedCount} />
        </GroundProvider>
      </SkyProvider>
    </Canvas>
  )
}
