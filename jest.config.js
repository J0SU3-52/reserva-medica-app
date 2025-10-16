/** @type {import('jest').Config} */
module.exports = {
    preset: "jest-expo",
    testEnvironment: "jsdom",
    transformIgnorePatterns: [
        "node_modules/(?!(jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-clone-referenced-element|react-native-svg|react-native-web|@react-navigation)"
    ],
    setupFiles: ["whatwg-fetch"],
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    testMatch: ["**/_tests_/**/*.test.[jt]s?(x)"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1"
    }
};
