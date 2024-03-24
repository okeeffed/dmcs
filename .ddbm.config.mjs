import path from 'node:path';
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const entry = path.resolve(__dirname, 'examples/parse-route-information');

export default {
  entry,
  ignore: (file) => {
    if (file.includes('.ts')) {
      return true;
    }

    return false;
  },
};
