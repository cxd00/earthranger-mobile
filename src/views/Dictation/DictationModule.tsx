/* eslint-disable global-require */
// External Dependencies
import React, {
  useCallback, useRef, useState, useEffect,
} from 'react';
import {
  View, Pressable, Text,
} from 'react-native';

// Dictation dependencies
import Vosk from 'react-native-vosk';

// Internal Dependencies
import { SummarizationModule } from './SummarizationModule';

// Styles
import style from '../Login/components/LoginForm/LoginForm.styles';

const DictationModule = () => {
  // Components State
  const [isDictating, setIsDictating] = useState(false);
  const [modelReady, setModelReady] = useState<Boolean>(false);
  const [dictation, setDictation] = useState<string[] | undefined>();
  const [buttonText, setButtonText] = useState<string>('Start Recording');
  const [confidences, setConfidences] = useState<number[] | undefined>();

  // features
  const vosk = useRef(new Vosk()).current;
  const rawDictations: string[] = [];
  const rawConfidences: number[] = [];

  const getButtonState = () => {
    if (!modelReady) {
      setButtonText('Loading model...');
    } else {
      if (isDictating) {
        setButtonText('Dictation in progress...press to stop');
      } else {
        setButtonText('Start Recording');
      }
    }
  };
  
  const loadModel = useCallback(() => {
    vosk
      .loadModel('vosk-model-small-en-us-0.15')
      .then(() => { setModelReady(true); console.log('Model loaded'); })
      .catch((e) => console.error(e));
  }, [vosk]);

  const record = (dictationStarted: Boolean) => {
    setIsDictating(!dictationStarted);

    if (!modelReady) {
      loadModel();
    }

    if (!isDictating) {
      vosk
        .start()
        .then(() => {
          console.log('Starting recognition...');
        })
        .catch((e) => console.error(e));
    } else {
      console.log(dictation, confidences);
      vosk.stop();
    }
  };

  useEffect(() => {
    if (!modelReady) {
      loadModel();
    }

    const resultEvent = vosk.onResult((res) => {
      const fullResult = JSON.parse(res);
      rawDictations.push(...fullResult.map((x) => x.word));
      rawConfidences.push(...fullResult.map((x) => x));
      setDictation(rawDictations);
      setConfidences(rawConfidences);
      console.log('post-event', rawDictations, rawConfidences);
    });

    // const partialResultEvent = vosk.onPartialResult((res) => {
    //   rawDictations.push(res);
    //   setDictation(rawDictations);
    // });

    // const finalResultEvent = vosk.onFinalResult((res) => {
    //   rawDictations.push(res);
    //   setDictation(rawDictations);
    // });

    const errorEvent = vosk.onError((e) => {
      console.error(e);
    });

    const timeoutEvent = vosk.onTimeout(() => {
      console.log('Recognizer timed out');
      setIsDictating(false);
    });

    return () => {
      resultEvent.remove();
      //   partialResultEvent.remove();
      //   finalResultEvent.remove();
      errorEvent.remove();
      timeoutEvent.remove();
    };
  }, [vosk]);

  return (
    <View style={style.buttonContainer}>
      <Text>
        {dictation?.map((word, i) => {
          if (confidences && confidences.length > 0 && confidences[i] < 0.5) {
            return `<${word} (${confidences[i]})>`;
          }
          return word;
        }).join(' ')}
      </Text>
      <Pressable style={[style.button, modelReady ? null : style.buttonDisabled]} onPress={() => record(isDictating)} testID="LoginView-TalkButton">
        <Text
          style={style.textButton}
          accessibilityLabel="Dictate"
        >
          {buttonText}
        </Text>
      </Pressable>
      <SummarizationModule dictationString={dictation ? dictation.join(' ') : ''} />
    </View>
  );
};

export { DictationModule };
