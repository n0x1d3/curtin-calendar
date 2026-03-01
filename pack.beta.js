// pack.beta.js — same as pack.js but zips build-beta/ and labels the output as a beta release.
// Run via: bun run repack:beta

const { readFileSync, existsSync, mkdirSync } = require('fs');
const { parse, resolve } = require('path');
const AdmZip = require('adm-zip');

try {
  const { base } = parse(__dirname);

  // Read version from the beta build's manifest (build-beta/ must exist first)
  const { version } = JSON.parse(
    readFileSync(resolve(__dirname, 'build-beta', 'manifest.json'), 'utf8')
  );

  const outdir = 'release';

  // Name the zip with a "-beta" suffix so it's clearly distinguishable from stable releases
  const filename = `${base}-v${version}-beta.zip`;

  // Zip up the entire build-beta/ folder
  const zip = new AdmZip();
  zip.addLocalFolder('build-beta');

  // Create the release/ directory if it doesn't exist yet
  if (!existsSync(outdir)) {
    mkdirSync(outdir);
  }

  zip.writeZip(`${outdir}/${filename}`);

  console.log(
    `Success! Created ${filename} under ${outdir}/. Share this ZIP with beta testers — they can load it via chrome://extensions > Load unpacked.`
  );
} catch (e) {
  console.error('Error! Failed to generate beta zip. Make sure you ran bun run build:beta first.');
}
