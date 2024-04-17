// External Dependencies
import React from 'react';
import {
  Svg, Path,
} from 'react-native-svg';

// Internal Dependencies
import { COLORS_LIGHT } from '../constants/colors';
import { IconProps } from '../types/types';

const QuestionMarkIcon = ({ width = '24', height = '24', color = COLORS_LIGHT.G2_secondaryMediumGray }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 0C5.376 0 0 5.376 0 12C0 18.624 5.376 24 12 24C18.624 24 24 18.624 24 12C24 5.376 18.624 0 12 0ZM13.2 20.4H10.8V18H13.2V20.4ZM15.684 11.1L14.604 12.204C13.74 13.08 13.2 13.8 13.2 15.6H10.8V15C10.8 13.68 11.34 12.48 12.204 11.604L13.692 10.092C14.136 9.66 14.4 9.06 14.4 8.4C14.4 7.08 13.32 6 12 6C10.68 6 9.6 7.08 9.6 8.4H7.2C7.2 5.748 9.348 3.6 12 3.6C14.652 3.6 16.8 5.748 16.8 8.4C16.8 9.456 16.368 10.416 15.684 11.1Z" />
  </Svg>
);

export { QuestionMarkIcon };
