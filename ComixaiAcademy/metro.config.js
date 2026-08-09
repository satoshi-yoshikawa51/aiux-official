/* 3Dモデル(.glb)と効果音(.wav)をアセットとしてバンドルできるようにする。
   Expoの既定にも含まれているが、SDK更新で外れても壊れないよう明示しておく。 */
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

for (const ext of ['glb', 'gltf', 'bin', 'wav']) {
  if (!config.resolver.assetExts.includes(ext)) config.resolver.assetExts.push(ext);
}

module.exports = config;
