const { NxWebpackPlugin } = require('@nx/webpack');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/lambda/api'),
    filename: 'main.js',  // Asegúrate de que el archivo de salida se llama 'main.js'
    libraryTarget: 'commonjs2',  // Asegúrate de que el target sea compatible con AWS Lambda
  },
  plugins: [
    new NxWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/orvium-lambda.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: true,
      outputHashing: 'none',
      generatePackageJson: true,
    }),
  ],
  externals: [  // Excluir dependencias que no necesitan ser empaquetadas
    /^aws-sdk$/,  // AWS SDK ya está disponible en el entorno Lambda
  ],
};
