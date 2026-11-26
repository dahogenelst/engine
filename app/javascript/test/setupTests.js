import { TextEncoder, TextDecoder } from 'util';

// jsdom lacks these; react-router 7 needs them
Object.assign(global, { TextEncoder, TextDecoder });

global.Locomotive = {
  data: {
    locale: 'en'
  },
  i18n: {
    'views': {
      'startup': {
        'waiting': 'Waiting...'
      }
    }
  }
};

