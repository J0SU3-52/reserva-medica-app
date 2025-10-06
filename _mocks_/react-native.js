// __mocks__/react-native.js
module.exports = {
  Platform: { OS: 'test', select: (obj) => obj.test ?? obj.default },
  NativeModules: {},
  StyleSheet: { create: (styles) => styles },
  // añade lo que necesites si algún test lo pide
};
