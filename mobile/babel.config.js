module.exports = function (api) {
  const isTest = api.env('test');
  api.cache(true);

  if (isTest) {
    return {
      presets: ['babel-preset-expo'],
      plugins: [],
    };
  }

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
    plugins: ['nativewind/babel', 'react-native-reanimated/plugin'],
  };
};
