import type { SVGProps } from "react";
type MjlLogoProps = SVGProps<SVGSVGElement> & { compact?: boolean };
export function MjlLogo({ compact = false, ...props }: MjlLogoProps) {
  return <svg viewBox={compact ? "0 0 48 48" : "0 0 270 52"} role="img" aria-label="mjlFulfillment" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs><linearGradient id="mjl-blue" x1="5" y1="4" x2="43" y2="44" gradientUnits="userSpaceOnUse"><stop stopColor="#60A5FA"/><stop offset="1" stopColor="#005BFF"/></linearGradient></defs>
    <g transform="translate(2 2)"><path d="M22 2 42 13.5v21L22 46 2 34.5v-21L22 2Z" fill="url(#mjl-blue)" opacity=".16"/><path d="M22 2 42 13.5 22 25 2 13.5 22 2Z" fill="#60A5FA"/><path d="M2 13.5 22 25v21L2 34.5v-21Z" fill="#2563EB"/><path d="M42 13.5 22 25v21l20-11.5v-21Z" fill="#005BFF"/><path d="m12 19 10 5.8 10-5.8M22 25v11" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="m34 8 7 4-7 4M39 12h-8" fill="none" stroke="#A5D0FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></g>
    {!compact && <g fill="currentColor"><text x="56" y="27" fontFamily="Inter,sans-serif" fontSize="23" fontWeight="800" letterSpacing="-1.1">mjl</text><text x="99" y="27" fontFamily="Inter,sans-serif" fontSize="19" fontWeight="600" letterSpacing="-.7">Fulfillment</text><text x="57" y="42" fontFamily="Inter,sans-serif" fontSize="7.5" fontWeight="600" letterSpacing="2.15" opacity=".55">SMART LOGISTICS NETWORK</text></g>}
  </svg>;
}