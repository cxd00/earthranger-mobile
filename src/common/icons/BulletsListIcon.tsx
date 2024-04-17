// External Dependencies
import React from 'react';
import {
  Svg, Path,
} from 'react-native-svg';

// Internal Dependencies
import { COLORS_LIGHT } from '../constants/colors';
import { IconProps } from '../types/types';

const BulletsListIcon = ({ width = '44', height = '36', color = COLORS_LIGHT.G3_secondaryMediumLightGray }: IconProps) => (
  <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill={color}>
    <Path d="M3.56757 14.3407C1.59351 14.3407 0 15.9421 0 17.9259C0 19.9097 1.59351 21.5111 3.56757 21.5111C5.54162 21.5111 7.13514 19.9097 7.13514 17.9259C7.13514 15.9421 5.54162 14.3407 3.56757 14.3407ZM3.56757 0C1.59351 0 0 1.60138 0 3.58519C0 5.56899 1.59351 7.17037 3.56757 7.17037C5.54162 7.17037 7.13514 5.56899 7.13514 3.58519C7.13514 1.60138 5.54162 0 3.56757 0ZM3.56757 28.6815C1.59351 28.6815 0 30.3068 0 32.2667C0 34.2266 1.6173 35.8519 3.56757 35.8519C5.51784 35.8519 7.13514 34.2266 7.13514 32.2667C7.13514 30.3068 5.54162 28.6815 3.56757 28.6815ZM10.7027 34.6568H44V29.8765H10.7027V34.6568ZM10.7027 20.3161H44V15.5358H10.7027V20.3161ZM10.7027 1.19506V5.97531H44V1.19506H10.7027Z" />
  </Svg>
);

export { BulletsListIcon };
