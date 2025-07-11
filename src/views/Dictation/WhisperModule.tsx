import {
  Dispatch, SetStateAction, useEffect, useState,
} from 'react';
import { initWhisper } from 'whisper.rn';
import { getLocales } from 'react-native-localize';
import {
  View, Pressable, Text, Platform, PermissionsAndroid,
} from 'react-native';
import style from './Dictation.styles';
import RNFS, { exists, mkdir } from 'react-native-fs';
import { TextInput } from 'react-native-gesture-handler';
// import CheckBox from '@react-native-community/checkbox';

// Internal
// import { err } from 'react-native-svg/lib/typescript/xml';
import { COLORS_LIGHT } from '../../common/constants/colors';

interface WhisperModuleProps {
  setDictationOutput: Dispatch<SetStateAction<string>>;
  setIsCapturing: Dispatch<SetStateAction<boolean>>;
  reportTypeId: string;
}

if (Platform.OS === 'android') {
  // Request record audio permission
  // @ts-ignore
  PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
    title: 'Whisper Audio Permission',
    message: 'Whisper needs access to your microphone',
    buttonNeutral: 'Ask Me Later',
    buttonNegative: 'Cancel',
    buttonPositive: 'OK',
  })
}

const WhisperModule = ({ setDictationOutput, setIsCapturing, reportTypeId }: WhisperModuleProps) => {
  const [userLocale, setUserLocale] = useState<string>('en');
  const [transcriptVerified, setTranscriptVerified] = useState<Boolean>(true);
  const [context, setContext] = useState<{} | undefined>();
  // `Cougar Bedsite Cluster ID 81835 It is not a multi-cluster entry, it is not a revisit. The visit date is Tuesday, May 6, 1247pm. Observers are Elsa Heath and Matt Mahan. First date and time. 4/29/2025, 1 o'clock a.m. Last date and time, 4/29/2025, 9 a.m. Nine total fixes. General location, Dungeon S Road. Habitat, Conifer, Reprod. Estimated stand age, 21-60. Dominant overstory, Douglas fir dominant understory moss area of bed open canopy cover 51 to 75 lat long 47.9 44 114 - 123.0623 to 4 Bed site description, bed is on mossy substrate, grassy with some sticks. Can it be cover over bed 51-75? Bed is beneath a red alder tree. Tree diameter is 15 cm. General comments, it's a fairly fresh bed.`
  // const [dictation, setDictation] = useState<string>(`Cougar Bedsite Cluster ID 81835 It is not a multi-cluster entry, it is not a revisit. The visit date is Tuesday, May 6, 1247pm. Observers are Elsa Heath and Matt Mahan. First date and time. 4/29/2025, 1 o'clock a.m. Last date and time, 4/29/2025, 9 p.m. Nine total fixes. General location, Dungeon S Road. Habitat, Conifer, Reprod. Estimated stand age, 21-60. Dominant overstory, Douglas fir dominant understory moss area of bed open canopy cover 51 to 75 latitude 47.944114 longitude -123.062324 Bed site description, bed is on mossy substrate, grassy with some sticks. Can it be cover over bed 51-75? Bed is beneath a red alder tree. Tree diameter is 15 cm. General comments, it's a fairly fresh bed.`);
  const [dictation, setDictation] = useState<string>('');
  const [modelReady, setModelReady] = useState<Boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<Boolean>(false);
  const [stopTranscribe, setStopTranscribe] = useState<{
    stop: () => void
  } | null>(null)

  useEffect(() => { // get locale
    const locales = getLocales();
    setUserLocale(locales[0].languageCode);
  }, []);

  useEffect(() => {
    setDictationOutput(dictation);
  }, [dictation]);

  const options = {
    language: userLocale,
    maxLen: 1,
    realtimeAudioSec: 300,
    realtimeAudioSliceSec: 15,
    useVad: true,
    audioOutputFile: `${RNFS.DocumentDirectoryPath}/${reportTypeId}.wav`,
    prompt: 'Glossary: Douglas Fir, Reprod, Bed Site, Prey, Matt Mahan, Elsa Heath, Gwalla, Xia, Bao, Salal, Canopy Cover, Red Alder. Dates: 4/29/2025. Times: 12:47 AM, 13:02 PM.',
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
    const modelName = [modelDir, 'ggml-base.en-q5_1.bin'].join('/');

    const modelExists = await exists(modelName);
    if (!modelExists) {
      try {
        await RNFS.downloadFile({
          fromUrl: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en-q5_1.bin?download=true',
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
    return modelName
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
      setContext(whisperContext);
      setDictation('');
      setModelReady(true);
      console.log("loaded model");
    } catch (err) {
      setModelReady(false);
      console.error(err);
    }
  };

  async function startTranscription() {
    setIsTranscribing(true);
    if (!modelReady) {
      console.log("O NO");
    }
    const { stop, subscribe } = await context?.transcribeRealtime(options);
    setStopTranscribe({ stop });
    subscribe(evt => {
      const { isCapturing, data, processTime, recordingTime } = evt
      console.log("dictation data", data, isCapturing);
      setIsCapturing(isCapturing);
      if (data && data.result) {
        setDictation(dictation + ' ' + data.result);
      }
      // else {console.log(
      //   `Realtime transcribing: ${isCapturing ? 'ON' : 'OFF'}\n` +
      //   // The inference text result from audio record:
      //   `Result: ${data.result}\n\n` +
      //   `Process time: ${processTime}ms\n` +
      //   `Recording time: ${recordingTime}ms`,
      // )}

      if (!isCapturing) {
        setStopTranscribe(null)
        console.log('Finished realtime transcribing')
        setIsTranscribing(isCapturing);
      }
    });
  }

  async function handleTranscriptionPress() {
    if (!context) console.log('No cotnext');
    if (stopTranscribe?.stop) {
      await stopTranscribe.stop();
      setIsTranscribing(false);
      setStopTranscribe(null);
    } else {
      setIsTranscribing(true);
      await startTranscription();
    }
  }

  return (
    <View style={style.checkboxContainer}>
      <View style={[style.row, style.checkboxContainer]}>
        <Pressable
          style={[style.button, modelReady ? style.buttonDisabled : null]}
          onPress={() => loadModel()}
          testID="Whisper-LoadButton"
        >
          <Text style={style.textButton} >{modelReady ? 'Model Loaded' : 'Load Model'}</Text>
        </Pressable>
        <Pressable
          style={[style.button, (!modelReady || (!isTranscribing && stopTranscribe?.stop)) ? style.buttonDisabled : null]}
          onPress={() => handleTranscriptionPress()}
          testID="Whisper-DictateButton"
        >
          <Text style={style.textButton}>{stopTranscribe?.stop ? "Stop" : "Start"}</Text>
        </Pressable>
      </View>
      <View>
        <TextInput
          style={{
            width: '100%',
            height: Math.max(150),
            marginTop: 5,
            paddingStart: 8,
            borderWidth: 0.5,
            borderRadius: 3,
            fontSize: 20,
            borderColor: COLORS_LIGHT.G2_secondaryMediumGray,
          }}
          value={dictation}
          multiline={true}
          numberOfLines={4}
          onChangeText={(e) => { setDictation(e) }}
          editable={!isTranscribing}
        ></TextInput>
      </View>
      {/* <View style={[style.row, style.checkboxContainer]}>
        <CheckBox
          tintColor={COLORS_LIGHT.G3_secondaryMediumLightGray}
          onCheckColor={COLORS_LIGHT.white}
          onFillColor={COLORS_LIGHT.brightBlue}
          boxType="square"
          testID="Dictation-Verify"
          tintColors={{ true: COLORS_LIGHT.brightBlue }}
          disabled={false}
          onValueChange={(value: boolean) => {
            setTranscriptVerified(!transcriptVerified);
          }}
          style={style.checkboxAndroid} // todo: platform
        />
        <Text>{"I have verified the transcription text."}</Text>
      </View> */}
      {/* <View>
        {transcriptVerified && <SummarizationModule dictationString={dictation} title={title} updateForm={updateForm} />}
      </View> */}
    </View>
  );

};

export { WhisperModule };


  // return (
  //   <View style={style.buttonContainer}>
  //     {/* <Text>
  //       {dictation}
  //     </Text> */}
  //     <Pressable style={[style.button, modelReady ? style.buttonDisabled : null]} onPress={() => loadModel()} testID="LoginView-TalkButton">
  //       <Text
  //         style={style.textButton}
  //         accessibilityLabel="Dictate"
  //       >
  //         {buttonText}
  //       </Text>
  //     </Pressable>
  //     <Pressable style={[style.button, modelReady ? null : style.buttonDisabled]} onPress={() => handleTranscriptionPress()} testID="LoginView-TalkButton">
  //       <Text
  //         style={style.textButton}
  //         accessibilityLabel="Dictate"
  //       >
  //         {isTranscribing ? "stop" : "start"}
  //       </Text>
  //       <TextInput
  //         style={style.textInput}
  //         value={dictation}
  //         onChangeText={setDictation}
  //       />
  //     </Pressable>
  //     <SummarizationModule dictationString={dictation} />
  //   </View>
  // );