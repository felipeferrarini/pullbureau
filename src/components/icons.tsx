import type { ReactNode } from 'react'

type IconProps = { size?: number; className?: string }

function Icon({ size = 16, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      {children}
    </svg>
  )
}

export const QueueIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="7" cy="7" r="2.6" />
    <circle cx="17" cy="7" r="2.6" />
    <path d="M2.5 19v-1.5A4.5 4.5 0 0 1 7 13a4.5 4.5 0 0 1 4.5 4.5V19M12.5 19v-1.5A4.5 4.5 0 0 1 17 13a4.5 4.5 0 0 1 4.5 4.5V19" />
  </Icon>
)

export const FlowIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5" />
  </Icon>
)

export const ReviewIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="m15 15 5.5 5.5M8 10.5l2 2 3.2-3.5" />
  </Icon>
)

export const MergeIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="6" cy="5" r="2.2" />
    <circle cx="6" cy="19" r="2.2" />
    <circle cx="18" cy="12" r="2.2" />
    <path d="M6 7.2v9.6M6 7.5c0 3 2.5 4.5 6 4.5h3.8" />
  </Icon>
)

export const HourglassIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" />
  </Icon>
)

export const TicketIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3.5 7h17v3a2 2 0 0 0 0 4v3h-17v-3a2 2 0 0 0 0-4z" />
    <path d="M15 7.5v9" strokeDasharray="1.6 2" />
  </Icon>
)

export const AlertIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3.5 2.8 19.5h18.4z" />
    <path d="M12 10v4M12 17v.01" />
  </Icon>
)

export const ArrowUpIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Icon>
)

export const ArrowDownIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </Icon>
)

export const ArrowRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
)

export const SoundOnIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </Icon>
)

export const SoundOffIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" />
    <path d="m16 10 4 4M20 10l-4 4" />
  </Icon>
)

export const GaugeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4.5 17a8 8 0 1 1 15 0" />
    <path d="m12 13 3.5-4" />
    <circle cx="12" cy="13.5" r="1.2" />
  </Icon>
)

export const OverviewIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    <circle cx="12" cy="12" r="2.5" />
  </Icon>
)

export const ShutterIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 5h18M5 5v15M19 5v15M5 9h14M5 13h14M5 17h14" />
  </Icon>
)

export const CloseIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
)

export const ExternalIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Icon>
)

export const CameraIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7H7l1.5-2h7L17 7h2.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" />
    <circle cx="12" cy="13" r="3.5" />
  </Icon>
)

export const CheckCircleIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12.5 2.8 2.8L16.5 9.5" />
  </Icon>
)

export const XCircleIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </Icon>
)

export const PendingIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" strokeDasharray="3 3.2" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
)

export const DashCircleIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12h8" />
  </Icon>
)

export const DraftIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 20h4L19 9l-4-4L4 16z" />
    <path d="m13.5 6.5 4 4" />
  </Icon>
)

export const ThermometerIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z" />
    <path d="M12 9v7" />
  </Icon>
)

export const DoorIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 21V4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5V21M3 21h18" />
    <path d="M15 12v.01" />
  </Icon>
)

export const GithubIcon = ({ size = 16, className }: IconProps) => (
  <svg className={className} width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden focusable="false">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
  </svg>
)

export function Emblem({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden focusable="false">
      <defs>
        <linearGradient id="emblem-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd27a" />
          <stop offset="1" stopColor="#d48a12" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18.5" fill="#123526" stroke="url(#emblem-gold)" strokeWidth="2" />
      <circle cx="20" cy="20" r="14.5" fill="none" stroke="#ffb020" strokeOpacity="0.35" strokeDasharray="1.2 2.2" />
      <path d="M11 17.5 20 12l9 5.5z" fill="url(#emblem-gold)" />
      <path d="M13 19.5v7M17.7 19.5v7M22.3 19.5v7M27 19.5v7" stroke="#fbf6e6" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M11 28.5h18" stroke="url(#emblem-gold)" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}
