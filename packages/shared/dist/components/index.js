'use strict';

var react = require('react');
var jsxRuntime = require('react/jsx-runtime');

// src/components/SessionWarningModal.tsx
var SessionWarningModal = ({
  onExtend,
  onExpire,
  className = ""
}) => {
  const [isVisible, setIsVisible] = react.useState(false);
  const [timeRemaining, setTimeRemaining] = react.useState("2:00");
  const modalRef = react.useRef(null);
  const extendButtonRef = react.useRef(null);
  react.useRef(null);
  const countdownIntervalRef = react.useRef(null);
  react.useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [onExtend, onExpire]);
  react.useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
      } else if (e.key === "Enter" || e.key === " ") {
        if (document.activeElement === extendButtonRef.current) {
          e.preventDefault();
          handleExtendSession();
        }
      }
    };
    const handleFocusTrap = (e) => {
      if (!modalRef.current || !isVisible) return;
      if (!modalRef.current.contains(e.target)) {
        e.preventDefault();
        extendButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusTrap);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusTrap);
    };
  }, [isVisible]);
  const handleExtendSession = () => {
    if (onExtend) {
      onExtend();
    }
    setIsVisible(false);
  };
  const handleLogout = () => {
    setIsVisible(false);
    if (onExpire) {
      onExpire();
    }
  };
  if (!isVisible) return null;
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "fixed inset-0 z-40 bg-black bg-opacity-50", "aria-hidden": "true" }),
    /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        ref: modalRef,
        role: "alertdialog",
        "aria-modal": "true",
        "aria-labelledby": "session-warning-title",
        "aria-describedby": "session-warning-description",
        className: `fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`,
        children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "max-w-md w-full bg-white rounded-lg shadow-xl p-6", children: [
          /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex justify-center mb-4", children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntime.jsx(
            "svg",
            {
              className: "w-8 h-8 text-yellow-600",
              fill: "none",
              stroke: "currentColor",
              viewBox: "0 0 24 24",
              xmlns: "http://www.w3.org/2000/svg",
              "aria-hidden": "true",
              children: /* @__PURE__ */ jsxRuntime.jsx(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: 2,
                  d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                }
              )
            }
          ) }) }),
          /* @__PURE__ */ jsxRuntime.jsx(
            "h2",
            {
              id: "session-warning-title",
              className: "text-xl font-bold text-center text-gray-900 mb-2",
              children: "Session Expiring Soon"
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsxs("div", { id: "session-warning-description", className: "text-center mb-6", children: [
            /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-gray-600 mb-2", children: "Your session will expire due to inactivity." }),
            /* @__PURE__ */ jsxRuntime.jsxs("p", { className: "text-lg font-semibold text-gray-900", children: [
              "Time remaining: ",
              timeRemaining
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntime.jsxs(
            "div",
            {
              id: "session-countdown",
              role: "timer",
              "aria-live": "polite",
              "aria-atomic": "true",
              className: "sr-only",
              children: [
                "Time remaining: ",
                timeRemaining
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsxRuntime.jsx(
              "button",
              {
                ref: extendButtonRef,
                onClick: handleExtendSession,
                className: "flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                "aria-label": "Extend session and continue working",
                children: "Continue Working"
              }
            ),
            /* @__PURE__ */ jsxRuntime.jsx(
              "button",
              {
                onClick: handleLogout,
                className: "flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
                "aria-label": "Log out now",
                children: "Log Out"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntime.jsx("p", { className: "mt-4 text-xs text-center text-gray-500", children: "For your security, sessions expire after 30 minutes of inactivity." })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx("div", { role: "status", "aria-live": "assertive", "aria-atomic": "true", className: "sr-only", children: parseInt(timeRemaining) <= 30 && `Warning: Only ${timeRemaining} remaining. Please choose to continue working or log out.` })
  ] });
};
function useSessionWarning() {
  const [showModal, setShowModal] = react.useState(false);
  react.useEffect(() => {
    return () => {
    };
  }, []);
  return showModal;
}
var LoadingSpinner = ({
  size = "md",
  color = "#3b82f6",
  className = ""
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className: `inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] ${sizeClasses[size]} ${className}`,
      style: { borderTopColor: color, borderLeftColor: color, borderBottomColor: color },
      role: "status",
      "aria-label": "Loading",
      children: /* @__PURE__ */ jsxRuntime.jsx("span", { className: "sr-only", children: "Loading..." })
    }
  );
};

exports.LoadingSpinner = LoadingSpinner;
exports.SessionWarningModal = SessionWarningModal;
exports.useSessionWarning = useSessionWarning;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map