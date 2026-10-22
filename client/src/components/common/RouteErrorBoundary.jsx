import { Component } from "react";
import ErrorState from "./ErrorState";

class RouteErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Route render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-xl px-4 py-16">
          <ErrorState
            message="بارگذاری این صفحه با مشکل مواجه شد. ممکن است نسخه‌ی جدیدی از سایت منتشر شده باشد."
            onRetry={() => window.location.reload()}
          />
        </div>
      );
    }
    return this.props.children;
  }
}

export default RouteErrorBoundary;
