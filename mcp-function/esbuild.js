const esbuild = require('esbuild');
const path = require('path');

esbuild.build({
  entryPoints: ['dist/server.js'],
  bundle: true,
  minify: true,
  platform: 'node',
  target: 'node22',
  outfile: 'output/bundle.js',
  external: ['aws-sdk', '@aws-sdk/*'], // AWS SDKはLambda環境に既に存在するため除外
  metafile: true,
}).then(result => {
  // バンドルサイズの情報を出力
  const outputSize = Object.entries(result.metafile.outputs).reduce((acc, [file, data]) => {
    return acc + data.bytes;
  }, 0);
  console.log(`Bundle size: ${(outputSize / 1024 / 1024).toFixed(2)} MB`);
}).catch(() => process.exit(1));
