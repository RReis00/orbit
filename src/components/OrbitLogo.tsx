export function OrbitLogo({ size = 60 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Orbit rings */}
      <circle
        cx="50"
        cy="50"
        r="35"
        stroke="url(#gradient1)"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />
      <circle
        cx="50"
        cy="50"
        r="25"
        stroke="url(#gradient2)"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
      />

      {/* Center planet */}
      <circle cx="50" cy="50" r="12" fill="url(#gradient3)">
        <animate attributeName="r" values="12;13;12" dur="3s" repeatCount="indefinite" />
      </circle>

      {/* Orbiting dots */}
      <circle cx="85" cy="50" r="4" fill="#ec4899">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 50 50"
          to="360 50 50"
          dur="8s"
          repeatCount="indefinite"
        />
      </circle>

      <circle cx="50" cy="25" r="3" fill="#3b82f6">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 50 50"
          to="360 50 50"
          dur="5s"
          repeatCount="indefinite"
        />
      </circle>

      <circle cx="25" cy="65" r="3.5" fill="#7c3aed">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 50 50"
          to="360 50 50"
          dur="6s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Gradients */}
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <radialGradient id="gradient3">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#3b82f6" />
        </radialGradient>
      </defs>
    </svg>
  )
}
