import { useState, useRef, useEffect } from 'react';
import { View, Pressable, Text } from 'react-native';
import { WhisperContext, initWhisper } from 'whisper.rn';
import RNFS, { exists, mkdir } from 'react-native-fs';

import styles from '../Dictation/Dictation.styles';
import { SummarizationModule } from '../Dictation/Summarization';
import { consoleTransport } from 'react-native-logs';

interface TranscriberProps {
    file: string;
}

const Transcriber = ({ file }: TranscriberProps) => {
    const [userLocale, setUserLocale] = useState<string>('en');
    // const [dictation, setDictation] = useState<string>('method is "trawler net" vessel size is 12 meters vessel name is the blue angel action is apprehend');
    const [dictation, setDictation] = useState<string>('');
    const [whisperContext, setWhisperContext] = useState(null);
    const [stopTranscribe, setStopTranscribe] = useState(null);

    const options = {
        language: userLocale,
        maxLen: 1,
        realtimeAudioSec: 300,
        realtimeAudioSliceSec: 20,
        useVad: false,
        audioOutputPath: file,
        // prompt: 'Douglas Fir, Reprod, Bed Site, Prey, Matt Mahan, Elsa Heath, Andy Stratton, salal, canopy cover, red alder, carcass, scat, cache, drag mark, prey. Latitude: 46.41323, longitude: -127.31579',
    }

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
        const modelName = await downloadModel()
        try {
            console.log("loading model...")
            const whisperContext = await initWhisper({
                filePath: modelName,
                isBundleAsset: false,
                useGpu: false,
                useCoreMLIos: false,
            });
            setWhisperContext(whisperContext);
            setDictation('');
            console.log("loaded model", whisperContext);
        } catch (err) {
            console.error(err);
        }
    }

    const onLoadModel = async () => {
        if (whisperContext) {
            console.log("Found pre-existing context", whisperContext);
            await whisperContext.release();
            whisperContextRef.current = null
            console.log("RELEASED");
        }
        console.log("LOADING MODEL...");
        await loadModel();
        console.log("...MODEL LOADED");
        return;
    };

    const onTranscribe = async () => {
        if (!whisperContext) { console.log("NOTHING", whisperContext); return; }
        console.log("okay something", file);
        file = "/data/user/0/com.earthranger.debug/files/test.wav";
        const { stop, promise } = whisperContext.transcribe(file, {
            maxLen: 100,
            tokenTimestamps: true,
            onProgress: (cur) => {
                console.log(`Transcribing progress: ${cur}%`)
            },
            language: 'tl',
            // prompt: 'HELLO WORLD',
            onNewSegments: (segments) => {
                console.log('New segments:', segments)
            },
        });
        // setStopTranscribe({ stop });
        const { result } = await promise;
        setStopTranscribe(null);
        console.log("ANYTHIN?", result);
        setDictation(result);
        return;
    };

    return (
        <View>
            <Pressable onPress={onLoadModel}>
                <Text style={styles.button}>{'Load'}</Text>
            </Pressable>
            <Pressable onPress={onTranscribe}>
                <Text style={styles.button}>{'Transcribe'}</Text>
            </Pressable>
            <Text>{dictation}</Text>
        </View>
    );
};


export default Transcriber;