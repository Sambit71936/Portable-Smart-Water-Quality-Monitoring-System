import { NavLink } from 'react-router-dom'

const BottomNav = () => {
    const navItems = [
        { name: 'Dashboard', icon: 'monitoring', path: '/' },
        { name: 'History', icon: 'history', path: '/history' },
        { name: 'Analytics', icon: 'query_stats', path: '/analytics' },
        { name: 'WHO Standards', icon: 'fact_check', path: '/who-standards' },
    ]

    return (
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center pt-3 pb-8 px-4 bg-[#0d141e]/80 backdrop-blur-2xl rounded-t-[24px] border-t border-[#81ecff]/15 shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center transition-all ${isActive
                            ? 'text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.8)] scale-110'
                            : 'text-slate-500 hover:text-[#81ecff]'
                        }`
                    }
                >
                    {({ isActive }) => (
                        <>
                            <span
                                className="material-symbols-outlined mb-1"
                                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                            >
                                {item.icon}
                            </span>
                            <span className="font-['Inter'] text-[10px] font-medium tracking-wide">
                                {item.name}
                            </span>
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    )
}

export default BottomNav
