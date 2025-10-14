/* eslint-disable global-require */
// External Dependencies
import React, { 
  useState, useEffect, Dispatch, SetStateAction 
} from 'react';
import {
  View, Pressable, Text,
} from 'react-native';

// Dictation dependencies
import { initLlama, LlamaContext } from 'llama.rn';
import RNFS, { exists, mkdir } from 'react-native-fs';
import Fuse from 'fuse.js';

// Internal Dependencies
import { validateJSONSchema } from '@earthranger/react-native-jsonforms-formatter';
import { IS_ANDROID } from '../../common/constants/constants';

// Styles
import style from '../Login/components/LoginForm/LoginForm.styles';

interface SummarizationModuleProps {
  dictationString: string;
  schema: any;
  setFormEditData: Dispatch<SetStateAction<{ [key: string]: any }>>;
}

// const systemPrompt = "Cutting Knowledge Date: December 2023\nToday Date: 13 Jun 2025\n\nYou are a helpful chatbot who converts audio transcripts from rangers doing wildlife surveys into a list of keys and values. Here are the definitions of the keys you should know:\ncluster_id: ID of the cluster, cougar_id: ID of the cougar, multi_cluster_entry: Whether this cluster is associated with another cluster, revisit: Whether this is a revisit of a site, visit_date: Date of the visit, observers: Ranger making the report., first_date_time: First Date/Time of the cluster, last_date_time: Last Date/Time of the cluster, num_points: Number of points/fixes in the cluster, general_location: General Location, habitat: Habitat type, est_stand_age: Estimated Age of the forest stand in years, dominant_overstory: Dominant Overstory species, dominant_understory: Dominant Understory species, area_cover: Area over which the carcass is spread, canopy_cover: Percent canopy Cover, canopy_cover_over_bed: Percent canopy cover over the bed or kill, prey_species: Prey Species, tissue_sample: Whether a tissue sample was taken, latitude: Latitude, longitude: Longitude, prey_sex: Sex of the prey, young_in_utero: Whether there was an unborn animal in the prey, prey_age: Age of the prey, carcass_cached: Whether the carcass was cached, cached_with: What the prey was cached with, carcass_hidden: Whether the carcass was hidden, drag_mark: Whether a drag mark was observed, distance_dragged_m: The distance the prey was dragged, blood_or_hair_in_drag: Whether there was blood or hair in drag marks, days_between: Days between carcass abandonment and examination, utilization: Percent of Carcass eaten, marrow_consistency: Marrow Consistency, marrow_color: Marrow Color, scavenger_sign_present: Whether signs of savengers were present, scavenger_species: Species of scavenger, scavenger_obs_type: Type of scavenger observed, scavenger_obs_description: Description of observations of the scavenger, displaced: Whether the cat was displaced from its kill, displaced_by: What displaced the cat, camera_deployed: Whether a camera was deployed, general_comments: Extra commentary on the observation, beneath_tree_sp: Species of tree over cougar bed, diameter_of_tree_cm: Diameter of tree over cougar bed in centimeters, associated_with_kill: Whether the bed site is associated with a nearby kill.\nYou must only include keys and values found in the given transcript. Be concise. Do not repeat any keys.";

const SummarizationModule = ({ dictationString, schema, setFormEditData }: SummarizationModuleProps) => {
  // Components State
  var systemPrompt = '';
  const [isSummarizing, setIsSummarizing] = useState<Boolean>(false);
  const [modelIsLoading, setModelIsLoading] = useState<Boolean>(false);
  const [context, setContext] = useState<LlamaContext | undefined>(undefined);
  // const [messages, setMessages] = useState<string[]>([]);
  const [buttonText, setButtonText] = useState<string>('Press to begin.');
  // const [modelName, setModelName] = useState<string>('');

  // parse text output carefully
  const parseOutput = (txt: string) => {
    let splitText = txt.split('\n');
    let realText = splitText.reduce(function(a, b) {
      return a.length > b.length ? a : b
    });
    const pattern = new RegExp('(\[a-zA-Z_\]+):\\s*(\{([^{}]+)\}|\\[[^\\]]*\\]|[^\\[\\],]+)', 'g');
    realText = realText.replace(/(?<=\d):(?=\d)/g, '-').replace(/(?<=\d)\,\s(?=\d)/g, ' ');
    // const pattern = /(\[a-zA-Z_\]+):\\s*(\{([^{}]+)\}|\\[[^\\]]*\\]|[^\\[\\],]+)/g;
    let dataDraft : { [key: string]: string } = {};
    Array.from(realText.matchAll(pattern)).map((t) => {
      let key = `${t[1]}`;
      dataDraft[key] = t[2];
    })

    return dataDraft;
  };

  const validateGenData = (txt: string, schemaString: string) => {
    let schema = validateJSONSchema(schemaString);
    let dataToSchema = {
      'fence_type': 'fence_type',
      'fence_length': 'fence_length',
      'fence_notes': 'fence_notes',
      'break_severity': 'fence_break',
      'fence_status': 'fence_status',
    };
    let data = parseOutput(txt);
    let validData: {[key: string]: any} = {};
    console.log("schema", schema);
    for (const key in data) {
      console.log("seeing", key);
      
      let newKey: string;
      if (!schema?.schema?.properties && !schema?.properties ) {console.log(typeof schema, schema["$schema"])}
      if (key.includes('t_delta')) {
        validData[key] = data[key];
        continue;
      }
      if (!(Object.hasOwn(schema?.schema?.properties || schema?.properties, key))) { // if the key is wrong...
        if (Object.hasOwn(dataToSchema, key)) {
          console.log("getting replacement key...");
          validData[dataToSchema[key]] = data[key];
        }
        let options = {
          includeScore: true,
          keys: ['key'],
          ignoreFieldNorm: true,
        };
        const fuse = new Fuse(schema?.['definition'], options);
        const searchResult = fuse.search(key);
        console.log("\nsearch key", searchResult);
        
        if (searchResult && searchResult[0] && searchResult[0]?.score && searchResult[0].score < 0.4) {
          // sufficiently low to take the first one
          newKey = searchResult[0].item.key;
          console.log("new key", newKey);
        } else {
          console.log(searchResult);
          continue;
        }
      } else {
        newKey = key;
      }
      
      // once key is found, 
      // find closest match for all enums and titles
      if (schema?.schema?.properties[newKey]?.enumNames || schema?.schema?.properties[newKey]?.items?.enum || schema?.dictionary?.find((elt) => {
        return elt.key === 'multi_select_field';
      })) { 
        // for all select fields
        let splitArray;
        let isMulti;
        if (data[key].includes('[')) {  // check for multiple entries
          splitArray = data[key].split(',').map((word: string) => { return word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ''); });
          isMulti = true;
        } else if (Array.isArray(data[key])) {
          splitArray = data[key];
          isMulti = true;
        } else {
          splitArray = [data[key]];
          isMulti = false;
        }

        let optionsArray;
        if (schema?.schema?.properties[newKey]?.enum) { // if you want to check through select values
          optionsArray = schema?.schema?.properties[newKey]?.enum;
        } else if (schema?.schema?.properties[newKey]?.items?.enum) {
          optionsArray = schema?.schema?.properties[newKey]?.items?.enum;
        } else {
          optionsArray = schema?.definition?.find((elt) => { return elt.key === newKey })?.titleMap.map((k) => {return k.value});
        }
        console.log("Obtained optionsArray", newKey, splitArray, isMulti);
        // optionsArray = schema?.schema?.properties[newKey]?.enumNames || schema?.schema?.definition.find((elt) => {return elt.key === newKey}).titleMap.map((k) => {return value});
        splitArray = splitArray.map((elt: string) => {
          if (optionsArray.includes(elt)) {
            return elt;
          }
          const options = {
            includeScore: true,
            isCaseSensitive: false,
            ignoreFieldNorm: true,
          };
          let fuse = new Fuse(optionsArray, options);
          let searchResult = fuse.search(elt);
          console.log("\nsearch val", searchResult);
          if (searchResult && searchResult[0] && searchResult[0]?.score < 0.5) {
            return searchResult[0].item;
          }
          return null;
        }).filter((elt) => { if (elt) { return true; } else { return false; } });
        if (splitArray.length < 1) {
          continue;
        } else if (!isMulti && splitArray.length === 1) {
          validData[newKey] = splitArray[0];
        } else {
          validData[newKey] = splitArray;
        }
      } else {  // or if it's a free-entry field, check to make sure the type is right
        let entryType = schema?.schema?.properties[newKey]?.type ? schema?.schema?.properties[newKey]?.type : schema?.schema?.properties[newKey]?.newKey;
        // var output;
        if (!entryType) {continue;}
        if (entryType === 'number') {
          validData[newKey] = parseInt(`${data[key]}`.replace(/[^0-9]/g, ''));
        } else {
          validData[newKey] = `${data[key]}`;
        }
      }
    }
    console.log("inner", validData);
    validData['visit_date'] = new Date().toISOString();
    setFormEditData({...validData});
    return validData 
  };

  // handle picking the model & dealing with gguf context
  const handleReleaseContext = async () => {
    if (!context) {
      console.log("Cannot release, context not available");
      return
    };
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
      n_ctx: 2048,
      use_mlock: false,
      use_progress_callback: true,
      n_gpu_layers: 0, // IS_ANDROID? 0 : 99, // 0 for android, 99 for ios
    }, (progress: number) => {
      console.log('progress: ', progress);
    },)
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
    const modelName = [modelDir, 'fence-llm.gguf'].join('/');
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
          fromUrl: 'https://huggingface.co/cxd00/fence-llm/resolve/main/fence-llm.gguf?download=true',
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
    RNFS.stat(modelName)
      .then((stats) => {console.log(stats.size);})
      .catch((err) => {})
    await handleInitContext(modelName);
    setModelIsLoading(false);
  };

  const queryModel = async (message: string) => {
    // await handleModelSetup();
    systemPrompt = `\n\nCutting Knowledge Date: December 2023\nToday Date: 30 Jul 2025\n\nYou are a helpful chatbot who converts audio transcripts from rangers doing wildlife surveys into a list of keys and values. Here are the definitions of the keys you should know:\nfence_type: whether this is the cattle or game fence, \nrepair_status: whether or not the fence has been repaired, \nbreak_severity: whether the fence is fully, half, or not broken, \ngap_length: length of the gap in meters, \nnotes: any additional information on the fence break,.\nYou must only include keys and values found in the given transcript. Be concise. Do not repeat any keys.<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n`;
    if (context) {
      setIsSummarizing(true);
    }
    let startTime = new Date().getTime() / 1000;
    context
      ?.completion(
          {
            prompt: systemPrompt + message + '<|eot_id|>assistant\n\n', 
            n_predict: 256,
            stop: ['<|eot_id|>', '<|end_header_id|>'],
            temperature: 0,
            top_p: 0.3,
            top_k: 20,
            min_p: 0.05,
            // penalty_last_n: 64,
            // penalty_repeat: 1.0,
            // penalty_present: 0,
            // penalty_freq: 0,
            // xtc_probability: 0,
            // xtc_threshold: 0.1,
            // typical_p: 1,
          }
      )
      .then((completionResult) => {
        let endTime = new Date().getTime() / 1000;
        console.log('completionResult: ', completionResult.text, endTime - startTime);
        validateGenData(completionResult.text + `, t_delta: ${endTime-startTime}`, schema);
        // setFormEditData(validData);
        const timings = `${completionResult.timings.predicted_per_token_ms.toFixed()}ms per token, ${completionResult.timings.predicted_per_second.toFixed(
          2,
        )} tokens per second`;
        console.log(timings);
        setIsSummarizing(false);
      })
      .catch((e) => {
        console.log('completion error: ', e);
        setIsSummarizing(false);
      });
  };

  const handleModelButton = async (message: string) => {
    if (!context) {
      console.log("Context not ready");
      await handleModelSetup();
    }

    if (message) {
      console.log(message);
      queryModel(message + '<|eot_id|><|start_header_id|>assistant<|end_header_id|>');
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
      text = 'Press to load summary model.';
    }
    setButtonText(text);
  }, [context, isSummarizing, modelIsLoading]);

  // react component
  return (
    <View style={style.buttonContainer}>
      <Pressable
        style={[style.button,
         ( (!context || isSummarizing || modelIsLoading) && !(!context && !isSummarizing && !modelIsLoading)) || modelIsLoading ? style.buttonDisabled : null]}
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
