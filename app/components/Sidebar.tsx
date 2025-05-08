'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { useChat } from '../context/ChatContext'

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: 'home' },
  { name: 'Old Proposals', href: '/dashboard/old-proposals', icon: 'proposal' },
  { name: 'Responses', href: '/dashboard/responses', icon: 'response' },
  { name: 'Chats', href: '/dashboard/chats', icon: 'chat' },
  { name: 'Notifications', href: '/dashboard/notifications', icon: 'notification' },
  { name: 'Settings', href: '/dashboard/settings', icon: 'settings' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { signOut, user, userData } = useAuth()
  const { unreadCount: notificationUnreadCount } = useNotifications()
  const { unreadCount: chatUnreadCount } = useChat()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Close mobile menu when path changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])
  
  const renderIcon = (icon: string) => {
    switch (icon) {
      case 'home':
        return (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.15833 19.25V13.75H13.8417V19.25C13.8417 19.9375 14.4042 20.5 15.0917 20.5H19.525C20.2125 20.5 20.775 19.9375 20.775 19.25V10.5H22.8417C23.4225 10.5 23.7033 9.78334 23.2458 9.39167L12.5225 0.0458374C11.9417 -0.470829 11.0583 -0.470829 10.4775 0.0458374L-0.245833 9.39167C-0.72 9.78334 -0.42 10.5 0.158333 10.5H2.225V19.25C2.225 19.9375 2.7875 20.5 3.475 20.5H7.90833C8.59583 20.5 9.15833 19.9375 9.15833 19.25V13.75H14.8417" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      case 'proposal':
        return (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.25 12.8333V5.5C19.25 3.61667 18.6517 2.75 16.5 2.75H14.6667C12.5149 2.75 11.9166 3.61667 11.9166 5.5V7.33333H8.25C6.09812 7.33333 5.49984 8.2 5.49984 10.0833V12.8333H2.74984V16.5C2.74984 18.3834 3.34811 19.25 5.49984 19.25H7.33317C9.4849 19.25 10.0832 18.3834 10.0832 16.5V10.0833C10.0832 8.2 9.4849 7.33333 7.33317 7.33333H5.49984V5.5C5.49984 3.61667 6.09812 2.75 8.25 2.75H16.5C18.6517 2.75 19.25 3.61667 19.25 5.5V12.8333H16.5V16.5C16.5 18.3834 17.0982 19.25 19.25 19.25H21.0833" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      case 'response':
        return (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.33317 19.25H14.6665C17.4165 19.25 17.9765 17.8184 18.0932 16.5092L18.7332 9.17583C18.8865 7.60583 17.9582 6.41667 16.5015 6.41667H5.49817C4.04151 6.41667 3.11317 7.60583 3.26651 9.17583L3.90651 16.5092C4.0232 17.8184 4.58317 19.25 7.33317 19.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7.33333 6.41667V5.5C7.33333 3.85833 7.33333 2.75 10.0833 2.75H11.9167C14.6667 2.75 14.6667 3.85833 14.6667 5.5V6.41667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11 15.5833V10.0833" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.25 12.8333L11 15.5833L13.75 12.8333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      case 'chat':
        return (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.25 10.5417C19.2531 11.7516 18.9701 12.9452 18.425 14.0417C17.7782 15.3192 16.7673 16.3909 15.5368 17.1518C14.3063 17.9128 12.9051 18.3328 11.4584 18.3333C10.2485 18.3365 9.05484 18.0535 7.95837 17.5083L2.75004 19.25L4.49171 14.0417C3.94651 12.9452 3.66351 11.7516 3.66671 10.5417C3.66722 9.09499 4.08722 7.69389 4.84819 6.46337C5.60916 5.23285 6.68084 4.22191 7.95837 3.57506C9.05484 3.02986 10.2485 2.74686 11.4584 2.75006H11.9167C13.8276 2.85555 15.6322 3.74522 16.9851 5.09812C18.338 6.45103 19.2277 8.25564 19.3334 10.1667V10.5417Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      case 'notification':
        return (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.5 7.33333C16.5 5.91885 15.9381 4.56229 14.9379 3.5621C13.9377 2.5619 12.5812 2 11.1667 2C9.7522 2 8.39563 2.5619 7.39544 3.5621C6.39524 4.56229 5.83334 5.91885 5.83334 7.33333C5.83334 13.75 2.75 15.5833 2.75 15.5833H19.5833C19.5833 15.5833 16.5 13.75 16.5 7.33333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12.5969 19.25C12.4278 19.5278 12.1946 19.7584 11.9163 19.9191C11.6381 20.0798 11.3243 20.1651 11.0052 20.1651C10.6861 20.1651 10.3723 20.0798 10.0941 19.9191C9.81581 19.7584 9.58264 19.5278 9.41357 19.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      case 'settings':
        return (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 14.6667C13.0251 14.6667 14.6667 13.0251 14.6667 11C14.6667 8.97492 13.0251 7.33334 11 7.33334C8.97496 7.33334 7.33337 8.97492 7.33337 11C7.33337 13.0251 8.97496 14.6667 11 14.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.3334 14.6667C18.135 15.1088 18.0642 15.6025 18.1309 16.0869C18.1976 16.5714 18.3991 17.0264 18.7084 17.4017L18.7634 17.4567C19.0155 17.7088 19.2147 18.0088 19.3503 18.3393C19.4859 18.6697 19.5555 19.0244 19.5555 19.3825C19.5555 19.7406 19.4859 20.0953 19.3503 20.4258C19.2147 20.7562 19.0155 21.0563 18.7634 21.3083C18.5113 21.5605 18.2113 21.7596 17.8808 21.8952C17.5504 22.0308 17.1957 22.1005 16.8376 22.1005C16.4794 22.1005 16.1248 22.0308 15.7943 21.8952C15.4638 21.7596 15.1638 21.5605 14.9117 21.3083L14.8567 21.2533C14.4814 20.944 14.0264 20.7425 13.542 20.6758C13.0575 20.6091 12.5638 20.68 12.1217 20.8783C11.6891 21.0672 11.3202 21.3719 11.0545 21.7583C10.7889 22.1447 10.6367 22.5977 10.6167 23.0667V23.2C10.6167 23.9223 10.3299 24.6152 9.81982 25.1253C9.30971 25.6354 8.6168 25.9222 7.89447 25.9222C7.17214 25.9222 6.47923 25.6354 5.96912 25.1253C5.45902 24.6152 5.17225 23.9223 5.17225 23.2V23.1267C5.14558 22.6441 4.97563 22.181 4.69032 21.7905C4.40501 21.4 4.01468 21.0976 3.56475 20.9183C3.12262 20.72 2.62897 20.6491 2.14451 20.7158C1.66005 20.7825 1.20505 20.984 0.829749 21.2933L0.774749 21.3483C0.52271 21.6005 0.222677 21.7996 -0.107776 21.9352C-0.438228 22.0708 -0.792902 22.1405 -1.15101 22.1405C-1.50912 22.1405 -1.86379 22.0708 -2.19424 21.9352C-2.5247 21.7996 -2.82473 21.6005 -3.07677 21.3483C-3.32881 21.0963 -3.52797 20.7963 -3.66357 20.4658C-3.79918 20.1353 -3.86886 19.7807 -3.86886 19.4225C-3.86886 19.0644 -3.79918 18.7097 -3.66357 18.3793C-3.52797 18.0488 -3.32881 17.7488 -3.07677 17.4967L-3.02177 17.4417C-2.71252 17.0663 -2.51099 16.6113 -2.44428 16.1269C-2.37758 15.6424 -2.44844 15.1488 -2.64677 14.7067C-2.83564 14.274 -3.14037 13.9051 -3.52674 13.6395C-3.9131 13.3738 -4.36612 13.2217 -4.83501 13.2017H-4.96825C-5.69058 13.2017 -6.38349 12.9149 -6.8936 12.4048C-7.4037 11.8947 -7.69047 11.2018 -7.69047 10.4795C-7.69047 9.75714 -7.4037 9.06423 -6.8936 8.55413C-6.38349 8.04402 -5.69058 7.75725 -4.96825 7.75725H-4.89502C-4.41238 7.73058 -3.94925 7.56064 -3.55877 7.27533C-3.16829 6.99001 -2.86588 6.59968 -2.68651 6.14975C-2.48818 5.70762 -2.41732 5.21397 -2.48402 4.72951C-2.55073 4.24505 -2.75225 3.79005 -3.06151 3.41475L-3.11651 3.35975C-3.36855 3.10771 -3.56771 2.80768 -3.70331 2.47723C-3.83892 2.14677 -3.9086 1.7921 -3.9086 1.434C-3.9086 1.07589 -3.83892 0.721219 -3.70331 0.390767C-3.56771 0.0603145 -3.36855 -0.239719 -3.11651 -0.491757C-2.86447 -0.743796 -2.56444 -0.942966 -2.23399 -1.07857C-1.90353 -1.21417 -1.54886 -1.28386 -1.19075 -1.28386C-0.832645 -1.28386 -0.477971 -1.21417 -0.147519 -1.07857C0.182934 -0.942966 0.482967 -0.743796 0.735005 -0.491757L0.790006 -0.436756C1.16531 -0.1275 1.62031 0.0740303 2.10477 0.140733C2.58923 0.207436 3.08288 0.136577 3.52501 -0.0617539H3.52501C3.95771 -0.250625 4.32661 -0.55536 4.59227 -0.941724C4.85793 -1.32809 5.01002 -1.78111 5.03001 -2.25V-2.38325C5.03001 -3.10558 5.31678 -3.79849 5.82688 -4.30859C6.33699 -4.81869 7.0299 -5.10547 7.75223 -5.10547C8.47456 -5.10547 9.16747 -4.81869 9.67757 -4.30859C10.1877 -3.79849 10.4744 -3.10558 10.4744 -2.38325V-2.31001C10.4944 -1.84113 10.6466 -1.3881 10.9122 -1.00174C11.1779 -0.615368 11.5468 -0.310641 11.9794 -0.121771C12.4216 0.0765051 12.9152 0.147364 13.3997 0.0806632C13.8841 0.0139621 14.3392 -0.187569 14.7144 -0.496821L14.7694 -0.551821C15.0215 -0.803859 15.3215 -1.00303 15.652 -1.13863C15.9824 -1.27424 16.3371 -1.34392 16.6952 -1.34392C17.0533 -1.34392 17.408 -1.27424 17.7384 -1.13863C18.0689 -1.00303 18.3689 -0.803859 18.621 -0.551821C18.873 -0.299782 19.0722 0.000251203 19.2078 0.330703C19.3434 0.661155 19.4131 1.01583 19.4131 1.37393C19.4131 1.73204 19.3434 2.08671 19.2078 2.41717C19.0722 2.74762 18.873 3.04765 18.621 3.29969L18.566 3.35469C18.2567 3.72999 18.0552 4.18499 17.9885 4.66945C17.9218 5.15391 17.9926 5.64756 18.1909 6.08969V6.08969C18.3798 6.52239 18.6845 6.89129 19.0709 7.15695C19.4573 7.42261 19.9103 7.5747 20.3792 7.5947H20.5125C21.2348 7.5947 21.9277 7.88148 22.4378 8.39158C22.9479 8.90168 23.2347 9.59459 23.2347 10.3169C23.2347 11.0393 22.9479 11.7322 22.4378 12.2423C21.9277 12.7524 21.2348 13.0392 20.5125 13.0392H20.4392C19.9703 13.0591 19.5173 13.2113 19.1309 13.477C18.7446 13.7426 18.4398 14.1115 18.251 14.5442" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      default:
        return null
    }
  }

  // Pripremamo ime za prikaz
  const displayName = userData?.full_name || user?.email || 'User'
  // Pripremamo inicijal za avatar
  const avatarInitial = userData?.full_name 
    ? userData.full_name.charAt(0).toUpperCase() 
    : user?.email?.charAt(0).toUpperCase() || 'U'

  return (
    <>
      {/* Mobile header with menu toggle */}
      <div className="md:hidden flex items-center justify-between p-4 bg-background border-b border-white/10 sticky top-0 z-20">
        <div className="flex items-center">
          <Image 
            src="https://fbmdbvijfufsjpsuorxi.supabase.co/storage/v1/object/public/company-logos/logos/Vector.svg" 
            alt="Logo" 
            width={32} 
            height={32} 
            className="navbar-logo" 
          />
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white p-2"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>

      {/* Sidebar - hidden on mobile unless menu is open */}
      <div className={` 
        mobile-navbar fixed md:sticky top-0 left-0 z-10 h-full
        bg-[#080808] border-r border-white/10 
        transition-all duration-300 ease-in-out overflow-y-auto
        md:w-64 md:min-h-screen md:p-6 md:flex md:flex-col md:translate-x-0
        ${isMobileMenuOpen ? 'w-[85%] max-w-xs p-5 translate-x-0' : 'w-0 -translate-x-full'}
      `}>
        {/* Logo - hidden on mobile (shown in header) */}
        <div className="mb-10 hidden md:block">
          <Image 
            src="https://fbmdbvijfufsjpsuorxi.supabase.co/storage/v1/object/public/company-logos/logos/Vector.svg" 
            alt="Logo" 
            width={40} 
            height={40} 
            className="navbar-logo" 
          />
        </div>

        {/* Navigation */}
        <nav className={`space-y-3 flex-1 ${isMobileMenuOpen ? 'block' : 'hidden md:block'}`}>
          {navigationItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                  ? 'text-[#FFB900] bg-white/5' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`mr-3 ${isActive ? 'text-[#FFB900]' : 'text-white/60'}`}>
                  {renderIcon(item.icon)}
                </span>
                <span className="text-sm md:text-base">{item.name}</span>
                {item.name === 'Notifications' && notificationUnreadCount > 0 && (
                  <span className="ml-auto bg-[#FFB900] text-black text-xs font-medium px-2 py-0.5 rounded-full">
                    {notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}
                  </span>
                )}
                {item.name === 'Chats' && chatUnreadCount > 0 && (
                  <span className="ml-auto bg-[#FFB900] text-black text-xs font-medium px-2 py-0.5 rounded-full">
                    {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User profile */}
        <div className={`mt-auto pt-5 border-t border-white/10 ${isMobileMenuOpen ? 'block' : 'hidden md:block'}`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-700 rounded-full overflow-hidden flex items-center justify-center text-white">
              {userData?.avatar_url ? (
                <Image 
                  src={userData.avatar_url}
                  alt="User avatar"
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span>{avatarInitial}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {displayName}
              </p>
            </div>
            <button 
              onClick={signOut}
              className="text-gray-400 hover:text-white"
              aria-label="Sign out"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.3333 14.1667L17.5 10L13.3333 5.83334" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17.5 10H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile overlay to close sidebar when clicking outside */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/70 z-0"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
} 