'use client'

import { useState } from 'react'
import { useAppStore } from '@/client/store'
import { danceFor } from '@/eggs/disco'
import { isInspector } from '@/eggs/inspection'
import { isDiscoOn, useEggStore } from '@/eggs/eggStore'
import type { QueuedPr } from '@/types/domain'
import type { StrikeCast } from '@/types/eggs'
import type { Actor, CobwebLook, Vec3 } from '@/types/scene'
import { ActorDecorations } from './ActorDecorations'
import { customerId } from './actors'
import { cobwebLevel, cobwebLook } from './cobweb'
import { useActorLook } from './filterPrototype/sceneFilter'
import { useDirectorClock } from './director/DirectorContext'
import { activeBubbles, activeOverride, activeSpawns } from './director/plan'
import { PartyHat } from './eggs/Birthday'
import { Clipboard } from './eggs/Clipboard'
import { CoffeeCup } from './eggs/CoffeeBreak'
import { HeadCobweb } from './HeadCobweb'
import { MovingActor } from './MovingActor'
import { PaperTicket } from './PaperTicket'
import { BUBBLE_SEATED_Y, BUBBLE_Y, SpeechBubble } from './SpeechBubble'
import { Plumbobs } from './Plumbobs'
import { Stools } from './Stools'

type CoffeeSpot = { position: Vec3; facing: number }
type Presence = { disco: boolean; sign: boolean; coffee: CoffeeSpot | undefined }

function present(actor: Actor, { disco, sign, coffee }: Presence): Actor {
  const placed = coffee ? { ...actor, ...coffee } : actor
  if (disco) return { ...placed, anim: danceFor(actor.id) }
  return sign && actor.pose === 'standing' ? { ...placed, anim: 'victory' } : placed
}

function handProp(actor: Actor, onBreak: boolean, signed: boolean) {
  if (onBreak) return <CoffeeCup />
  if (isInspector(actor.id)) return <Clipboard />
  return actor.kind === 'customer' && !signed ? <PaperTicket /> : undefined
}

const NO_WEB = cobwebLook(0)
const webFor = (actor: Actor) => (actor.kind === 'customer' && actor.pr ? cobwebLook(cobwebLevel(actor.pr.ageDays)) : NO_WEB)

function headProp(birthday: boolean, web: CobwebLook) {
  if (birthday) return <PartyHat />
  return web.web ? <HeadCobweb look={web} /> : undefined
}

type Props = { actors: Actor[]; strike: StrikeCast | null; oldestPr: QueuedPr | null; birthdays: Map<string, number>; coffee: Map<string, CoffeeSpot> | null }

export function ActorsLayer({ actors, strike, oldestPr, birthdays, coffee }: Props) {
  const viewer = useAppStore(state => state.viewerLogin)
  const select = useAppStore(state => state.select)
  const selected = useAppStore(state => state.selected)
  const focusRepo = useAppStore(state => state.focusRepo)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const { plans, now } = useDirectorClock()
  const alarm = useEggStore(state => state.alarm)
  const disco = useEggStore(isDiscoOn)
  const bubbles = activeBubbles(plans, now)
  const everyone = [...actors, ...activeSpawns(plans, now).map(spawn => spawn.actor)]
  const memorialId = oldestPr ? customerId(oldestPr.repo, oldestPr.number) : null
  const lookOf = useActorLook()

  return (
    <>
      <Stools actors={actors} />
      <Plumbobs />
      {everyone.map(actor => {
        const pr = actor.pr
        const sign = strike?.signs.get(actor.id) ?? null
        const shown = present(actor, { disco, sign: sign !== null, coffee: coffee?.get(actor.id) })
        const bubble = bubbles.get(actor.id)
        const isSelected = !!pr && selected?.repo === pr.repo && selected.number === pr.number
        const focused = focusRepo !== null && actor.repo === focusRepo
        const hovered = hoveredId === actor.id
        const web = webFor(actor)
        const look = lookOf(actor)
        return (
          <MovingActor
            key={actor.id}
            actor={shown}
            override={activeOverride(plans, actor.id, now)}
            highlighted={hovered || isSelected || look.lit}
            ghost={look.ghost}
            showBadge={focused && actor.kind === 'attendant'}
            onHover={value => setHoveredId(current => (value ? actor.id : current === actor.id ? null : current))}
            hand={look.ghost ? undefined : handProp(actor, coffee?.has(actor.id) ?? false, sign !== null)}
            head={look.ghost ? undefined : headProp(birthdays.has(actor.id), web)}
            dust={web.dust}
            lookUp={alarm}
            onSelect={pr ? () => select({ repo: pr.repo, number: pr.number }) : undefined}
          >
            <SpeechBubble bubble={bubble ?? null} login={actor.login} height={actor.kind === 'waiting' || actor.pose === 'sitting' || actor.pose === 'sleeping' ? BUBBLE_SEATED_Y : BUBBLE_Y} />
            {!look.ghost && <ActorDecorations
              actor={actor}
              focused={focused || isSelected || hovered}
              isViewer={viewer !== null && viewer === actor.login}
              sign={sign}
              memorialSince={oldestPr && actor.id === memorialId ? oldestPr.createdAt : null}
              birthday={birthdays.get(actor.id) ?? null}
              motes={web.motes}
            />}
          </MovingActor>
        )
      })}
    </>
  )
}
