// External Dependencies
import axios from 'axios';
import { enablePromise } from 'react-native-sqlite-storage';

// Internal Dependencies
import {
  API_EVENT, API_ATTACHMENT_FILES, getApiUrl, USER_AGENT_VALUE,
} from './EarthRangerService';
import { ApiStatus, FileRequest } from '../common/types/apiModels';
import log from '../common/utils/logUtils';
import { getApiStatus } from '../common/utils/errorUtils';

export const parseDictationForLLM = async (fullResponse: JSON) => {
  // dispatch somewhere after call since async? clarify diff bw service etc.
  
};

export const getLLMResponse = async () => {

};