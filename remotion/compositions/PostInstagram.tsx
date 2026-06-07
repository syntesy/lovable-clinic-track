import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Props = {
  title: string;
  subtitle: string;
};

export const PostInstagram: React.FC<Props> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 40,
  });

  const titleOpacity = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleY = interpolate(frame, [20, 50], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(frame, [40, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleY = interpolate(frame, [40, 70], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
      }}
    >
      {/* Logo / marca */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #00d4aa, #0057ff)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 60px rgba(0, 212, 170, 0.4)",
          }}
        >
          <span
            style={{
              color: "white",
              fontSize: 40,
              fontWeight: 900,
              letterSpacing: -2,
            }}
          >
            R
          </span>
        </div>
      </div>

      {/* Título */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        <h1
          style={{
            color: "white",
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: -3,
            margin: 0,
            lineHeight: 1,
          }}
        >
          {title}
        </h1>
      </div>

      {/* Subtítulo */}
      <div
        style={{
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 28,
            fontWeight: 400,
            margin: 0,
            letterSpacing: 1,
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* Linha decorativa */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          width: interpolate(frame, [60, 100], [0, 300], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          height: 2,
          background: "linear-gradient(90deg, transparent, #00d4aa, transparent)",
        }}
      />
    </AbsoluteFill>
  );
};
