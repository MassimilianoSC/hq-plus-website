import React from "react";

export const Logo = ({ size = "md", className = "" }) => {
  const sizes = {
    sm: "w-[112px]",
    md: "w-[152px]",
    lg: "w-[176px]",
    xl: "w-[200px]",
  };
  return (
    <span
      role="img"
      aria-label="HQ Plus — AI System Integrator"
      className={`hq-logo ${sizes[size] || sizes.md} ${className}`}
      data-testid="hq-plus-logo"
    />
  );
};

export default Logo;
