import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("ErrorBoundary:", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div className="py-8 container-page">
          <h1 className="mb-2 text-xl font-semibold">Something went wrong.</h1>
          <pre className="p-3 text-sm whitespace-pre-wrap border rounded bg-brand-light border-brand-gray">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <p className="mt-2 text-sm">Check the browser console for details.</p>
        </div>
      );
    }
    return this.props.children;
  }
}