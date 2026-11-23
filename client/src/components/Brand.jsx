import React from "react";
import { Compass } from "lucide-react";
export function Brand() {
  return (
    <div className="brand">
      <span className="brand-symbol">
        <Compass size={25} />
      </span>
      applypilot<span className="brand-dot">.</span>
    </div>
  );
}
