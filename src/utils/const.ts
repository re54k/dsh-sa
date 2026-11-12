/*
 * 定义全局常量
 */
import { getBottomSpace } from 'react-native-iphone-screen-helper'
import { appEnv } from '@/utils/inject'

/** 状态栏高度 */
export const STATUS_BAR_HEIGHT = appEnv.statusBarHeight ?? 0
/** 导航栏高度 */
export const NAV_BAR_HEIGHT = appEnv.navBarHeight ?? 0
/** 状态栏 + 导航栏总高度 */
export const NAV_TOTAL_HEIGHT = STATUS_BAR_HEIGHT + NAV_BAR_HEIGHT

/** 底部安全区域高度 */
export const BOTTOM_SPACE = getBottomSpace()
