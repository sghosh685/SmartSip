import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import BottomNav from '../components/BottomNav'

describe('BottomNav', () => {
    test('renders Home and Stats tabs', () => {
        const mockSetTab = vi.fn()
        const mockQuickAdd = vi.fn()

        render(
            <BottomNav
                activeTab="home"
                setActiveTab={mockSetTab}
                onQuickAdd={mockQuickAdd}
                isDarkMode={false}
            />
        )

        expect(screen.getByText('Home')).toBeInTheDocument()
        expect(screen.getByText('Stats')).toBeInTheDocument()
    })

    test('Home tab is highlighted when activeTab is home', () => {
        const mockSetTab = vi.fn()
        const mockQuickAdd = vi.fn()

        render(
            <BottomNav
                activeTab="home"
                setActiveTab={mockSetTab}
                onQuickAdd={mockQuickAdd}
                isDarkMode={false}
            />
        )

        const homeButton = screen.getByText('Home').closest('button')
        expect(homeButton).toHaveClass('text-cyan-500')
    })
})
