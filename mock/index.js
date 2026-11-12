/**
 * mock 服务：启动本地 mock 服务。
 *
 * - 通过 connect-api-mocker 在 8082 端口提供 mock 数据
 * - 匹配请求接口里的 /worklife-go/api，映射到本地 ./mock/api 目录
 */
const http = require('http')
const connect = require('connect')
const cors = require('cors')
const apiMocker = require('connect-api-mocker')

function mock() {
  const app = connect()
  app.use(cors())
  app.use(apiMocker('/worklife-go/api', './mock/api'))
  http.createServer(app).listen(8082)
}

module.exports = mock
