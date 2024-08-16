module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFiles: ['<rootDir>/test/setup.ts'],
    clearMocks: true,
    coveragePathIgnorePatterns: ['dist'],
    coverageReporters: ['text', ['json', { file: 'integration-final.json' }]],
    coverageDirectory: './coverage/',
    // coverageThreshold: {
    //     "global": {
    //         "branches": 90,
    //         "functions": 90,
    //         "lines": 90,
    //         "statements": -10
    //     }
    // }
};
