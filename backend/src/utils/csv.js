const { stringify } = require('csv-stringify');

function streamCSV(res, rows, columns, filename) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  const stringifier = stringify({ header: true, columns });
  stringifier.pipe(res);
  rows.forEach(r => stringifier.write(r));
  stringifier.end();
}

module.exports = { streamCSV };