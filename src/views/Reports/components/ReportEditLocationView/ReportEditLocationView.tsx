/* eslint-disable arrow-body-style */
// External Dependencies
import React, {
  useCallback, useEffect, useState,
} from 'react';
import {
  Pressable,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MapboxGL, { Point, RegionPayload } from '@react-native-mapbox-gl/maps';
import Geolocation from 'react-native-geolocation-service';

// Internal Dependencies
import { Position } from '../../../../common/types/types';
import { COLORS_LIGHT } from '../../../../common/constants/colors';
import { EditIcon } from '../../../../common/icons/EditIcon';
import { ReportFormSubmitButton } from '../ReportForm/components/ReportFormSubmitButton/ReportFormSubmitButton';
import log from '../../../../common/utils/logUtils';
import { TargetIcon } from '../../../../common/icons/TargetIcon';
import { EditLocationDialog } from '../../../../common/components/EditLocationDialog/EditLocationDialog';
import { LocationOnAndroid } from '../../../../common/icons/LocationOnAndroid';
import { LocationOnForIos } from '../../../../common/icons/LocationOnForIos';
import { LocationOffForIos } from '../../../../common/icons/LocationOffForIos';
import { LocationOffAndroid } from '../../../../common/icons/LocationOffAndroid';
import { BASEMAP_KEY, IS_ANDROID } from '../../../../common/constants/constants';
import { osBackIcon } from '../../../../common/components/header/header';
import { getStringForKey } from '../../../../common/data/storage/keyValue';

// Styles
import styles from './ReportEditLocationView.styles';

// Constants
const ZOOM_LEVEL = 16;
const ANIMATION_MODE = 'flyTo';
const ANIMATION_DURATION = 2000;

export const ReportEditLocationView = () => {
  // Hooks
  const navigation = useNavigation();

  // Component's State
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [coordinates, setCoordinates] = useState<Position>(
    // @ts-ignore
    navigation.getState().routes[navigation.getState().index].params.coordinates,
  );
  const [centerCoordinates, setCenterCoordinates] = useState<Position>();
  const [displayEditDialog, setDisplayEditDialog] = useState(false);
  const [isDeviceLocation, setIsDeviceLocation] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(ZOOM_LEVEL);
  const [basemapSelected] = useState(
    getStringForKey(BASEMAP_KEY) || MapboxGL.StyleURL.Outdoors,
  );

  // Utility Functions
  const headerRight = useCallback(() => {
    return (
      <Pressable onPress={onSubmitButtonPress} hitSlop={20}>
        <ReportFormSubmitButton />
      </Pressable>
    );
  }, [coordinates]);

  const headerLeft = useCallback(() => {
    return (
      <Pressable
        style={styles.backbutton}
        onPress={onSubmitButtonPress}
      >
        {osBackIcon}
      </Pressable>
    );
  }, []);

  const setCurrentLocation = useCallback(() => {
    Geolocation.getCurrentPosition(
      (position) => {
        setCoordinates([position.coords.longitude, position.coords.latitude]);
        setCenterCoordinates([position.coords.longitude, position.coords.latitude]);
        setIsDeviceLocation(true);
      },
      (error) => {
        log.error(`[ReportEditLocationView] - Get current position - ${error}`);
      },
      { enableHighAccuracy: true },
    );
  }, []);

  // Handlers
  const onSubmitButtonPress = () => {
    navigation.navigate({
      name: 'ReportForm',
      params: { coordinates },
      merge: true,
    });
  };

  const onCoordinatesPress = () => {
    setDisplayEditDialog(true);
  };

  const onCancelDialogPress = () => {
    setDisplayEditDialog(false);
  };

  const onSaveDialogPress = (updatedReportCoordinates: Position) => {
    setDisplayEditDialog(false);
    setCoordinates([
      parseFloat(updatedReportCoordinates[0].toFixed(6)),
      parseFloat(updatedReportCoordinates[1].toFixed(6)),
    ]);
  };

  // @ts-ignore
  const onMapMove = (features: Feature<Point, RegionPayload>) => {
    if (features.geometry.coordinates[0] !== 0 && features.geometry.coordinates[1] !== 0) {
      setCoordinates(
        [
          parseFloat(features.geometry.coordinates[0].toFixed(6)),
          parseFloat(features.geometry.coordinates[1].toFixed(6)),
        ],
      );
      setZoomLevel(features.zoomLevel);
    }
  };

  // Component's Life-cycle
  useEffect(() => {
    navigation.setOptions({
      headerRight,
      headerLeft,
    });
  }, [coordinates]);

  useEffect(() => {
    if (
      centerCoordinates
      && coordinates[0].toFixed(4) !== centerCoordinates[0].toFixed(4)
      && coordinates[1].toFixed(4) !== centerCoordinates[1].toFixed(4)
    ) {
      setIsDeviceLocation(false);
    }
  }, [coordinates]);

  return (
    <>
      {/* Coordinates */}
      <View style={styles.coordinatesContainer}>
        <Pressable onPress={onCoordinatesPress} style={styles.coordinatesPressable}>
          <Text style={styles.mapCoordinates}>
            {`${coordinates[1].toFixed(6)}°, ${coordinates[0].toFixed(6)}°`}
          </Text>
          <View style={styles.editIconContainer}>
            <EditIcon color={COLORS_LIGHT.white} />
          </View>
        </Pressable>
      </View>
      {/* End Coordinates */}

      {/* Current Location Button */}
      <Pressable onPress={setCurrentLocation} style={styles.locationIconContainer}>
        {() => {
          if (isDeviceLocation) {
            return IS_ANDROID ? <LocationOnAndroid /> : <LocationOnForIos />;
          } return IS_ANDROID ? <LocationOffAndroid /> : <LocationOffForIos />;
        }}
      </Pressable>
      {/* End Current Location Button */}
      {/* Target */}
      <View style={styles.targetIcon}>
        <TargetIcon />
      </View>
      {/* End Target */}
      {/* Edit Location Dialog */}
      {displayEditDialog && (
        <EditLocationDialog
          coordinates={coordinates}
          displayEditDialog={displayEditDialog}
          onCancelDialogPress={onCancelDialogPress}
          onSaveDialogPress={onSaveDialogPress}
        />
      )}
      {/* End Edit Location Dialog */}
      {/* Map */}
      <MapboxGL.MapView
        style={styles.mapContainer}
        onRegionDidChange={onMapMove}
        styleURL={basemapSelected}
      >
        <MapboxGL.Camera
          animationMode={ANIMATION_MODE}
          animationDuration={ANIMATION_DURATION}
          centerCoordinate={coordinates}
          zoomLevel={zoomLevel}
        />
        <MapboxGL.UserLocation />
      </MapboxGL.MapView>
      {/* End Map */}
    </>
  );
};
