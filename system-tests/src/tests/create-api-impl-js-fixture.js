const run = require('../utils/run');
const assert = require('../utils/assert');
const sameDirContent = require('../utils/sameDirContent');
const f = require('../../fixtures/constants');

const excludeFilter = [
  'ElectrodeApiImpl.xcodeproj',
  'project.pbxproj',
  'package.json',
  '.DS_Store',
  'index.android.bundle',
  'index.android.bundle.meta',
  'yarn.lock',
  'README.md',
  '.yarn-integrity',
  'node_modules',
]
  .map(s => `**/${s}`)
  .join(',');

run(
  `create-api-impl ${f.movieApiPkgName} -p ${
    f.movieApiImplPkgName
  } --skipNpmCheck --jsOnly --outputDirectory ${process.cwd()} --force`,
);
assert(
  sameDirContent(f.pathToJsApiImplFixture, process.cwd(), { excludeFilter }),
  'Generated API JS Impl differ from reference fixture !',
);
