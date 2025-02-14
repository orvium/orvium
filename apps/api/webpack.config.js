const { NxWebpackPlugin } = require('@nx/webpack');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/api'),
  },
  plugins: [
    new NxWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      transformers: [
        {
          name: "@nestjs/swagger/plugin",
          options: {
            classValidatorShim: true,
            introspectComments: true,
            dtoFileNameSuffix: [
              ".dto.ts",
              ".schema.ts"
            ]
          }
        }
      ]
    }),
  ],
};
