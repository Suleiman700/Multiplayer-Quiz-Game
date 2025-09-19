import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider } from 'antd'
import './globals.css'
import { uiConfig } from '@/lib/config'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '🎮 Quiz Master - Real-time Multiplayer Quiz Game',
  description: 'Join friends in exciting real-time quiz battles! Test your knowledge across various categories.',
}

// Retro dark theme configuration - 3 colors max
const retroTheme = {
  token: {
    // 3-color retro palette: Purple, Cyan, Orange
    colorPrimary: '#8B5CF6', // Purple
    colorSuccess: '#06B6D4', // Cyan  
    colorWarning: '#F97316', // Orange
    colorError: '#F97316',   // Orange (reuse)
    colorInfo: '#06B6D4',    // Cyan (reuse)
    
    // Dark theme colors
    colorBgContainer: '#1F2937', // Dark gray
    colorBgElevated: '#374151', // Lighter dark gray
    colorBgLayout: '#111827',   // Very dark gray
    colorText: '#F9FAFB',       // Light text
    colorTextSecondary: '#D1D5DB', // Secondary light text
    colorBorder: '#4B5563',     // Gray border
    colorBorderSecondary: '#6B7280',
    
    // Typography - retro pixelated feel
    fontFamily: '"Courier New", "Monaco", monospace',
    fontSize: 14,
    fontSizeHeading1: 28,
    fontSizeHeading2: 22,
    fontSizeHeading3: 18,
    fontWeightStrong: 700,
    
    // Sharp corners for retro feel
    borderRadius: 0,     // Sharp corners
    borderRadiusLG: 4,   // Slightly rounded for larger elements
    borderRadiusSM: 0,   // Sharp for small elements
    
    // Retro shadows - more pronounced and blocky
    boxShadow: '4px 4px 0px #000000',
    boxShadowSecondary: '2px 2px 0px #000000',
    
    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    margin: 16,
    marginLG: 24,
    marginSM: 12,
    
    // Snappy animations for retro feel
    motionDurationSlow: '0.2s',
    motionDurationMid: '0.15s',
    motionDurationFast: '0.1s',
  },
  components: {
    Button: {
      borderRadius: 0,
      fontWeight: 700,
      paddingInline: 20,
      paddingBlock: 10,
      fontSize: 14,
      boxShadow: '3px 3px 0px #000000',
      textTransform: 'uppercase',
    },
    Card: {
      borderRadius: 4,
      paddingLG: 20,
      boxShadow: '4px 4px 0px #000000',
      borderWidth: 2,
      borderStyle: 'solid',
    },
    Input: {
      borderRadius: 0,
      paddingInline: 12,
      paddingBlock: 8,
      fontSize: 14,
      borderWidth: 2,
      boxShadow: '2px 2px 0px #000000',
    },
    Select: {
      borderRadius: 0,
      fontSize: 14,
    },
    Modal: {
      borderRadius: 4,
      boxShadow: '6px 6px 0px #000000',
    },
    Progress: {
      strokeLinecap: 'square',
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@300;400;700&family=Nunito:wght@300;400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <AntdRegistry>
          <ConfigProvider theme={retroTheme}>
            <div className={`${!uiConfig.animatedEffects ? 'no-anim' : ''} min-h-screen bg-gray-900`} style={{ 
              background: 'linear-gradient(135deg, #111827 0%, #1F2937 50%, #374151 100%)',
              fontFamily: '"Courier New", "Monaco", monospace'
            }}>
              {children}
            </div>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
