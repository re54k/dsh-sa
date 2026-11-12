import { View, Text } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import { appHosts } from '@/utils/inject'
import { BOTTOM_SPACE } from '@/utils/const'
import app from '@/../app.json'

export const AppVersion = () => {
  const styles = useStyles(themeStyles)

  const isOnline = /gw\.m/.test(appHosts.gw_m_163_com || '') || /api\.mifengs/.test(appHosts.api_mifengs_com || '')
  const isShow = !__DEV__ && !isOnline

  return (
    isShow && (
      <View style={styles.AppVersion}>
        <Text style={styles.text}>Build {app.buildVersion}</Text>
        <Text style={styles.text}>{app.buildTime}</Text>
      </View>
    )
  )
}

const themeStyles = createStyles({
  AppVersion: {
    alignItems: 'center',
    position: 'absolute',
    zIndex: 9999,
    right: 8,
    bottom: BOTTOM_SPACE + 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#00000060',
  },
  text: {
    fontSize: 10,
    lineHeight: 14,
    color: '#fff',
  },
})
