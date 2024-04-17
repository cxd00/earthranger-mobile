// External Dependencies
import React from 'react';
import {
  Svg, Path,
} from 'react-native-svg';

// Internal Dependencies
import { IconProps } from '../types/types';
import { COLORS_LIGHT } from '../constants/colors';

const RecordReportAreaIcon = ({ width = '22', height = '22', color = COLORS_LIGHT.brightBlue }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 22 22" fill={color}>
    <Path d="M21.637 9.34255C21.637 8.62049 21.3502 7.928 20.8396 7.41742C20.329 6.90685 19.6365 6.62001 18.9145 6.62001C18.588 6.63303 18.2656 6.69749 17.9592 6.81105L13.6127 3.22877C13.6157 3.19196 13.6328 3.15776 13.6605 3.13327C13.7121 2.74221 13.6797 2.34462 13.5653 1.9671C13.4509 1.58959 13.2573 1.24086 12.9973 0.944225C12.7373 0.647593 12.4169 0.409908 12.0576 0.247069C11.6984 0.0842293 11.3085 0 10.914 0C10.5196 0 10.1297 0.0842293 9.77045 0.247069C9.41117 0.409908 9.09081 0.647593 8.8308 0.944225C8.57079 1.24086 8.37715 1.58959 8.26279 1.9671C8.14843 2.34462 8.11595 2.74221 8.16764 3.13327V3.22877L3.82109 6.85883C3.49155 6.70612 3.13349 6.62474 2.77032 6.62001C2.04379 6.6199 1.34635 6.9052 0.828168 7.41445C0.309989 7.92369 0.0125263 8.61613 0 9.34255C0.00820954 9.88 0.170005 10.4039 0.466209 10.8524C0.762413 11.301 1.18067 11.6554 1.67173 11.874L3.34346 17.4146C2.97887 17.8032 2.73634 18.2902 2.64589 18.8153C2.55544 19.3404 2.62111 19.8805 2.83469 20.3687C3.04826 20.8569 3.40041 21.2716 3.84745 21.5616C4.29449 21.8515 4.8168 22.004 5.34963 21.9999C5.85906 22.0036 6.35893 21.8617 6.79047 21.5909C7.222 21.3201 7.56718 20.9318 7.7855 20.4715H14.0903C14.2764 20.8077 14.5317 21.1006 14.8392 21.3311C15.1466 21.5616 15.4993 21.7244 15.8742 21.8088C16.2491 21.8932 16.6376 21.8972 17.0142 21.8207C17.3908 21.7442 17.7469 21.5889 18.0591 21.3649C18.3714 21.1409 18.6326 20.8533 18.8257 20.5211C19.0189 20.1889 19.1396 19.8196 19.1798 19.4374C19.2199 19.0553 19.1788 18.6689 19.0589 18.3038C18.9391 17.9387 18.7434 17.6031 18.4846 17.3191L20.1564 11.7785C20.6114 11.558 20.9931 11.2109 21.2558 10.7788C21.5184 10.3467 21.6508 9.84801 21.637 9.34255V9.34255ZM16.5263 16.5071C15.9248 16.5178 15.3431 16.724 14.8691 17.0945C14.3952 17.465 14.0548 17.9798 13.8993 18.5609H8.02432C7.86664 17.972 7.51906 17.4515 7.03546 17.0801C6.55187 16.7088 5.95934 16.5074 5.34963 16.5071H5.063L3.6779 11.874C4.20685 11.6797 4.66395 11.3287 4.98825 10.8679C5.31255 10.4071 5.48852 9.85826 5.49282 9.29476C5.49483 8.89468 5.39635 8.50053 5.20631 8.14845L8.9796 4.99603C9.48421 5.5084 10.171 5.80031 10.8901 5.80802C11.6237 5.80257 12.3263 5.51127 12.8485 4.99603L16.4785 8.05292C16.2877 8.43897 16.1897 8.86417 16.192 9.29476C16.1859 9.8798 16.3684 10.4513 16.7125 10.9244C17.0566 11.3976 17.5441 11.7473 18.1025 11.9218L16.7173 16.4593L16.5263 16.5071Z" />
  </Svg>
);

export { RecordReportAreaIcon };
