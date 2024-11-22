/* eslint-disable global-require */
// External Dependencies
import React, { useState, useEffect } from 'react';
import {
  View, Pressable, Text,
} from 'react-native';

// Dictation dependencies
import { initLlama, LlamaContext } from 'llama.rn';
import RNFS, { exists, mkdir } from 'react-native-fs';

// Internal Dependencies

// Styles
import style from '../Login/components/LoginForm/LoginForm.styles';

interface SummarizationModuleProps {
  dictationString: string;
}

const SummarizationModule = ({ dictationString }: SummarizationModuleProps) => {
  // Components State
  const [isSummarizing, setIsSummarizing] = useState<Boolean>(false);
  const [modelIsLoading, setModelIsLoading] = useState<Boolean>(false);
  const [context, setContext] = useState<LlamaContext | undefined>(undefined);
  // const [messages, setMessages] = useState<string[]>([]);
  const [buttonText, setButtonText] = useState<string>('Press to begin.');

  // handle picking the model & dealing with gguf context
  const handleReleaseContext = async () => {
    if (!context) return;
    console.log('Releasing context...');
    context
      .release()
      .then(() => {
        setContext(undefined);
        console.log('Context released');
      })
      .catch((err) => {
        console.log('Context release failed', err.message);
      });
  };

  const handleInitContext = async (modelFile: string) => {
    await handleReleaseContext();
    console.log('Initializing context...', modelFile);
    initLlama({
      model: modelFile,
      use_mlock: true,
      n_gpu_layers: 0,
    })
      .then((ctx) => {
        console.log('starting context init');
        setContext(ctx);
        console.log('Context initialized!');
      })
      .catch((err) => {
        console.log('Context init failed', err.message);
      });
  };

  const handleModelSetup = async () => {
    setModelIsLoading(true);
    const modelDir = `${RNFS.DocumentDirectoryPath}/models`;
    const modelDirExists = await exists(modelDir);
    console.log('Model dir', modelDir, 'exists');
    const modelName = [modelDir, 'llama3.2-1b.gguf'].join('/');
    if (!modelDirExists) {
      try {
        await mkdir(modelDir);
      } catch (error) {
        console.log(`Could not create thumbnails folder -> ${error}`);
      }
    }

    const modelExists = await exists(modelName);
    if (!modelExists) {
      try {
        await RNFS.downloadFile({
          fromUrl: 'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q6_K.gguf?download=true',
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
    await handleInitContext(modelName);
    setModelIsLoading(false);
  };

  const queryModel = async (message: string) => {
    const msgs = [{
      role: 'system',
      content: 'This is a conversation between user and assistant, a friendly chatbot.\n\n',
    }, {
      role: 'user',
      content: 'You are a JSON summarization assistant. Summarize any input given to you as a JSON object and return the object. Be precise and succinct. Do not output anything other than the JSON object.\n\n',
    }, {
      role: 'user',
      content: `${message}\n\n`,
    }];

    setIsSummarizing(true);
    context
      ?.completion(
        {
          messages: msgs,
          n_predict: 100,
          xtc_probability: 0.5,
          xtc_threshold: 0.1,
          temperature: 0.1,
          top_k: 40, // <= 0 to use vocab size
          top_p: 0.5, // 1.0 = disabled
          typical_p: 1.0, // 1.0 = disabled
          penalty_last_n: 256, // 0 = disable penalty, -1 = context size
          penalty_repeat: 1.18, // 1.0 = disabled
          penalty_freq: 0.0, // 0.0 = disabled
          penalty_present: 0.0, // 0.0 = disabled
          mirostat: 0, // 0/1/2
          mirostat_tau: 5, // target entropy
          mirostat_eta: 0.1, // learning rate
          penalize_nl: false, // penalize newlines
          seed: -1, // random seed
          n_probs: 0, // Show probabilities
          stop: [
            '</s>',
            '<|end|>',
            '<|eot_id|>',
            '<|end_of_text|>',
            '<|im_end|>',
            '<|EOT|>',
            '<|END_OF_TURN_TOKEN|>',
            '<|end_of_turn|>',
            '<|endoftext|>',
          ],
        },
      )
      .then((completionResult) => {
        console.log('completionResult: ', completionResult.text);
        const timings = `${completionResult.timings.predicted_per_token_ms.toFixed()}ms per token, ${completionResult.timings.predicted_per_second.toFixed(
          2,
        )} tokens per second`;
        console.log(timings);
        setIsSummarizing(false);
      })
      .catch((e) => {
        console.log('completion error: ', e);
      });
  };

  const handleModelButton = async (message: string) => {
    if (!context) {
      await handleModelSetup();
    }

    if (message) {
      queryModel(message);
    }
  };

  // figure out what text to display
  useEffect(() => {
    let text = '';
    if (context) { // context is ready for querying
      if (isSummarizing) {
        text = 'Summarizing...';
      } else {
        text = 'Summarize Dictation ';
      }
    } else if (modelIsLoading) { // context is not set up
      text = 'Loading model...';
    } else { // context is not set up and model is not loading yet
      text = 'Press to begin.';
    }
    setButtonText(text);
  }, [context, isSummarizing, modelIsLoading]);

  // react component
  return (
    <View style={style.buttonContainer}>
      <Pressable
        style={[style.button,
          (!context || isSummarizing || modelIsLoading || !dictationString) ? style.buttonDisabled : null]}
        onPress={() => handleModelButton(dictationString)}
        testID="LoginView-TalkButton"
      >
        <Text
          style={style.textButton}
          accessibilityLabel="Summarize"
        >
          {buttonText}
        </Text>
      </Pressable>
    </View>
  );
};

export { SummarizationModule };
