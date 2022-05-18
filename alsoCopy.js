// eslint-disable-next-line import/no-extraneous-dependencies
const copyfiles = require('copyfiles');

void (async () => {
  await new Promise((resolve) => {
    copyfiles(
      ['-e "node_modules"', 'collect/certs/*', '-a', `${__dirname}/build`],
      {},
      () => {
        // eslint-disable-next-line no-console
        console.log('Extra DA Files Copied');
        resolve();
      },
    );
  });
})();
