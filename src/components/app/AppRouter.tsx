import { useEffect } from 'react'
import mnb from '@mf2e/mnb'
import { pages } from '@/pages'
import { usePageStore } from '@/store/modules/app/page'

export const AppRouter = () => {
  const pageConfig = usePageStore((s) => s.pageConfig)

  const PageComponent = pages.find((item) => item.page === pageConfig.page)?.component

  useEffect(() => {
    if (!PageComponent) {
      mnb('navigator.close')
      mnb('navigator.open', { path: `nc/update` })
    }
  }, [PageComponent])

  return PageComponent && <PageComponent {...pageConfig.params} />
}
