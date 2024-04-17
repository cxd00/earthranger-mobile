// External Dependencies
import React from 'react';
import {
  Svg, Path,
} from 'react-native-svg';

// Internal Dependencies
import { COLORS_LIGHT } from '../constants/colors';
import { IconProps } from '../types/types';

const WiFiIcon = ({ width = '22', height = '22', color = COLORS_LIGHT.G2_5_mobileSecondaryGray }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 22 22" fill={color}>
    <Path d="M10 14.1667C9.41667 14.1667 8.92361 13.9653 8.52083 13.5625C8.11806 13.1597 7.91667 12.6667 7.91667 12.0833C7.91667 11.5 8.11806 11.0069 8.52083 10.6042C8.92361 10.2014 9.41667 10 10 10C10.5833 10 11.0764 10.2014 11.4792 10.6042C11.8819 11.0069 12.0833 11.5 12.0833 12.0833C12.0833 12.6667 11.8819 13.1597 11.4792 13.5625C11.0764 13.9653 10.5833 14.1667 10 14.1667ZM5.29167 9.45833L3.54167 7.66667C4.36111 6.84722 5.32292 6.19792 6.42708 5.71875C7.53125 5.23958 8.72222 5 10 5C11.2778 5 12.4688 5.24306 13.5729 5.72917C14.6771 6.21528 15.6389 6.875 16.4583 7.70833L14.7083 9.45833C14.0972 8.84722 13.3889 8.36806 12.5833 8.02083C11.7778 7.67361 10.9167 7.5 10 7.5C9.08333 7.5 8.22222 7.67361 7.41667 8.02083C6.61111 8.36806 5.90278 8.84722 5.29167 9.45833ZM1.75 5.91667L0 4.16667C1.27778 2.86111 2.77083 1.84028 4.47917 1.10417C6.1875 0.368056 8.02778 0 10 0C11.9722 0 13.8125 0.368056 15.5208 1.10417C17.2292 1.84028 18.7222 2.86111 20 4.16667L18.25 5.91667C17.1806 4.84722 15.941 4.01042 14.5312 3.40625C13.1215 2.80208 11.6111 2.5 10 2.5C8.38889 2.5 6.87847 2.80208 5.46875 3.40625C4.05903 4.01042 2.81944 4.84722 1.75 5.91667Z" />
  </Svg>
);

export { WiFiIcon };
