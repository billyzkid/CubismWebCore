// Downloads, unzips, and extracts the core files
// necessary to build other packages in the repository

import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

const { mkdir, writeFile, unlink } = fs.promises;

const coreVer = "4-r.6.2";
const coreDir = path.resolve("./dist");

const overwriteExistingFile = false;
const keepZipEntryPath = false;
const keepZipEntryPermission = false;

const downloadInfo = [{
  url: `https://cubism.live2d.com/sdk-web/bin/CubismSdkForWeb-${coreVer}.zip`,
  file: path.join(coreDir, `CubismSdkForWeb-${coreVer}.zip`),
  zipEntries: [{
    entryFile: `CubismSdkForWeb-${coreVer}/Core/live2dcubismcore.d.ts`,
    outFile: path.join(coreDir, "live2dcubismcore.d.ts")
  }, {
    entryFile: `CubismSdkForWeb-${coreVer}/Core/live2dcubismcore.js`,
    outFile: path.join(coreDir, "live2dcubismcore.js")
  }, {
    entryFile: `CubismSdkForWeb-${coreVer}/Core/live2dcubismcore.js.map`,
    outFile: path.join(coreDir, "live2dcubismcore.js.map")
  }, {
    entryFile: `CubismSdkForWeb-${coreVer}/Core/live2dcubismcore.min.js`,
    outFile: path.join(coreDir, "live2dcubismcore.min.js")
  }]
}];

await Promise.all(downloadInfo.map(async info => {
  const success = await download(info.url, info.file);

  if (success && info.zipEntries) {
    await unzip(info.file, info.zipEntries);
  }
}));

async function download(url, file) {
  console.log(`Downloading ${url}`);

  if (!overwriteExistingFile && fs.existsSync(file)) {
    console.warn(`Skipped ${file} (already exists)`);
    return false;
  }

  const buffer = await fetch(url).then(res => res.arrayBuffer());
  const data = new Uint8Array(buffer);
  const dir = path.dirname(file);

  await mkdir(dir, { recursive: true }).then(() => writeFile(file, data));

  console.log(`Downloaded ${file}`);
  return true;
}

async function unzip(file, entries) {
  console.log(`Unzipping ${file}`);

  const zip = new AdmZip(file);

  for (const { entryFile, outFile } of entries) {
    extract(zip, entryFile, outFile);
  }

  await unlink(file);
  console.log(`Deleted ${file}`);
}

function extract(zip, entryFile, outFile) {
  console.log(`Extracting ${outFile}`);

  const outDir = path.dirname(outFile);
  const outFileName = path.basename(outFile);

  try {
    zip.extractEntryTo(entryFile, outDir, keepZipEntryPath, overwriteExistingFile, keepZipEntryPermission, outFileName);
  } catch (x) {
    if (!(x && x.message.includes("already exists") && !overwriteExistingFile)) {
      throw x;
    }
  }
}
