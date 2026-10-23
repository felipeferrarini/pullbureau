'use client'

import { Component, type ReactNode } from 'react'

type Props = { fallback: ReactNode; children: ReactNode }

export class SafeBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
