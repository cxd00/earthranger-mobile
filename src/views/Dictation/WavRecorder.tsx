import { useState } from 'react';
import { View, Pressable, Text, PermissionsAndroid, Platform } from 'react-native';
import RNFS, { exists, mkdir } from 'react-native-fs';
import AudioRecord from 'react-native-audio-record';
import { initWhisper } from 'whisper.rn';
import wordsToNumbers from 'words-to-numbers';
import Fuse from 'fuse.js';

import styles from '../Dictation/Dictation.styles';
import { words } from 'lodash-es';

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
        return 'granted' == granted;
    }

    // iOS
    return true;
}

interface WavRecorderProps {
    fieldName: string
    valueSetter: any
    schema: any
}

const WavRecorder = ({ fieldName, valueSetter, schema }: WavRecorderProps) => {
    const [userLocale, setUserLocale] = useState<string>('en');
    const [isRecording, setIsRecording] = useState(false);
    const [hasPermissions, setHasPermissions] = useState(false);
    const [fileDestination, setFileDestination] = useState("");
    const [whisperContext, setWhisperContext] = useState(null);
    const [stopTranscribe, setStopTranscribe] = useState(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const options = {
        sampleRate: 16000,          // default 44100
        channels: 1,                // 1 or 2, default 1
        bitsPerSample: 16,          // 8 or 16, default 16
        audioSource: 6,             // android only (VOICE_RECOGNITION)
        wavFile: `${fieldName}.wav`,         // default 'audio.wav'
    };
    const promptMap = {
        "Method": null,
        "Vessel Size": "1, 5, 18, 25",
        "Vessel Name": "Boat names, like 'The Star Climber'",
        "Action": "Apprehend Chase Nothing"
    };

    async function createDir(path: string) {
        const modelDir = `${RNFS.DocumentDirectoryPath}/${path}`;
        const modelDirExists = await exists(modelDir);
        if (!modelDirExists) {
            try {
                await mkdir(modelDir);
            } catch (error) {
                console.log(`Could not create folder -> ${error}`);
            }
        }
        return modelDir;
    }

    async function downloadModel() {
        const modelDir = await createDir('models');
        const modelName = [modelDir, 'ggml-base-q8_0.bin'].join('/');

        const modelExists = await exists(modelName);
        if (!modelExists) {
            try {
                await RNFS.downloadFile({
                    fromUrl: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q8_0.bin?download=true',
                    toFile: modelName,
                })
                    .promise.then((response) => {
                        console.log('File downloaded!', response);
                    })
                    .catch((err) => {
                        console.log('Download failed', err);
                    });
            } catch (error) {
                console.log('Could not download model:', error);
            }
        }
        return modelName;
    }

    async function loadModel() {
        console.log("going");
        if (whisperContext) {
            console.log("context already initialized");
            return;
        }
        const modelName = await downloadModel()
        try {
            console.log("loading model...", modelName)
            const newContext = await initWhisper({
                filePath: modelName,
                isBundleAsset: false,
                useGpu: false,
                useCoreMLIos: false,

            });
            await setWhisperContext(newContext);
        } catch (err) {
            console.error(err);
        }
    }

    const doTranscribe = async () => {
        if (!whisperContext) {
            setTimeout(() => { console.log("waiting"); }, 1000);
            return;
        }
        var file = `/data/user/0/com.earthranger.debug/files/${fieldName}.wav`;
        const { stop, promise } = whisperContext.transcribe(file, {
            maxLen: 100,
            tokenTimestamps: true,
            onProgress: (cur) => {
                console.log(`Transcribing progress: ${cur}%`)
            },
            language: 'en',
            prompt: fieldName ? promptMap[fieldName] : null,
            onNewSegments: (segments) => {
                console.log('New segments:', segments)
            },
        });
        // setStopTranscribe({ stop });
        const { result } = await promise;
        validateTranscription(result);
        setStopTranscribe(null);
        console.log("ANYTHIN?", result);
        return;
    };

    const onStartRecord = async () => {
        console.log("HELLO");
        if (isRecording) {
            setIsRecording(false);
            return;
        }
        console.log("hello");
        if (!whisperContext) {
            console.log("LOADING MODEL...");
            await loadModel();
            console.log("...MODEL LOADED");
        }

        setHasPermissions(await getPermissions());
        if (!hasPermissions) {
            console.log("no record", hasPermissions);
            // TODO: add some kind of UI display for this
            // setIsRecording(false);        
        }

        setIsRecording(true);

        AudioRecord.init(options);
        console.log("started");
        AudioRecord.start();
        console.log("started again");
        setIsRecording(true);
    };


    const validateTranscription = (transcript: string) => {
        console.log("in validation", transcript);
        if (fieldName == 'Vessel Size') {
            var transcriptAsInt = wordsToNumbers(transcript);
            if (!transcriptAsInt) {
                return "Failure";
            }
            if (transcriptAsInt < 5) {
                valueSetter("less_5_m");
            } else if (transcriptAsInt <= 15) {
                valueSetter("5_to_15_m");
            } else if (transcriptAsInt > 15) {
                valueSetter("greater_15_m");
            } else {
                return "Failure";
            }
        } else if (fieldName == 'Action') {
            console.log(schema?.enum.includes("Chase"), Array.isArray(schema?.enum));
            if (schema?.enum.includes(transcript)) {
                valueSetter(transcript);
            } else {
                let options = {
                    includeScore: true,
                    keys: ['key'],
                    ignoreFieldNorm: true,
                };
                console.log("fuse");
                const fuse = new Fuse(schema?.enum, options);
                const searchResult = fuse.search(transcript);
                console.log(searchResult)
                if (searchResult && searchResult[0] && searchResult[0]?.score && searchResult[0].score < 0.4) {
                    valueSetter(searchResult[0].item);
                }
            }
            return "Failure";
        } else {
            valueSetter(transcript);
        }
    };

    const onStopRecord = async () => {
        // if (!isRecording || isTranscribing) {
        //     return;
        // }
        // AudioRecord.stop();
        // or to get the wav file path
        const audioFile = await AudioRecord.stop();
        setFileDestination(audioFile);
        console.log("STOP", fileDestination, audioFile);
        setIsRecording(false);
        setIsTranscribing(true);
        await doTranscribe();
        setIsTranscribing(false);
    };

    const onButtonPress = async () => {
        if (!isRecording && !isTranscribing) {
            onStartRecord();
        } else if (isRecording) {
            onStopRecord();
        }
    }


    return (
        <View style={styles.audioButtonContainer}>
            <Pressable onPress={onButtonPress}>
                <Text style={isRecording ? styles.pauseRecordButton : styles.recordButton}>{isRecording ? 'Pagre-record...' : 'Mag Rekord'}</Text>
            </Pressable>
            {/* <Pressable onPress={onStopRecord}>
                <Text style={styles.pauseRecordButton}>{'Huminto'}</Text>
            </Pressable> */}
            {isTranscribing ? <Text>Transcribing...</Text> : null}
            {/* <Transcriber file={fileDestination} /> */}
        </View>
    );
};


export default WavRecorder;