const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  maxWorkers: 2,
  clearMocks: true,
  collectCoverage: true,
  coverageReporters: [
    'html',
    ['text', { file: '../../../coverage.txt', maxCols: 120 }],
    'text',
    'text-summary',
  ],
  testTimeout: 20000,
  forceExit: true,
};
