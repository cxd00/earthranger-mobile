import { useState, useEffect } from 'react';
import { View, Pressable, Text, PermissionsAndroid, Platform } from 'react-native';
import AudioRecorderPlayer, { 
    RecordBackType, 
    AudioSet, 
    AudioEncoderAndroidType, 
    AudioSourceAndroidType,
    AVEncodingOption
} from 'react-native-audio-recorder-player';
import Transcriber from './Transcriber';

const audioRecorderPlayer = new AudioRecorderPlayer();

const getPermissions = async () => {
    if (Platform.OS === 'android') {
        // Request record audio permission
        // @ts-ignore
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
            title: 'Audio Permissions',
            message: 'EarthRanger needs access to your microphone',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
        });
        PermissionsAndroid.requestMultiple([PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE, PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE]);
        console.log(granted);
        return "granted" === granted;
    }
    
    // iOS
    return true;
}

const audioSet: AudioSet = {
    // Android-specific settings
    AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
    AudioSourceAndroid: AudioSourceAndroidType.MIC,
    // Common audio settings (apply on Android as well)
    // Tip: prefer these for consistent quality
    // OutputFormatAndroid: AVEncodingOption.wav, 
    AudioSamplingRateAndroid: 16000,
    AudioEncodingBitRateAndroid: 128000,
    AudioChannelsAndroid: 1,
  };

  interface RecorderProps {
    schema: any,
    setFormEditData: any
  }

const Recorder = ({ schema, setFormEditData }: RecorderProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const [hasPermissions, setHasPermissions] = useState(false);
    const [fileDestination, setFileDestination] = useState("");

    useEffect(() => {
        return () => {
            // Clean up listeners when component unmounts
            try {
                audioRecorderPlayer.removePlayBackListener();
                audioRecorderPlayer.removeRecordBackListener();
            } catch (error) {
                console.log('Error removing listeners:', error);
            }
        };
    }, []);


    const onStartRecord = async () => {
        if (isRecording) {
            setIsRecording(false);
            return;
        }
        
        setHasPermissions(await getPermissions());
        if (!hasPermissions) {
            console.log("no record");
            // TODO: add some kind of UI display for this
            setIsRecording(false);
            return;
        }

        setIsRecording(true);

        const testTime = audioRecorderPlayer.mmss(120);

        console.log('hmm', testTime);
        setIsRecording(true);

        const uri = await audioRecorderPlayer.startRecorder(
            undefined,
            audioSet,
            true
        );

        console.log(uri);
        setFileDestination(uri);
        audioRecorderPlayer.addRecordBackListener((e: RecordBackType) => {
            console.log('🎤 Recording callback:', e);
            // setRecordSecs(Math.floor(e.currentPosition));
            // setRecordTime(
            //   audioRecorderPlayer.mmssss(Math.floor(e.currentPosition))
            // );
          });
    };

    const onStopRecord = async () => {
        if (!isRecording) {
            return;
        }

        const result = audioRecorderPlayer.stopRecorder();
        audioRecorderPlayer.removeRecordBackListener
        console.log("STOP", result);
        setIsRecording(false);
    };

    const onStartPlay = async () => {
        if (isRecording) {
            await onStopRecord();
        }
        console.log("Playing at ", fileDestination);
        const msg = await audioRecorderPlayer.startPlayer(fileDestination);
        console.log("MSG", msg);
    }

    return (
        <View>
            <Text>{'\n'}</Text>
            <Pressable onPress={onStartRecord}>
                <Text>{'Record'}</Text>
            </Pressable>
            <Text>{'\n'}</Text>
            <Pressable onPress={onStopRecord}>
                <Text>{'Stop'}</Text>
            </Pressable>
            <Text>{'\n'}</Text>
            <Pressable onPress={onStartPlay}>
                <Text>{'Play'}</Text>
            </Pressable>
            <Text>{'\n'}</Text>
        </View>
    );
};


export default Recorder;