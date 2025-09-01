import { renderLoginTab } from './authTabs/login'
import { renderSignupTab } from './authTabs/signup'
import { renderTwofaTab } from './authTabs/twofa'

export function renderAuth(active: 'login' | 'signup' | '2fa', onTwofaSubmit?: (code: string, err: HTMLElement)=>Promise<void>) {
    switch (active) {
    case 'signup': return renderSignupTab()
    case '2fa':    return renderTwofaTab(onTwofaSubmit || (async ()=>{}))
    default:       return renderLoginTab()
    }
}