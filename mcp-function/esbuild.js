const esbuild = require('esbuild');
const path = require('path');

esbuild.build({
  entryPoints: ['dist/server.js'],
  bundle: true,
  minify: true,
  platform: 'node',
  target: 'node22',
  outfile: 'output/bundle.js',
  external: ['aws-sdk', '@aws-sdk/*'], // Exclude AWS SDK as it already exists in the Lambda environment
  metafile: true,
}).then(result => {
  // Output bundle size information
  const outputSize = Object.entries(result.metafile.outputs).reduce((acc, [file, data]) => {
    return acc + data.bytes;
  }, 0);
  console.log(`Bundle size: ${(outputSize / 1024 / 1024).toFixed(2)} MB`);
}).catch(() => process.exit(1));
