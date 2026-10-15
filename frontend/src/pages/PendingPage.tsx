import { useLocation } from 'react-router-dom'
import library from '../assets/campus-library.jpg'
import { NAV } from '../routes/nav'

export function PendingPage() {
  const { pathname } = useLocation()
  const label = NAV.find((item) => item.to === pathname)?.label ?? 'This page'

  return (
    <div className="rise grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <h1 className="max-w-[12ch] text-[clamp(2.75rem,5vw,4.5rem)]">{label} opens next</h1>
        <p className="mt-5 max-w-md text-xl text-muted">
          The service behind this page is already running. The screen for it is built in the next step, so nothing is
          missing from your account.
        </p>
      </div>
      <img
        src={library}
        alt="The Dr. Reuben Hecht Library at Ariel University"
        className="h-72 w-full object-cover lg:h-96"
        loading="lazy"
      />
    </div>
  )
}
