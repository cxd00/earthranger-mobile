import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

// Internal Dependencies
import { IconProps } from '../types/types';

const SettingsIcon = ({ width = '16', height = '16', color }: IconProps) => (
  <Svg
    width={width}
    height={height}
  >
    <Path
      d="M6.16 16L5.76 13.48C5.50667 13.3867 5.24 13.26 4.96 13.1C4.68 12.94 4.43333 12.7733 4.22 12.6L1.86 13.68L0 10.4L2.16 8.82C2.13333 8.7 2.11667 8.56333 2.11 8.41C2.10333 8.25667 2.1 8.12 2.1 8C2.1 7.88 2.10333 7.74333 2.11 7.59C2.11667 7.43667 2.13333 7.3 2.16 7.18L0 5.6L1.86 2.32L4.22 3.4C4.43333 3.22667 4.68 3.06 4.96 2.9C5.24 2.74 5.50667 2.62 5.76 2.54L6.16 0H9.84L10.24 2.52C10.4933 2.61333 10.7633 2.73667 11.05 2.89C11.3367 3.04333 11.58 3.21333 11.78 3.4L14.14 2.32L16 5.6L13.84 7.14C13.8667 7.27333 13.8833 7.41667 13.89 7.57C13.8967 7.72333 13.9 7.86667 13.9 8C13.9 8.13333 13.8967 8.27333 13.89 8.42C13.8833 8.56667 13.8667 8.70667 13.84 8.84L16 10.4L14.14 13.68L11.78 12.6C11.5667 12.7733 11.3233 12.9433 11.05 13.11C10.7767 13.2767 10.5067 13.4 10.24 13.48L9.84 16H6.16ZM8 10.6C8.72 10.6 9.33333 10.3467 9.84 9.84C10.3467 9.33333 10.6 8.72 10.6 8C10.6 7.28 10.3467 6.66667 9.84 6.16C9.33333 5.65333 8.72 5.4 8 5.4C7.28 5.4 6.66667 5.65333 6.16 6.16C5.65333 6.66667 5.4 7.28 5.4 8C5.4 8.72 5.65333 9.33333 6.16 9.84C6.66667 10.3467 7.28 10.6 8 10.6Z"
      fill={color}
    />
  </Svg>
);

export { SettingsIcon };
