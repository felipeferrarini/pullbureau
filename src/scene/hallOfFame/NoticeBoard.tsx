'use client'

import { t } from '@/i18n'


import { Text } from '@react-three/drei'
import { RANKING_DAYS } from '@/domain/board'
import { hashString } from '@/shared/hash'
import type { NoticeCard } from '@/types/domain'
import type { Vec3 } from '@/types/scene'
import { FONT_URL } from '../fonts'
import { AvatarPhoto, MEDAL } from './pieces'
import { useCorkTexture } from './textures'

const WIDTH = 10
const HEIGHT = 3.35
const FRAME = 0.14
const SLOTS = 8
const CARD: [number, number] = [1.1, 2.08]
const CARD_GAP = 0.08
const CARD_Y = -0.38
const PHOTO = 0.9
const PIN_COLORS = ['#d62828', '#1d4ed8', '#15803d', '#f59e0b', '#7c3aed']
const FLYERS = [
  { title: t('ui.forSale'), body: t('ui.1978CompactCarOneOwnerMealVouchersAccepted'), color: '#fef3c7' },
  { title: t('ui.lost'), body: t('ui.redStaplerRewardOneCoffee'), color: '#e0f2fe' },
  { title: t('ui.officePool'), body: t('ui.guessTheNextMergeWithoutAReview'), color: '#fce7f3' },
  { title: t('ui.notice'), body: t('ui.theFridgeWillBeCleanedFridayNoExceptions'), color: '#ecfccb' },
]

const tiltFor = (seed: string) => ((hashString(seed) % 100) / 100 - 0.5) * 0.09
const loginSize = (login: string) => Math.min(0.11, 1.55 / Math.max(1, login.length) )
const slotX = (slot: number) => (slot - (SLOTS - 1) / 2) * (CARD[0] + CARD_GAP)

function Pin({ color, y }: { color: string; y: number }) {
  return (
    <group position={[0, y, 0.03]}>
      <mesh position={[0.012, -0.015, -0.02]}>
        <circleGeometry args={[0.05, 12]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} depthWrite={false} />
      </mesh>
      <mesh castShadow>
        <sphereGeometry args={[0.055, 14, 10]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
    </group>
  )
}

function Paper({ color = '#fbf8ef', size = CARD }: { color?: string; size?: [number, number] }) {
  return (
    <>
      <mesh position={[0.03, -0.035, -0.006]}>
        <planeGeometry args={size} />
        <meshBasicMaterial color="#000000" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <mesh receiveShadow>
        <planeGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
    </>
  )
}

function RankCard({ card, slot }: { card: NoticeCard; slot: number }) {
  const medal = card.rank <= 3 ? MEDAL[card.rank as 1 | 2 | 3] : '#9aa3ad'
  return (
    <group position={[slotX(slot), CARD_Y, 0.02]} rotation-z={tiltFor(card.login)}>
      <Paper />
      <mesh position={[0, CARD[1] / 2 - 0.09, 0.002]}>
        <planeGeometry args={[CARD[0], 0.18]} />
        <meshStandardMaterial color={medal} roughness={0.6} metalness={card.rank <= 3 ? 0.5 : 0} />
      </mesh>
      <Text font={FONT_URL} position={[-CARD[0] / 2 + 0.08, CARD[1] / 2 - 0.09, 0.004]} fontSize={0.13} color="#1f2937" anchorX="left" anchorY="middle">
        {String(card.rank)}
      </Text>
      <group position={[0, 0.33, 0.004]}>
        <AvatarPhoto login={card.login} size={PHOTO} />
      </group>
      <Text font={FONT_URL} position={[0, -0.42, 0.004]} fontSize={0.46} color="#b91c1c" anchorX="center" anchorY="middle">
        {String(card.reviews)}
      </Text>
      <Text font={FONT_URL} position={[0, -0.75, 0.004]} fontSize={0.085} letterSpacing={0.08} color="#6b7280" anchorX="center" anchorY="middle">
        {card.reviews === 1 ? t('ui.review') : t('ui.reviews')}
      </Text>
      <Text font={FONT_URL} position={[0, -0.92, 0.004]} fontSize={loginSize(card.login)} color="#111827" anchorX="center" anchorY="middle">
        {card.login}
      </Text>
      <Pin color={PIN_COLORS[slot % PIN_COLORS.length]} y={CARD[1] / 2 - 0.05} />
    </group>
  )
}

function Flyer({ slot }: { slot: number }) {
  const flyer = FLYERS[slot % FLYERS.length]
  const size: [number, number] = [CARD[0] - 0.05, 1.25]
  return (
    <group position={[slotX(slot), CARD_Y + 0.25, 0.02]} rotation-z={tiltFor(flyer.title) * 1.6}>
      <Paper color={flyer.color} size={size} />
      <Text font={FONT_URL} position={[0, 0.38, 0.004]} fontSize={0.15} color="#374151" anchorX="center" anchorY="middle">
        {flyer.title}
      </Text>
      <Text font={FONT_URL} position={[0, 0.02, 0.004]} fontSize={0.075} lineHeight={1.25} maxWidth={size[0] - 0.14} textAlign="center" color="#4b5563" anchorX="center" anchorY="middle">
        {flyer.body}
      </Text>
      {[-0.32, -0.14, 0.04, 0.22, 0.4].map(x => (
        <mesh key={x} position={[x, -size[1] / 2 + 0.17, 0.003]}>
          <planeGeometry args={[0.13, 0.3]} />
          <meshStandardMaterial color="#f9fafb" roughness={0.95} />
        </mesh>
      ))}
      <Pin color={PIN_COLORS[(slot + 2) % PIN_COLORS.length]} y={size[1] / 2 - 0.05} />
    </group>
  )
}

function Header() {
  return (
    <group position={[0, HEIGHT / 2 - 0.42, 0.02]}>
      <Paper size={[5.6, 0.56]} color="#f8f5ea" />
      <mesh position={[0, -0.25, 0.002]}>
        <planeGeometry args={[5.6, 0.06]} />
        <meshStandardMaterial color="#1f4d3a" />
      </mesh>
      <Text font={FONT_URL} position={[-2.65, 0.02, 0.004]} fontSize={0.3} color="#1f4d3a" anchorX="left" anchorY="middle">
        {t('ui.noticeBoard')}
      </Text>
      <Text font={FONT_URL} position={[2.65, 0.02, 0.004]} fontSize={0.17} color="#b91c1c" anchorX="right" anchorY="middle">
        {t('ui.reviewsDays', { days: RANKING_DAYS })}
      </Text>
      <Pin color="#d62828" y={0.22} />
    </group>
  )
}

export function NoticeBoard({ position, cards }: { position: Vec3; cards: NoticeCard[] }) {
  const cork = useCorkTexture(WIDTH, HEIGHT)
  const rails: { position: Vec3; size: Vec3 }[] = [
    { position: [0, HEIGHT / 2 - FRAME / 2, 0.04], size: [WIDTH, FRAME, 0.08] },
    { position: [0, -HEIGHT / 2 + FRAME / 2, 0.04], size: [WIDTH, FRAME, 0.08] },
    { position: [-WIDTH / 2 + FRAME / 2, 0, 0.04], size: [FRAME, HEIGHT, 0.08] },
    { position: [WIDTH / 2 - FRAME / 2, 0, 0.04], size: [FRAME, HEIGHT, 0.08] },
  ]
  const flyers = Array.from({ length: Math.max(0, SLOTS - cards.length) }, (_, i) => cards.length + i)
  return (
    <group position={position}>
      <mesh receiveShadow>
        <boxGeometry args={[WIDTH, HEIGHT, 0.03]} />
        <meshStandardMaterial map={cork} roughness={1} />
      </mesh>
      {rails.map(rail => (
        <mesh key={rail.position.join()} position={rail.position} castShadow>
          <boxGeometry args={rail.size} />
          <meshStandardMaterial color="#6b4226" roughness={0.55} />
        </mesh>
      ))}
      <Header />
      {cards.map((card, slot) => (
        <RankCard key={card.login} card={card} slot={slot} />
      ))}
      {flyers.map(slot => (
        <Flyer key={slot} slot={slot} />
      ))}
    </group>
  )
}
