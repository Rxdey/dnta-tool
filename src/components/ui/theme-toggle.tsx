import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';

export const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="h-8 w-8 px-0 hover:bg-muted"
        >
            <i className="i-lucide-sun h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <i className="i-lucide-moon absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">切换主题</span>
        </Button>
    );
};