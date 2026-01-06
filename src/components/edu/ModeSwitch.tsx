import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Stethoscope, GraduationCap, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMode } from '@/contexts/ModeContext';
import { cn } from '@/lib/utils';

export function ModeSwitch() {
  const { mode, setMode } = useMode();
  const navigate = useNavigate();
  const location = useLocation();

  const isEducationRoute = location.pathname.startsWith('/edu');

  const handleModeChange = (newMode: 'clinical' | 'education') => {
    setMode(newMode);
    if (newMode === 'education' && !isEducationRoute) {
      navigate('/edu');
    } else if (newMode === 'clinical' && isEducationRoute) {
      navigate('/pacientes');
    }
  };

  const currentMode = isEducationRoute ? 'education' : mode;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex items-center gap-2 px-3",
            currentMode === 'education' && "text-primary"
          )}
        >
          {currentMode === 'clinical' ? (
            <>
              <Stethoscope className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Clínica</span>
            </>
          ) : (
            <>
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Educação</span>
            </>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => handleModeChange('clinical')}
          className={cn(
            "flex items-center gap-2 cursor-pointer",
            currentMode === 'clinical' && "bg-accent"
          )}
        >
          <Stethoscope className="h-4 w-4" />
          <div className="flex flex-col">
            <span className="font-medium">Clínica</span>
            <span className="text-xs text-muted-foreground">Atendimento clínico</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleModeChange('education')}
          className={cn(
            "flex items-center gap-2 cursor-pointer",
            currentMode === 'education' && "bg-accent"
          )}
        >
          <GraduationCap className="h-4 w-4" />
          <div className="flex flex-col">
            <span className="font-medium">Educação</span>
            <span className="text-xs text-muted-foreground">Academy & Treinamento</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
