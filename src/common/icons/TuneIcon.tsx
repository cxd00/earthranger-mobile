// External Dependencies
import React from 'react';
import {
  Svg, Path,
} from 'react-native-svg';

// Internal Dependencies
import { IconProps } from '../types/types';
import { COLORS_LIGHT } from '../constants/colors';

const TuneIcon = ({
  width = '16',
  height = '16',
  color = COLORS_LIGHT.brightBlue,
  viewbox = '0 0 16 16',
}: IconProps) => (
  <Svg width={width} height={height} viewBox={viewbox}>
    <Path d="M7.11667 14V10.25H8.11667V11.6333H14V12.6333H8.11667V14H7.11667ZM2 12.6333V11.6333H6.11667V12.6333H2ZM5.11667 9.86667V8.5H2V7.5H5.11667V6.1H6.11667V9.86667H5.11667ZM7.11667 8.5V7.5H14V8.5H7.11667ZM9.88333 5.75V2H10.8833V3.36667H14V4.36667H10.8833V5.75H9.88333ZM2 4.36667V3.36667H8.88333V4.36667H2Z" fill={color} />
  </Svg>
);

export { TuneIcon };
