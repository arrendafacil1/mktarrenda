import { Component } from "react"

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // você também pode enviar para um logger
    console.error("ErrorBoundary capturou:", error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: "16px",
          background: "#ffefef",
          color: "#8b0000",
          fontFamily: "system-ui, sans-serif"
        }}>
          <h2>Opa — um erro impediu a tela de renderizar.</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>
{String(this.state.error)}
          </pre>
          <p>Veja o Console (F12) para detalhes.</p>
        </div>
      )
    }
    return this.props.children
  }
}
