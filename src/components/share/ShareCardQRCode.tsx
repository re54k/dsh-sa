import type { ImageSourcePropType } from 'react-native'
import { useMemo } from 'react'
import { View } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import Svg, { Circle, Rect, Defs, Image } from 'react-native-svg'
import QRCodeUtil from 'qrcode'
import 'text-encoding'

export interface ShareCardQRCodeProps {
  /** 二维码内容 */
  value?: string
  /** 二维码尺寸 */
  size?: number
  /** 二维码颜色 */
  color?: string
  /** 四周留白 */
  quietZone?: number
  /** 中间 logo 图片 */
  logo?: ImageSourcePropType
  /** logo 尺寸 */
  logoSize?: number
}

interface FinderPatternProps {
  x: number
  y: number
  cellSize: number
  color: string
}

export const ShareCardQRCode = ({
  value = ' ',
  size = 60,
  color = '#000',
  quietZone = 2,
  logo,
  logoSize = 12,
}: ShareCardQRCodeProps) => {
  const styles = useStyles(themeStyles)

  const matrix = useMemo<boolean[][]>(() => {
    try {
      let modules: boolean[][] = [] // 创建一个数组来存储矩阵数据

      const qr = QRCodeUtil.create(value, {
        errorCorrectionLevel: 'H',
      })
      // 转换成二维数组格式
      for (let i = 0; i < qr.modules.size; i++) {
        let row: boolean[] = []
        for (let j = 0; j < qr.modules.size; j++) {
          row.push(!!qr.modules.get(i, j))
        }
        modules.push(row)
      }

      return modules
    } catch (error) {
      console.log('QR Code generation error:', error)
      return []
    }
  }, [value])

  if (!matrix.length) return null

  const cellSize = (size - 2 * quietZone) / matrix.length
  const logoPosition = (size - logoSize) / 2

  // 检查点是否在 logo 区域内
  const isInLogoArea = (x: number, y: number) => {
    if (!logo) return false

    const matrixSize = matrix.length
    const logoStartPoint = Math.floor(matrixSize * 0.352)
    const logoEndPoint = Math.floor(matrixSize * 0.638)

    return x >= logoStartPoint && x <= logoEndPoint && y >= logoStartPoint && y <= logoEndPoint
  }

  // 是否在定位点范围内
  const isInFinderPattern = (row: number, col: number) => {
    const finderPatternSize = 7
    const isInTopLeft = row < finderPatternSize && col < finderPatternSize
    const isInTopRight = row < finderPatternSize && col >= matrix.length - finderPatternSize
    const isInBottomLeft = row >= matrix.length - finderPatternSize && col < finderPatternSize
    return isInTopLeft || isInTopRight || isInBottomLeft
  }

  return (
    <View style={styles.BaseQRCode}>
      <Svg height={size} width={size}>
        <Defs />
        <Rect x={0} y={0} width={size} height={size} fill="white" />

        {/* 渲染数据点 */}
        {matrix.map((row, i) =>
          row.map((cell, j) => {
            if (cell && !isInFinderPattern(i, j) && !isInLogoArea(i, j)) {
              return (
                <Circle
                  key={`${i}-${j}`}
                  cx={quietZone + (j + 0.5) * cellSize}
                  cy={quietZone + (i + 0.5) * cellSize}
                  r={cellSize * 0.4} // 调整圆点大小
                  fill={color}
                />
              )
            }
            return null
          }),
        )}

        {/* 渲染定位点 */}
        <FinderPattern x={quietZone} y={quietZone} cellSize={cellSize} color={color} />
        <FinderPattern x={quietZone + (matrix.length - 7) * cellSize} y={quietZone} cellSize={cellSize} color={color} />
        <FinderPattern x={quietZone} y={quietZone + (matrix.length - 7) * cellSize} cellSize={cellSize} color={color} />

        {/* Logo */}
        {logo && <Image x={logoPosition} y={logoPosition} width={logoSize} height={logoSize} href={logo} />}
      </Svg>
    </View>
  )
}

// 定位点
const FinderPattern = ({ x, y, cellSize, color }: FinderPatternProps) => (
  <>
    {/* 外圈 */}
    <Circle cx={x + 3.5 * cellSize} cy={y + 3.5 * cellSize} r={3.5 * cellSize} fill={color} />
    {/* 内圈 */}
    <Circle cx={x + 3.5 * cellSize} cy={y + 3.5 * cellSize} r={2.5 * cellSize} fill="white" />
    {/* 中心点 */}
    <Circle cx={x + 3.5 * cellSize} cy={y + 3.5 * cellSize} r={1.5 * cellSize} fill={color} />
  </>
)

const themeStyles = createStyles({
  BaseQRCode: {
    borderRadius: 3,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
})
