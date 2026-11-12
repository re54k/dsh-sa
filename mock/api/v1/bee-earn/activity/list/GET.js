const path = require('path')
const { delay, file } = require('connect-api-mocker/helpers')

module.exports = [delay(300), file(path.join(__dirname, 'res.json'))]
