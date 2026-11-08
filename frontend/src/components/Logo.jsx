import React from "react";

// HQ | Flow logo — official HQ SVG mark + "Flow" in cyan.
// variant: "white" (default) | "cyan" | "navy"
export const Logo = ({ size = "md", variant = "white", className = "" }) => {
  const sizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
  };
  const src = {
    white: "/Logo_HQ.svg",
    cyan: "/Logo_HQ_cyan.svg",
    navy: "/Logo_HQ_navy.svg",
  }[variant];
  return (
    <span
      className={`inline-flex items-center font-semibold ${sizes[size]} ${className}`}
      aria-label="HQ Flow"
      data-testid="hq-flow-logo"
    >
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="hq-mark"
        draggable="false"
      />
      <span className="flow-mark">Flow</span>
    </span>
  );
};

export default Logo;
