import type { ReactElement, ReactNode } from 'react'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import type { ImageSourcePropType } from 'react-native'
import { createStyles, useStyles, ThemeImage } from '@mf2e/react-native-theme-styles'
import type {
  ApplyConditionItem,
  ExtraModuleItem,
  IncentiveItem,
  ReferenceFileItem,
  ReferenceLinkItem,
} from '@/types/BeeEarnActivityType'
import { Assets } from '../assets'

/** 去除 HTML 标签取纯文本（submitNotice/notes 为 HTML 富文本，富文本渲染延后） */
const stripHtml = (html?: string): string =>
  (html || '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()

/** 从 HTML 中提取链接（a 标签文案 + href），并从正文中移除 */
const extractLinks = (html?: string): { text: string; links: { text: string; url: string }[] } => {
  const links: { text: string; url: string }[] = []
  const withoutLinks = (html || '').replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g, (_, url, text) => {
    links.push({ text, url })
    return ''
  })
  return { text: stripHtml(withoutLinks), links }
}

/** 蓝色链接行（#527acd，视觉稿投稿须知/注意事项链接色） */
const LinkLine = ({ text }: { text: string }): ReactElement => {
  const styles = useStyles(themeStyles)

  return (
    <Pressable onPress={() => onLinkLinePress(text)}>
      <Text style={styles.linkLine}>{text}</Text>
    </Pressable>
  )
}

/** 富文本链接跳转（TODO：接 mnb navigator.open） */
const onLinkLinePress = (text: string): void => {
  // TODO: 富文本链接跳转待接入
}

interface SectionProps {
  title: string
}

/** 内容模块通用 Section：白卡 r12 + 标题 17 Semibold + 正文 16/26 */
const Section = ({ title, children }: SectionProps & { children: ReactNode }): ReactElement => {
  const styles = useStyles(themeStyles)

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

interface NoticeSectionProps {
  /** 投稿须知 HTML */
  submitNotice?: string
}

/** 投稿须知/任务要求（submitNotice）：正文 + 底部蓝色链接行 */
export const NoticeSection = ({ submitNotice }: NoticeSectionProps): ReactElement => {
  const styles = useStyles(themeStyles)
  const { text, links } = extractLinks(submitNotice)

  if (!text && !links.length) return <></>

  return (
    <Section title="投稿须知">
      <Text style={styles.body}>{text}</Text>
      {links.map((link) => (
        <LinkLine key={link.url} text={link.text} />
      ))}
    </Section>
  )
}

interface IncentiveSectionProps {
  incentives?: IncentiveItem[]
}

/** 激励方式：小标题 + 正文，超出折叠 + 「展开全部」胶囊 */
export const IncentiveSection = ({ incentives }: IncentiveSectionProps): ReactElement => {
  const styles = useStyles(themeStyles)
  const [expanded, setExpanded] = useState(false)

  if (!incentives?.length) return <></>

  return (
    <Section title="激励方式">
      <View style={expanded ? undefined : styles.incentiveCollapsed}>
        {incentives.map((item, index) => (
          <View key={index} style={styles.incentiveItem}>
            {item.title ? <Text style={styles.incentiveTitle}>[{item.title}]</Text> : null}
            <Text style={styles.body}>{stripHtml(item.content)}</Text>
          </View>
        ))}
      </View>
      {!expanded ? (
        <Pressable style={styles.expandBtn} onPress={() => setExpanded(true)}>
          <Text style={styles.expandText}>展开全部</Text>
        </Pressable>
      ) : null}
    </Section>
  )
}

interface ExtraSectionProps {
  extraModules?: ExtraModuleItem[]
}

/** 拓展模块（最多 6 个）：二级标题 + 正文 */
export const ExtraSection = ({ extraModules }: ExtraSectionProps): ReactElement => {
  const styles = useStyles(themeStyles)

  if (!extraModules?.length) return <></>

  return (
    <Section title="拓展模块">
      {extraModules.map((item, index) => (
        <View key={index} style={styles.incentiveItem}>
          {item.title ? <Text style={styles.incentiveTitle}>{item.title}</Text> : null}
          <Text style={styles.body}>{stripHtml(item.content)}</Text>
        </View>
      ))}
    </Section>
  )
}

interface ApplyConditionSectionProps {
  conditions?: ApplyConditionItem[]
}

/** 报名条件：黄勾/红! 状态图标 + 条目文案 + 右侧操作链接（PRD 确认黄色） */
export const ApplyConditionSection = ({ conditions }: ApplyConditionSectionProps): ReactElement => {
  const styles = useStyles(themeStyles)

  if (!conditions?.length) return <></>

  return (
    <Section title="报名条件">
      {conditions.map((item, index) => (
        <View key={index} style={styles.conditionItem}>
          <ThemeImage
            style={styles.conditionIcon}
            source={item.satisfied ? Assets.iconCheckYellow : Assets.iconExclaimRed}
          />
          <Text style={styles.conditionText}>{item.label}</Text>
          {!!item.jumpText ? (
            <Pressable style={styles.conditionLink} onPress={() => onConditionLink(item)}>
              <Text style={styles.conditionLinkText}>{item.jumpText}</Text>
              <ThemeImage style={styles.conditionArrow} source={Assets.iconArrowRight} />
            </Pressable>
          ) : null}
        </View>
      ))}
    </Section>
  )
}

/** 报名条件操作链接跳转（本期 M6 绑定页未还原，外链先占位） */
const onConditionLink = (item: ApplyConditionItem): void => {
  // TODO: 线上已有页（信用分/认证）走 mnb navigator.open，绑定流程 M6 实现后接入
}

interface NotesSectionProps {
  notes?: string
}

/** 注意事项 */
export const NotesSection = ({ notes }: NotesSectionProps): ReactElement => {
  const styles = useStyles(themeStyles)
  const text = stripHtml(notes)

  if (!text) return <></>

  return (
    <Section title="注意事项">
      <Text style={styles.body}>{text}</Text>
    </Section>
  )
}

interface ReferenceSectionProps {
  files?: ReferenceFileItem[]
  links?: ReferenceLinkItem[]
}

/** 参考资料 + 参考链接 */
export const ReferenceSection = ({ files, links }: ReferenceSectionProps): ReactElement => {
  const styles = useStyles(themeStyles)

  return (
    <>
      {!!files?.length ? (
        <Section title="参考资料">
          {files.map((file, index) => (
            <Pressable key={index} style={styles.fileItem} onPress={() => onFilePress(file)}>
              <View style={styles.fileIconWrap}>
                <ThemeImage style={styles.fileIcon} source={resolveFileIcon(file)} />
                {(file.type === 2 || file.fileext === 'mp4') && (
                  <View style={styles.playBadge}>
                    <View style={styles.playTriangle} />
                  </View>
                )}
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={styles.fileSize}>{formatFileSize(file.fileSize)}</Text>
              </View>
            </Pressable>
          ))}
        </Section>
      ) : null}
      {!!links?.length ? (
        <Section title="参考链接">
          {links.map((link, index) => (
            <Pressable key={index} style={styles.linkItem} onPress={() => onLinkPress(link)}>
              <ThemeImage style={styles.linkIcon} source={Assets.iconNoteLink} />
              <Text style={styles.linkText} numberOfLines={1}>
                {link.title}
              </Text>
            </Pressable>
          ))}
        </Section>
      ) : null}
    </>
  )
}

/** 文件预览（新页面，本期先占位） */
const onFilePress = (file: ReferenceFileItem): void => {
  // TODO: 接入文件预览页（同百科文件预览）
}

/** 参考链接跳转 */
const onLinkPress = (link: ReferenceLinkItem): void => {
  // TODO: 站内笔记走 openPage，外链走 mnb navigator.open
}

/** 文件大小：字节 → KB */
const formatFileSize = (size?: number): string => {
  if (!size) return ''
  return `${Math.max(1, Math.round(size / 1024))}KB`
}

/** 文件类型图标：pdf → PDF 图标，其余 → 图片缩略图标 */
const resolveFileIcon = (file: ReferenceFileItem): ImageSourcePropType => {
  return file.fileext === 'pdf' ? Assets.iconPdf : Assets.iconImageFile
}

const themeStyles = createStyles({
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22.5,
    color: '#333',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
    color: '#333',
  },
  incentiveCollapsed: {
    height: 120,
    overflow: 'hidden',
  },
  incentiveItem: {
    marginBottom: 10,
  },
  incentiveTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  expandBtn: {
    alignSelf: 'center',
    backgroundColor: '#f5f7f9',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 40,
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 4,
    marginTop: 12,
    marginBottom: 4,
  },
  expandText: {
    fontSize: 16,
    color: '#333',
  },
  linkLine: {
    fontSize: 16,
    lineHeight: 32,
    color: '#527acd',
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
  },
  conditionIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  conditionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 26,
    color: '#333',
  },
  conditionLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conditionLinkText: {
    fontSize: 15,
    color: '#ffd917',
    fontWeight: '500',
  },
  conditionArrow: {
    width: 15,
    height: 15,
  },
  fileItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    marginBottom: 8,
  },
  fileIconWrap: {
    width: 48,
    height: 48,
    marginRight: 10,
  },
  fileIcon: {
    width: 48,
    height: 48,
  },
  playBadge: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 3,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftColor: '#fff',
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 2,
  },
  fileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 14,
    color: '#333',
  },
  fileSize: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  linkIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
})
