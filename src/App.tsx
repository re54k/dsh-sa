import { AppRouter } from '@/components/app/AppRouter'
import { AppModal } from '@/components/app/AppModal'
import { AppToast } from '@/components/app/AppToast'
import { AppVersion } from '@/components/app/AppVersion'

export const App = () => {
  return (
    <>
      <AppRouter />
      <AppModal />
      <AppToast />
      <AppVersion />
    </>
  )
}
