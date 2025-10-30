import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: any;
};

export default function CustomParallelTracksIcon({
  size = 28,
  color = "#FFFFFF",
  strokeWidth = 2.25,
  style,
}: Props) {
  // Two smooth, slightly offset curves (parallel “tracks”)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style} fill="none">
      {/* top curve */}
      <Path
        d="M2 7 C 7 4.5, 13 4.5, 22 7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* bottom curve */}
      <Path
        d="M2 13 C 7 10.5, 13 10.5, 22 13"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
