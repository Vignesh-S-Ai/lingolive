import * as React from 'react'

interface Props {
  children: React.ReactNode
  /** Rendered instead of the default fallback when a child throws. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode
  /** Optional key — changing it resets the boundary (used on navigation). */
  resetKey?: string
}

interface State {
  error: Error | null
}

/**
 * Generic error boundary. Route-level failures are additionally handled by
 * react-router's `errorElement`; this catches render errors inside layouts.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (error) {
      return this.props.fallback?.(error, this.reset) ?? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="mt-3 max-w-md text-sm text-muted">{error.message}</p>
          <button
            type="button"
            onClick={this.reset}
            className="mt-6 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
